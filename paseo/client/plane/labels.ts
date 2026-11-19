/** 标签相关的解析工具（设计稿 §3.1）。 */

/** 标签 id 的形态（uuid / 长十六进制），这类标签没有可读信息，不渲染成 chip。 */
const ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 从标签里解析关联的 Paseo 会话 id。
 *
 * 约定标签名为 `paseo-<agentId>`（见 server/plane-api.ts resolveSessionAgentId），
 * 命中则直接拿后缀当 agentId，不额外发 RPC（设计稿 §3.1）。
 */
export function extractSessionAgentId(labels: string[]): string | null {
  for (const label of labels) {
    const matched = /^paseo-(.+)$/i.exec(label);
    if (matched) return matched[1];
  }
  return null;
}

/**
 * 过滤掉 id 形态的标签。
 *
 * 契约里 workItem.labels 是标签 uuid（见 server/plane-api.ts mapWorkItem），
 * 直接展示会是一串无意义 id，故只保留可读标签名的部分。
 */
export function readableLabels(labels: string[]): string[] {
  return labels.filter((label) => !ID_LIKE.test(label));
}
