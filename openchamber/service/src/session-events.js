/**
 * 自动回填：宿主把 turn-finished 事件 POST 到 service 的 /session-events，
 * 这里把 agent 这一轮的最终答复写成 Plane 评论。
 *
 * 关键事实（SDK 核对）：
 *   - content: true（transcript 授权）时事件带 reply，上限 64000 字符，超长有 replyTruncated
 *   - 没有「读会话全部消息」的 API，所以自动回填只能拿到「最后一轮的答复」
 *   - 去重必须自己做：Plane 没有唯一约束，宿主可能重复投递
 */
import { readSessionEventRequest, SESSION_EVENTS_PATH, SESSION_EVENTS_WIRE_VERSION } from "@openchamber/sdk";
import { loadConfig } from "./config.js";
import { addComment } from "./plane.js";
import { readBindings } from "./session.js";

export const SESSION_EVENTS_ROUTE = SESSION_EVENTS_PATH;

/** 已回填过的 (workItemId, sessionId, eventAt)，防宿主重复投递。 */
const seen = new Set();

/** 截断的答复要在评论里说明，避免「看起来完整」的假象。 */
function replyText(reply, truncated) {
  const cut = truncated ? "\n\n（⚠ 答复超过 64000 字符被截断，以上是前半部分）" : "";
  return `${reply}${cut}`;
}

export async function handleSessionEvent(env, rawBody) {
  const event = readSessionEventRequest(rawBody);
  if (!event) return { status: 400, body: { ok: false, error: { code: "BAD_EVENT", message: "不是这个版本的事件信封" } } };

  if (event.event.type !== "turn-finished") return { status: 200, body: { ok: true } };

  const sessionId = event.event.session.id;
  const binding = readBindings()[String(sessionId)];
  if (!binding) return { status: 200, body: { ok: true, skipped: "未绑定工作项" } };

  const cfgRaw = (await loadConfig(env)) || {};
  if (cfgRaw.autoBackfill === false) {
    return { status: 200, body: { ok: true, skipped: "自动回填已关闭" } };
  }

  const content = event.content || {};
  if (typeof content.reply !== "string") {
    return { status: 200, body: { ok: true, skipped: "没有答复内容" } };
  }

  const key = `${binding.workItemId}|${sessionId}|${event.event.at}`;
  if (seen.has(key)) return { status: 200, body: { ok: true, dedup: true } };
  seen.add(key);

  let body = replyText(content.reply, content.replyTruncated);
  if (body.trim().length > 4000) {
    body = body.slice(0, 4000).trimEnd() + "\n\n（⚠ 自动回填只保留前 4000 字符，全文看会话）";
  }

  try {
    const comment = await addComment(
      { baseUrl: cfgRaw.baseUrl, apiKey: cfgRaw.apiKey, workspace: cfgRaw.workspace, apiVersion: cfgRaw.apiVersion },
      binding.projectId,
      binding.workItemId,
      body,
      { sessionId },
    );
    return { status: 200, body: { ok: true, commentId: comment.id, workItemId: binding.workItemId } };
  } catch (e) {
    // 写失败：让面板退回手动草稿，但事件本身「已处理」
    seen.delete(key);
    const code = e.code || "PLANE_ERROR";
    console.error(`[plane] 自动回填失败 ${code}: ${e.message}`);
    return { status: 200, body: { ok: true, error: { code, message: e.message } } };
  }
}
