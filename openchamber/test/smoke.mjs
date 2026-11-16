/**
 * 冒烟测试，不依赖 OpenChamber。
 *
 * 覆盖：
 *   A. manifest 能被宿主自己的解析器接受，入口文件都在
 *   B. service 契约：Bearer、/health、SIGTERM
 *   C. 02 片：配置存取（脱敏）+ 列项目 + 三种错误面 + 网络重试一次
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, access, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseManifestJson } from "@openchamber/sdk/schemas";

const exec = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const entry = join(root, "service", "main.cjs");
const PORT = 18791;
const TOKEN = "smoke-token";
const PLANE_PORT = 18792;
const CALLBACK_PORT = 18793;

let failed = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failed++;
}

/* ---------------- A. manifest ---------------- */

async function checkManifest() {
  const raw = await readFile(join(root, "package.json"), "utf8");
  const parsed = parseManifestJson(raw);
  check("manifest 能被 SDK 解析", parsed.ok === true, parsed.ok ? "" : JSON.stringify(parsed).slice(0, 300));
  if (!parsed.ok) return;
  const m = parsed.manifest;
  check("apiVersion = 1", m.apiVersion === 1);
  check("有 panel 入口", Boolean(m.contributes?.panel?.entry));
  check("有 service 入口且 runtime = host", Boolean(m.contributes?.service?.entry) && m.contributes?.service?.runtime === "host");
  for (const f of [m.contributes?.panel?.entry, m.contributes?.service?.entry, "panel/main.js"].filter(Boolean)) {
    let ok = true;
    try { await access(join(root, f)); } catch { ok = false; }
    check(`入口文件存在：${f}`, ok);
  }
}

/* ---------------- 假 Plane ---------------- */

const plane = { mode: "ok", hits: 0, patches: [], labels: [], comments: [] };
const host = { starts: [] };
const fakePlane = http.createServer((req, res) => {
  plane.hits++;
  const path = (req.url || "").split("?")[0];
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (plane.mode === "unauthorized") return json(401, { error: "unauthorized" });
  if (plane.mode === "boom") return json(500, { error: "boom" });
  if (plane.mode === "flaky" && plane.hits === 1) return json(500, { error: "first fails" });
  if (req.headers["x-api-key"] !== "test-key") return json(401, { error: "no key" });
  if (req.method === "GET" && path === "/api/v1/workspaces/g2/projects/") {
    return json(200, { results: [{ id: "p1", name: "xlm-scrm", identifier: "XLMSC" }, { id: "p2", name: "内部", identifier: "IN" }] });
  }
  if (req.method === "POST" && path === "/api/v1/workspaces/g2/projects/p1/issues/i1/comments/") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      plane.comments.push(body);
      json(201, { id: "cm-1", created_at: "2026-11-16T10:30:00Z", comment_html: body.comment_html });
    });
    return;
  }
  if (req.method === "GET" && path === "/api/v1/workspaces/g2/projects/p1/labels/") {
    return json(200, { results: plane.labels });
  }
  if (req.method === "POST" && path === "/api/v1/workspaces/g2/projects/p1/labels/") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      const label = { id: "lb-" + plane.labels.length, name: body.name };
      plane.labels.push(label);
      json(201, label);
    });
    return;
  }
  if (req.method === "GET" && path === "/api/v1/workspaces/g2/projects/p1/states/") {
    return json(200, { results: [
      { id: "s2", name: "Todo", sequence: 2000, color: "#333" },
      { id: "s1", name: "Backlog", sequence: 1000, color: "#aaa" },
    ] });
  }
  if (req.method === "GET" && path === "/api/v1/workspaces/g2/projects/p1/issues/") {
    return json(200, { results: [
      { id: "i1", name: "任务A", state: "s1", sequence_id: 12, priority: "high",
        assignees: [{ id: "u1", display_name: "王五" }], labels: [{ id: "l1", name: "后端" }] },
    ] });
  }
  if (req.method === "GET" && path === "/api/v1/workspaces/g2/projects/p1/issues/i1/") {
    return json(200, {
      id: "i1", name: "任务A", state: "s1", sequence_id: 12, priority: "high",
      assignees: [], labels: [], description_html: "<p>第二页重复</p><ul><li>复现：翻到第 2 页</li></ul>",
    });
  }
  if (req.method === "PATCH" && path === "/api/v1/workspaces/g2/projects/p1/issues/i1/") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      plane.patches.push(body);
      json(200, { id: "i1", name: "任务A", state: body.state ?? "s1", sequence_id: 12, priority: "high",
        assignees: [], labels: body.labels ?? [] });
    });
    return;
  }
  json(404, { error: "not found" });
});

