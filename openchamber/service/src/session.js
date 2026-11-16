/**
 * 会话侧：由 service 发起会话（能指定 model / variant / agent），
 * 以及需要时先建一个全新 worktree。
 *
 * 为什么不走面板的 startSession：iframe 那条路只支持 projectId + worktree，
 * 没有 model / variant / agent；service 的 sessions.start 反过来没有 worktree。
 * 所以：要三件套或新 worktree → 走这里；都不要 → 面板那条更轻。
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";

const exec = promisify(execFile);

/** 调宿主：createServiceHost 每次都会 POST 到回调地址，注入 env 就够。 */
export async function createHost(env) {
  const { createServiceHost } = await import("@openchamber/sdk");
  return createServiceHost({ env });
}

/** 在仓库里建一个 worktree：<repo>/.worktrees/<name>，分支 oc/<name>。 */
export async function createWorktree({ directory, name, baseBranch }) {
  if (!directory) throw Object.assign(new Error("要建 worktree 就得知道仓库目录"), { code: "BAD_CONFIG" });
  const safe = String(name || "").trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safe) throw Object.assign(new Error("worktree 名称不能为空"), { code: "BAD_CONFIG" });

  const target = join(directory, ".worktrees", safe);
  const branch = `oc/${safe}`;
  const args = ["worktree", "add", "-B", branch, target];
  if (baseBranch) args.push(baseBranch);

  try {
    await exec("git", args, { cwd: directory, timeout: 60_000 });
  } catch (e) {
    const detail = (e.stderr || e.message || "").toString().split("\n")[0];
    throw Object.assign(new Error(`建 worktree 失败：${detail}`), { code: "WORKTREE_FAILED" });
  }
  return { directory: target, branch };
}

/**
 * 发起会话。给了 worktree 就先建目录，再把 directory 传给宿主。
 * 返回 { sessionId, directory, worktree }。
 */
export async function startSession(env, input) {
  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw Object.assign(new Error("prompt 不能为空"), { code: "BAD_CONFIG" });

  let directory = input.directory || undefined;
  let worktree = null;
  if (input.worktree && (input.worktree.name || input.worktree.create)) {
    worktree = await createWorktree({
      directory: input.directory,
      name: input.worktree.name || input.workItemIdentifier || "task",
      baseBranch: input.worktree.baseBranch || undefined,
    });
    directory = worktree.directory;
  }

  const host = await createHost(env);
  const started = await host.sessions.start({
    prompt,
    ...(directory ? { directory } : { projectId: input.projectId }),
    ...(input.title ? { title: input.title } : {}),
    ...(input.model ? { model: input.model } : {}),
    ...(input.variant && input.variant !== "default" ? { variant: input.variant } : {}),
    ...(input.agent ? { agent: input.agent } : {}),
  });

  return { sessionId: started.sessionId, directory: started.directory ?? directory ?? null, worktree };
}

/* ---------------- 08 片：会话 → 工作项 的映射 ---------------- */

const bindings = new Map(); // sessionId → { workItemId, projectId }

export function rememberBinding(sessionId, { workItemId, projectId }) {
  if (sessionId && workItemId && projectId) {
    bindings.set(String(sessionId), { workItemId: String(workItemId), projectId: String(projectId) });
  }
}

export function readBindings() {
  return Object.fromEntries(bindings.entries());
}
