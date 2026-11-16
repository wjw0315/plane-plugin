/**
 * 配置存取。
 *
 * 为什么不用 OpenChamber 的 Integrations 卡片：平台的 integration 要求
 * `token.apiOrigin` 必须是 https，自托管 Plane 常跑在局域网 http 上，填不进去。
 * 所以配置由面板里的设置表单收，落在 service 自己的数据目录（600），
 * 面板只拿到脱敏后的视图（有没有 Key、地址、workspace），拿不到 Key 本身。
 */
import { readFile, writeFile, mkdir, chmod } from "node:fs/promises";
import { dirname, join } from "node:path";

export function configPath(env) {
  const dir = env.OPENCHAMBER_SERVICE_DATA_DIR || join(process.cwd(), ".plane-data");
  return join(dir, "config.json");
}

export async function loadConfig(env) {
  try {
    const raw = await readFile(configPath(env), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveConfig(env, cfg) {
  const file = configPath(env);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });
  await chmod(file, 0o600);
  return cfg;
}

/** 给面板看的脱敏视图：不含 API Key。 */
export function maskConfig(cfg) {
  if (!cfg) return { configured: false, baseUrl: "", workspace: "", apiVersion: "v2", hasKey: false };
  const baseUrl = String(cfg.baseUrl || "");
  const workspace = String(cfg.workspace || "");
  const hasKey = Boolean(cfg.apiKey);
  return {
    configured: Boolean(baseUrl && hasKey && workspace),
    baseUrl,
    workspace,
    apiVersion: String(cfg.apiVersion || "v2"),
    hasKey,
    autoBackfill: cfg.autoBackfill !== false,
  };
}

/**
 * 合并保存：传入的非空字符串才覆盖（空 = 保持不变），布尔直接覆盖。
 * 这样面板改配置时留空的 API Key 不会把已存的 Key 冲掉。
 */
export async function mergeConfig(env, incoming = {}) {
  const current = (await loadConfig(env)) || {};
  const out = { ...current };
  // 与 normalizeConfig 相同的校验：地址带 /api 后缀是常见误填，直接拒绝
  if (typeof incoming.baseUrl === "string" && incoming.baseUrl.trim()) {
    const base = incoming.baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(base) || /\/api(\/v\d)?$/i.test(base)) {
      throw Object.assign(new Error("地址要以 http(s):// 开头，且不要带 /api 或 /api/v1 后缀"), { code: "BAD_CONFIG" });
    }
  }
  for (const [k, v] of Object.entries(incoming)) {
    if (k === "autoBackfill") {
      if (typeof v === "boolean") out.autoBackfill = v;
      continue;
    }
    if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
  }
  await saveConfig(env, out);
  return out;
}
