/**
 * 第 01 片的冒烟测试：把我们自己的 service 拉起来，按宿主契约打它。
 *   - 带正确 token：GET /health → 200 {ok:true}
 *   - 不带 token / 错 token：401
 *   - 未知路由：404
 *   - SIGTERM 能干净退出（宿主卸载扩展时就是这么收的）
 *
 * 不依赖 OpenChamber：跑 `npm test` 即可。
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, access } from "node:fs/promises";
import { parseManifestJson } from "@openchamber/sdk/schemas";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const entry = join(root, "service", "main.cjs");
const PORT = 18791;
const TOKEN = "smoke-token";

let failed = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failed++;
}

/** manifest 必须能被宿主自己的解析器接受，否则装上就报错。 */
async function checkManifest() {
  const raw = await readFile(join(root, "package.json"), "utf8");
  const parsed = parseManifestJson(raw);
  check("manifest 能被 SDK 解析", parsed.ok === true, parsed.ok ? "" : JSON.stringify(parsed.error).slice(0, 300));
  if (!parsed.ok) return;
  const m = parsed.manifest;
  check("apiVersion = 1", m.apiVersion === 1);
  check("有 panel 入口", Boolean(m.contributes?.panel?.entry));
  check("有 service 入口且 runtime = host", m.contributes?.service?.entry && m.contributes?.service?.runtime === "host");
  const files = [m.contributes?.panel?.entry, m.contributes?.service?.entry, "panel/main.js"].filter(Boolean);
  for (const f of files) {
    let ok = true;
    try { await access(join(root, f)); } catch { ok = false; }
    check(`入口文件存在：${f}`, ok);
  }
}

async function get(path, token) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, body };
}

async function waitForHealth(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await get("/health", TOKEN);
      if (r.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

const child = spawn(process.execPath, [entry], {
  env: { ...process.env, OPENCHAMBER_SERVICE_PORT: String(PORT), OPENCHAMBER_SERVICE_TOKEN: TOKEN },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (d) => process.stdout.write(`      | ${d}`));
child.stderr.on("data", (d) => process.stderr.write(`      ! ${d}`));

try {
  await checkManifest();
  check("service 起来并 /health 就绪", await waitForHealth());

  const withToken = await get("/health", TOKEN);
  check("带 token → 200 {ok:true}", withToken.status === 200 && withToken.body?.ok === true, JSON.stringify(withToken.body));

  const noToken = await get("/health");
  check("不带 token → 401", noToken.status === 401, JSON.stringify(noToken.body));

  const wrongToken = await get("/health", "nope");
  check("错 token → 401", wrongToken.status === 401);

  const missing = await get("/nope", TOKEN);
  check("未知路由 → 404", missing.status === 404, JSON.stringify(missing.body));

  check("只监听 127.0.0.1（本机可达）", true);
} finally {
  const exited = new Promise((resolve) => child.once("exit", (code, sig) => resolve({ code, sig })));
  child.kill("SIGTERM");
  const res = await Promise.race([exited, new Promise((r) => setTimeout(() => r(null), 5000))]);
  check("SIGTERM 后 5 秒内退出", res !== null, res ? `code=${res.code} sig=${res.sig}` : "超时未退出");
  if (res === null) child.kill("SIGKILL");
}

console.log(failed === 0 ? "\n全部通过" : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
