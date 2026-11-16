/**
 * Plane 扩展的面板（OpenChamber 沙箱 iframe）。
 *
 * 02 片：配置表单 → 列项目 → 三种错误面 → 记住项目。
 * 这一版加上了「看得见的过程」：每次调用都记下方法/路径/状态/错误码，
 * 保存按钮点下去立刻有反馈，异常也会画到界面上（不再只是控制台里一声不响）。
 */
import { connectHost } from "@openchamber/sdk";

const BUILD = "0.2.1+diag";
const host = connectHost();
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "plane.project";

const state = {
  phase: "boot", // boot | nohost | setup | loading | list | empty | error
  config: null,
  projects: [],
  selected: null,
  error: null,
  saveState: "", // 保存按钮旁边的即时反馈
  lastCall: null, // { method, path, status, code, message }
  calls: [], // 最近 8 次调用，诊断用
};

/* ---------------- 诊断 ---------------- */

function record(entry) {
  state.lastCall = entry;
  state.calls.unshift(entry);
  state.calls = state.calls.slice(0, 8);
  console.log(`[plane] ${entry.method} ${entry.path} → ${entry.status}${entry.code ? " " + entry.code : ""}`);
}

function paintCrash(text) {
  const box = $("crash");
  if (!box) return;
  box.hidden = false;
  box.textContent = text;
}

window.addEventListener("error", (e) => {
  paintCrash(`面板脚本出错：${e.message}`);
});
window.addEventListener("unhandledrejection", (e) => {
  const r = e.reason;
  paintCrash(`未处理的异步错误：${r?.code ? r.code + "：" : ""}${r?.message || String(r)}`);
});

/* ---------------- service 调用 ---------------- */

const CALL_TIMEOUT_MS = 20000;

function withTimeout(promise, ms, method, path) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`宿主 ${ms / 1000}s 内没有回话（${method} ${path}），service 可能还没起来`);
      err.code = "HOST_TIMEOUT";
      reject(err);
    }, ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

async function callService(path, { method = "POST", body } = {}) {
  const started = Date.now();
  try {
    const res = await withTimeout(host.serviceRequest({
      method,
      path,
      body: body === undefined ? undefined : JSON.stringify(body),
    }), CALL_TIMEOUT_MS, method, path);
    let data = null;
    try {
      data = JSON.parse(res.body);
    } catch {
      /* 空响应 */
    }
    if (res.status >= 400 || !data || data.ok === false) {
      const info = data?.error || { code: "UNKNOWN", message: `service 返回 ${res.status}` };
      record({ method, path, status: res.status, code: info.code, message: info.message, ms: Date.now() - started });
      const err = new Error(info.message || "未知错误");
      err.code = info.code || "UNKNOWN";
      err.missing = info.missing;
      throw err;
    }
    record({ method, path, status: res.status, code: "", message: "", ms: Date.now() - started });
    return data;
  } catch (e) {
    if (!e.status) {
      // 没到 service：宿主的拒绝或超时（HostRequestError 带 code）
      record({ method, path, status: 0, code: e.code || "HOST_ERROR", message: e.message || String(e), ms: Date.now() - started });
    }
    throw e;
  }
}

/* ---------------- 流程 ---------------- */

async function boot() {
  setPhase("boot");
  try {
    const { config } = await callService("/config", { method: "GET" });
    state.config = config;
    state.selected = await readStoredProject();
    if (!config.configured) return setPhase("setup");
    await loadProjects();
  } catch (e) {
    fail(e);
  }
}

async function loadProjects() {
  setPhase("loading");
  try {
    const { projects } = await callService("/projects");
    state.projects = projects;
    if (!projects.length) return setPhase("empty");
    if (!projects.some((p) => p.id === state.selected)) {
      state.selected = projects[0].id;
      await storeProject(state.selected);
    }
    setPhase("list");
  } catch (e) {
    fail(e);
  }
}

async function saveConfig(fields) {
  state.saveState = "保存中…";
  state.error = null;
  render();
  try {
    const { config } = await callService("/config", {
      body: {
        baseUrl: fields.baseUrl,
        apiKey: fields.apiKey,
        workspace: fields.workspace,
        apiVersion: fields.apiVersion,
      },
    });
    state.config = config;
    if (!config.configured) {
      state.saveState = "";
      state.error = { code: "CONFIG_MISSING", message: "三个必填都填上再保存" };
      return setPhase("setup");
    }
    state.saveState = "已保存，正在拉项目…";
    await loadProjects();
    state.saveState = "";
  } catch (e) {
    state.saveState = "";
    fail(e);
  }
}

function fail(e) {
  state.error = { code: e.code || "UNKNOWN", message: e.message || String(e) };
  if (e.code === "CONFIG_MISSING" || e.code === "BAD_CONFIG") setPhase("setup");
  else setPhase("error");
}

/* ---------------- 记住项目 ---------------- */

async function readStoredProject() {
  try {
    const got = await host.storage.get(STORAGE_KEY);
    if (typeof got === "string") return got;
    return got?.value ?? null;
  } catch {
    return null;
  }
}
async function storeProject(id) {
  try {
    await host.storage.set(STORAGE_KEY, id);
  } catch {
    /* 存不了不影响用 */
  }
}

/* ---------------- 渲染 ---------------- */

function setPhase(phase) {
  state.phase = phase;
  render();
}