/* ---------------- service ---------------- */

const fakeHost = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = JSON.parse(raw || "{}");
    if (body.method === "sessions.start") {
      host.starts.push(body.input);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: { sessionId: "ses_test", directory: body.input.directory ?? "/tmp/oc-proj" } }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ result: { settings: {} } }));
  });
});

const dataDir = await mkdtemp(join(tmpdir(), "plane-data-"));
const child = spawn(process.execPath, [entry], {
  env: {
    ...process.env,
    OPENCHAMBER_SERVICE_PORT: String(PORT),
    OPENCHAMBER_SERVICE_TOKEN: TOKEN,
    OPENCHAMBER_SERVICE_DATA_DIR: dataDir,
    OPENCHAMBER_HOST_CALLBACK_URL: `http://127.0.0.1:${CALLBACK_PORT}`,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", (d) => process.stdout.write(`      | ${d}`));
child.stderr.on("data", (d) => process.stderr.write(`      ! ${d}`));

async function call(path, { method = "GET", body, token = TOKEN } = {}) {
  const res = await fetch(`http://127.0.0.1:${PORT}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

async function waitForHealth(timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await call("/health");
      if (r.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

try {
  await checkManifest();

  await new Promise((r) => fakePlane.listen(PLANE_PORT, "127.0.0.1", r));
  await new Promise((r) => fakeHost.listen(CALLBACK_PORT, "127.0.0.1", r));
  check("service 起来并 /health 就绪", await waitForHealth());

  /* ---------------- B. service 契约 ---------------- */

  const withToken = await call("/health");
  check("带 token → 200", withToken.status === 200 && withToken.body?.ok === true);
  check("不带 token → 401", (await call("/health", { token: null })).status === 401);
  check("错 token → 401", (await call("/health", { token: "nope" })).status === 401);
  check("未知路由 → 404", (await call("/nope")).status === 404);

  /* ---------------- C. 02 片 ---------------- */

  const cfg0 = await call("/config");
  check("初始未配置", cfg0.status === 200 && cfg0.body?.config?.configured === false);

  const noCfg = await call("/projects", { method: "POST" });
  check("未配置列项目 → CONFIG_MISSING", noCfg.status === 400 && noCfg.body?.error?.code === "CONFIG_MISSING", JSON.stringify(noCfg.body?.error));

  const saved = await call("/config", {
    method: "POST",
    body: {
      baseUrl: `http://127.0.0.1:${PLANE_PORT}`,
      apiKey: "test-key",
      workspace: "g2",
      apiVersion: "v1",
    },
  });
  check("保存配置 → configured", saved.status === 200 && saved.body?.config?.configured === true);
  check("返回体不含 API Key", !JSON.stringify(saved.body).includes("test-key"));

  plane.mode = "ok";
  plane.hits = 0;
  const projects = await call("/projects", { method: "POST" });
  check(
    "列项目成功（v1）",
    projects.status === 200 && projects.body?.projects?.length === 2 && projects.body.projects[0].identifier === "XLMSC",
    JSON.stringify(projects.body).slice(0, 160),
  );

  plane.mode = "unauthorized";
  const unauth = await call("/projects", { method: "POST" });
  check("Key 无效 → AUTH_FAILED", unauth.status === 401 && unauth.body?.error?.code === "AUTH_FAILED");

  plane.mode = "boom";
  plane.hits = 0;
  const boom = await call("/projects", { method: "POST" });
  check("Plane 500 → NETWORK", boom.status === 502 && boom.body?.error?.code === "NETWORK");
  check("网络类错误只重试一次（共两次请求）", plane.hits === 2, `hits=${plane.hits}`);

  /* ---------------- 03 片：状态 / 工作项 / 改状态 ---------------- */

  plane.mode = "ok";
  const states = await call("/states", { method: "POST", body: { projectId: "p1" } });
  check(
    "列状态并按 sequence 排序",
    states.status === 200 && states.body?.states?.length === 2 && states.body.states[0].id === "s1",
    JSON.stringify(states.body).slice(0, 160),
  );

  const items = await call("/work-items", { method: "POST", body: { projectId: "p1" } });
  const first = items.body?.items?.[0];
  check(
    "列工作项（v1 用 sequence_id 当编号）",
    items.status === 200 && first?.identifier === "12" && first?.stateId === "s1" && first?.priority === "high",
    JSON.stringify(first),
  );

  plane.patches = [];
  const patched = await call("/patch-state", { method: "POST", body: { projectId: "p1", workItemId: "i1", stateId: "s2" } });
  check("改状态成功并回传新状态", patched.status === 200 && patched.body?.item?.stateId === "s2", JSON.stringify(patched.body).slice(0, 160));
  check("打到 Plane 的 body 是 {state}", JSON.stringify(plane.patches[0]) === '{"state":"s2"}', JSON.stringify(plane.patches[0]));

  const missingItem = await call("/patch-state", { method: "POST", body: { projectId: "p1", workItemId: "nope", stateId: "s2" } });
  check("改不存在的工作项 → NOT_FOUND", missingItem.status === 404 && missingItem.body?.error?.code === "NOT_FOUND");

  /* ---------------- 05 片：单条工作项 + 描述 ---------------- */

  const one = await call("/work-item", { method: "POST", body: { projectId: "p1", workItemId: "i1" } });
  check(
    "取单条工作项带描述",
    one.status === 200 && one.body?.item?.identifier === "12" && /第二页重复/.test(one.body?.description || ""),
    JSON.stringify(one.body?.description || "").slice(0, 120),
  );
  check(
    "描述 HTML 转成带换行/列表的纯文本",
    /复现：翻到第 2 页/.test(one.body?.description || "") && /\n- /.test(one.body?.description || ""),
    JSON.stringify(one.body?.description || ""),
  );

  const oneMissing = await call("/work-item", { method: "POST", body: { projectId: "p1", workItemId: "nope" } });
  check("取不存在的工作项 → NOT_FOUND", oneMissing.status === 404 && oneMissing.body?.error?.code === "NOT_FOUND");

  const badPatch = await call("/patch-state", { method: "POST", body: { projectId: "p1" } });
  check("缺参数 → BAD_CONFIG", badPatch.status === 400 && badPatch.body?.error?.code === "BAD_CONFIG");

  /* ---------------- 06 片：发起会话 + 绑定 ---------------- */

  plane.mode = "ok";
  host.starts = [];
  const started = await call("/session-start", {
    method: "POST",
    body: {
      prompt: "XLMSC-12 任务A\n\n做点什么\n\n完成后总结",
      projectId: "ocproj",
      title: "XLMSC-12 任务A",
      model: "magpie/glm-5.3",
      variant: "high",
      agent: "build",
    },
  });
  check("service 发起会话返回 sessionId", started.status === 200 && started.body?.sessionId === "ses_test", JSON.stringify(started.body).slice(0, 160));
  const sent = host.starts[0] || {};
  check(
    "三件套透传给宿主",
    sent.model === "magpie/glm-5.3" && sent.variant === "high" && sent.agent === "build" && sent.projectId === "ocproj",
    JSON.stringify(sent).slice(0, 200),
  );

  // 全新 worktree：用临时 git 仓库验
  const repo = await mkdtemp(join(tmpdir(), "oc-repo-"));
  await exec("git", ["init", "-q", "-b", "main"], { cwd: repo });
  await exec("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "init"], { cwd: repo });
  host.starts = [];
  const wt = await call("/session-start", {
    method: "POST",
    body: { prompt: "做点事", directory: repo, worktree: { name: "task-12", baseBranch: "main" } },
  });
  const wtDir = join(repo, ".worktrees", "task-12");
  const wtExists = await import("node:fs/promises").then((fs) => fs.access(wtDir).then(() => true, () => false));
  check("建出 worktree 目录", wt.status === 200 && wtExists, JSON.stringify(wt.body).slice(0, 160));
  check("发起的是 worktree 目录", (host.starts[0] || {}).directory === wtDir, JSON.stringify(host.starts[0] || {}).slice(0, 160));
  check("返回值带 worktree 信息", wt.body?.worktree?.directory === wtDir);

  // 绑定：建标签 + 合并 labels + 推状态
  plane.labels = [];
  plane.patches = [];
  const bound = await call("/bind-session", {
    method: "POST",
    body: { projectId: "p1", workItemId: "i1", sessionId: "ses_test", stateId: "s3" },
  });
  check("绑定成功并回传标签", bound.status === 200 && bound.body?.label?.name === "oc-ses_test", JSON.stringify(bound.body).slice(0, 160));
  check("标签是新建的（项目级）", plane.labels.length === 1 && plane.labels[0].name === "oc-ses_test");
  const bindPatch = plane.patches[0] || {};
  check(
    "PATCH 同时带 labels 与 state",
    Array.isArray(bindPatch.labels) && bindPatch.labels.length === 1 && bindPatch.state === "s3",
    JSON.stringify(bindPatch),
  );

  /* ---------------- 07 片：手动回填结论 ---------------- */

  plane.mode = "ok";
  plane.comments = [];
  const commented = await call("/comment", {
    method: "POST",
    body: { projectId: "p1", workItemId: "i1", body: "已补两列。\n\n验证：3 个月样本通过。", sessionId: "ses_test" },
  });
  check("回填评论成功", commented.status === 200 && commented.body?.comment?.id === "cm-1", JSON.stringify(commented.body).slice(0, 160));
  const html = plane.comments[0]?.comment_html || "";
  check(
    "评论 HTML 带会话来源与分段",
    html.includes("ses_test") && html.includes("<p>已补两列。</p>") && html.includes("<p>验证：3 个月样本通过。</p>"),
    html.slice(0, 220),
  );

  const emptyComment = await call("/comment", { method: "POST", body: { projectId: "p1", workItemId: "i1", body: "   " } });
  check("空草稿 → BAD_CONFIG", emptyComment.status === 400 && emptyComment.body?.error?.code === "BAD_CONFIG");

  plane.mode = "unauthorized";
  const deniedComment = await call("/comment", { method: "POST", body: { projectId: "p1", workItemId: "i1", body: "x" } });
  check("Plane 401 → AUTH_FAILED", deniedComment.status === 401 && deniedComment.body?.error?.code === "AUTH_FAILED");

  plane.mode = "ok";
  const badUrl = await call("/config", {
    method: "POST",
    body: { baseUrl: "http://127.0.0.1:18792/api/v1", apiKey: "k", workspace: "g2" },
  });
  check("地址带 /api 后缀 → BAD_CONFIG", badUrl.status === 400 && badUrl.body?.error?.code === "BAD_CONFIG", JSON.stringify(badUrl.body?.error));
} finally {
  fakePlane.close();
  fakeHost.close();
  const exited = new Promise((resolve) => child.once("exit", (code, sig) => resolve({ code, sig })));
  child.kill("SIGTERM");
  const res = await Promise.race([exited, new Promise((r) => setTimeout(() => r(null), 5000))]);
  check("SIGTERM 后 5 秒内退出", res !== null, res ? `code=${res.code}` : "超时未退出");
  if (res === null) child.kill("SIGKILL");
}

console.log(failed === 0 ? "\n全部通过" : `\n${failed} 项失败`);
process.exit(failed === 0 ? 0 : 1);