const ESC = (v) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function diagnostics() {
  const last = state.lastCall;
  return `<details class="diag"><summary>诊断（${ESC(BUILD)}）</summary>
    <div>宿主：${ESC($("hostState").textContent || "—")} · service：${ESC($("svcState")?.textContent || "—")}</div>
    <div>最近调用：${last ? `${ESC(last.method)} ${ESC(last.path)} → ${last.status} ${ESC(last.code || "")}${last.ms ? ` (${last.ms}ms)` : ""}` : "无"}</div>
    ${last?.message ? `<div>消息：${ESC(last.message)}</div>` : ""}
    <ol>${state.calls.slice(1, 5).map((c) => `<li>${ESC(c.method)} ${ESC(c.path)} → ${c.status} ${ESC(c.code || "")}</li>`).join("")}</ol>
  </details>`;
}

function render() {
  const healthy = state.phase === "list" || state.phase === "empty";
  $("dot").className = healthy ? "dot on" : "dot";
  $("hostState").textContent = state.phase === "nohost" ? "未连接" : "已连接";

  const proj = $("proj");
  proj.hidden = state.phase !== "list";
  proj.innerHTML = state.projects
    .map((p) => `<option value="${ESC(p.id)}"${p.id === state.selected ? " selected" : ""}>${ESC(p.name)}</option>`)
    .join("");

  $("view").innerHTML = viewFor(state.phase) + diagnostics();
  wire();
}

function viewFor(phase) {
  const c = state.config || {};
  const err = state.error;

  if (phase === "boot" || phase === "loading") {
    return `<div class="hint">${phase === "boot" ? "正在连接 Plane…" : "正在拉项目列表…"}</div>`;
  }

  if (phase === "nohost") {
    return `<div class="empty"><div class="t">不在 OpenChamber 里</div>
      <div>面板要通过宿主才能访问本地 service。装进 OpenChamber 后再打开这个面板。</div></div>`;
  }

  if (phase === "setup") {
    return `<form id="setupForm" class="form" autocomplete="off">
      <div class="t">连接 Plane</div>
      ${err ? `<div class="err">${ESC(err.code)}：${ESC(err.message)}</div>` : ""}
      <label>地址<input name="baseUrl" placeholder="http://192.168.1.188:8080" value="${ESC(c.baseUrl || "")}"></label>
      <label>API Key<input name="apiKey" type="password" placeholder="${c.hasKey ? "已保存，留空则不变" : "plane_api_…"}" value=""></label>
      <label>Workspace<input name="workspace" placeholder="g2" value="${ESC(c.workspace || "")}"></label>
      <label>API 版本<input name="apiVersion" list="versions" placeholder="v1 或 v2" value="${ESC(c.apiVersion || "v2")}">
        <datalist id="versions"><option value="v1"><option value="v2"></datalist></label>
      <button type="submit">保存并连接</button>
      <div class="fine" id="saveState">${ESC(state.saveState)}</div>
      <div class="fine">Key 存在扩展自己的数据目录（600 权限），面板只拿到脱敏视图。</div>
    </form>`;
  }

  if (phase === "error") {
    const retry = err?.code === "NETWORK" || err?.code === "RATE_LIMITED" ? `<button data-act="retry">重试</button>` : "";
    return `<div class="empty"><div class="t">连不上 Plane</div>
      <div class="err">${ESC(err?.code || "")}：${ESC(err?.message || "")}</div>
      <div class="acts">${retry}<button data-act="setup">改配置</button><button data-act="retry">再试一次</button></div></div>`;
  }

  if (phase === "empty") {
    return `<div class="empty"><div class="t">这个 workspace 还没有项目</div>
      <div>去 Plane 里建一个项目，或者改配置换 workspace。</div>
      <div class="acts"><button data-act="retry">刷新</button><button data-act="setup">改配置</button></div></div>`;
  }

  const current = state.projects.find((p) => p.id === state.selected);
  return `<div class="list">${state.projects
    .map(
      (p) => `<button class="row${p.id === state.selected ? " sel" : ""}" data-pick="${ESC(p.id)}">
        <span class="nm">${ESC(p.name)}</span>
        <span class="idf">${ESC(p.identifier || "")}</span>
      </button>`,
    )
    .join("")}</div>
    <div class="fine">${state.projects.length} 个项目 · 当前 <b>${ESC(current?.name || "")}</b> · 看板在 03 片</div>`;
}

/* ---------------- 事件 ---------------- */

function wire() {
  const form = $("setupForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      if (btn?.disabled) return;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "保存中…";
      }
      saveConfig({
        baseUrl: form.baseUrl.value,
        apiKey: form.apiKey.value,
        workspace: form.workspace.value,
        apiVersion: form.apiVersion.value,
      });
    });
  }

  document.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", () => {
      if (el.dataset.act === "retry") return loadProjects();
      if (el.dataset.act === "setup") return setPhase("setup");
    });
  });

  document.querySelectorAll("[data-pick]").forEach((el) => {
    el.addEventListener("click", async () => {
      state.selected = el.dataset.pick;
      await storeProject(state.selected);
      render();
    });
  });
}

$("proj").addEventListener("change", async (e) => {
  state.selected = e.target.value;
  await storeProject(state.selected);
  render();
});
$("refresh").addEventListener("click", () => loadProjects());

/* ---------------- 启动 ---------------- */

let ready = false;
host.onReady((ctx) => {
  ready = true;
  document.body.dataset.theme = ctx?.theme?.mode === "light" ? "light" : "dark";
  render(); // 先把宿主状态画出来，再加载
  boot();
});

host.onConnection?.((c) => {
  $("hostState").textContent = c?.connected === false ? "连接中断" : "已连接";
});

async function refreshServiceState() {
  try {
    const status = await host.serviceStatus();
    const label = { ready: "就绪", starting: "启动中", stopped: "未启动", failed: "启动失败" }[status?.status ?? status] || String(status?.status ?? status);
    $("svcState").textContent = label;
  } catch {
    $("svcState").textContent = "不可用";
  }
}

setTimeout(() => {
  if (!ready) setPhase("nohost");
}, 1500);
refreshServiceState();
