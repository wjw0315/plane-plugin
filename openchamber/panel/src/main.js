/**
 * Plane 扩展的面板（OpenChamber 沙箱 iframe）。
 *
 * 02 片：配置表单 → 列项目 → 三种错误面 → 记住项目。
 * 这一版加上了「看得见的过程」：每次调用都记下方法/路径/状态/错误码，
 * 保存按钮点下去立刻有反馈，异常也会画到界面上（不再只是控制台里一声不响）。
 */
import { connectHost } from "@openchamber/sdk";
import { boardHTML, listHTML, wireBoard, wireList } from "./board.js";

const BUILD = "0.2.1+diag";
const host = connectHost();
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "plane.project";
const VIEW_KEY = "plane.view";

const state = {
  phase: "boot", // boot | nohost | setup | loading | list | empty | error
  config: null,
  projects: [],
  selected: null,
  board: { states: [], items: [] },
  view: "board", // board | list
  detail: null, // { id, item, description, loading, error }
  toast: null,
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
    state.view = (await readStoredView()) === "list" ? "list" : "board";
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
    await loadBoard();
  } catch (e) {
    fail(e);
  }
}

async function loadBoard() {
  setPhase("loading");
  try {
    const projectId = state.selected;
    const { states } = await callService("/states", { body: { projectId } });
    const { items } = await callService("/work-items", { body: { projectId } });
    state.board = { states, items };
    setPhase(states.length ? "board" : "empty");
  } catch (e) {
    fail(e);
  }
}

/** 拖拽改状态：先动 UI，再落 Plane；失败回滚，成功给 5 秒撤销。 */
async function moveItem(itemId, toStateId) {
  const item = state.board.items.find((i) => i.id === itemId);
  if (!item || item.stateId === toStateId) return;
  const from = item.stateId;
  item.stateId = toStateId;
  render();

  try {
    await callService("/patch-state", {
      body: { projectId: state.selected, workItemId: itemId, stateId: toStateId },
    });
    const name = state.board.states.find((s) => s.id === toStateId)?.name || "";
    showToast(`已移到 ${name}`, "撤销", async () => {
      item.stateId = from;
      render();
      try {
        await callService("/patch-state", {
          body: { projectId: state.selected, workItemId: itemId, stateId: from },
        });
        showToast("已撤销");
      } catch (e) {
        item.stateId = toStateId;
        render();
        showToast(`撤销失败：${e.code || ""}`, null, null, true);
      }
    });
  } catch (e) {
    item.stateId = from;
    render();
    showToast(`移动失败：${e.code || ""} ${e.message || ""}`, null, null, true);
  }
}

/** 打开详情：先用列表里的数据秒开，再拉一条最新的覆盖。 */
async function openDetail(id) {
  const item = state.board.items.find((i) => i.id === id);
  if (!item) return;
  if (state.detail?.id === id) return closeDetail();
  state.detail = { id, item, description: null, loading: true, error: null };
  render();
  try {
    const { item: fresh, description } = await callService("/work-item", {
      body: { projectId: state.selected, workItemId: id },
    });
    if (!state.detail || state.detail.id !== id) return;
    Object.assign(item, fresh);
    state.detail = { id, item, description, loading: false, error: null };
    render();
  } catch (e) {
    if (!state.detail || state.detail.id !== id) return;
    state.detail = { ...state.detail, loading: false, error: { code: e.code || "", message: e.message || "" } };
    render();
  }
}

function closeDetail() {
  const id = state.detail?.id;
  state.detail = null;
  render();
  if (id) document.querySelector(`.card[data-id="${id}"]`)?.focus?.();
}

/** 用 Plane 网页打开这张卡。 */
function itemUrl(item) {
  const base = (state.config?.baseUrl || "").replace(/\/+$/, "");
  const ws = state.config?.workspace || "";
  return `${base}/${ws}/projects/${state.selected}/issues/${item.id}/`;
}

function showToast(text, actionLabel, onAction, isError) {
  state.toast = { text, actionLabel, onAction, isError };
  render();
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    state.toast = null;
    render();
  }, actionLabel ? 5000 : 3000);
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
async function readStoredView() {
  try {
    const got = await host.storage.get(VIEW_KEY);
    if (typeof got === "string") return got;
    return got?.value ?? null;
  } catch {
    return null;
  }
}
async function storeView(v) {
  try {
    await host.storage.set(VIEW_KEY, v);
  } catch {
    /* 存不了就用默认 */
  }
}

async function storeProject(id) {
  try {
    await host.storage.set(STORAGE_KEY, id);
  } catch {
    /* 存不了不影响用 */
  }
}

function renderToast() {
  const box = $("toast");
  if (!box) return;
  const t = state.toast;
  if (!t) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  box.hidden = false;
  box.className = "toast" + (t.isError ? " bad" : "");
  box.innerHTML = `<span>${ESC(t.text)}</span>${t.actionLabel ? `<button id="toastAction">${ESC(t.actionLabel)}</button>` : ""}`;
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
  const healthy = state.phase === "board" || state.phase === "empty";
  $("dot").className = healthy ? "dot on" : "dot";
  $("hostState").textContent = state.phase === "nohost" ? "未连接" : "已连接";

  const seg = $("seg");
  if (seg) {
    seg.hidden = state.phase !== "board";
    seg.querySelectorAll("[data-view]").forEach((el) => {
      el.setAttribute("aria-pressed", String(el.dataset.view === state.view));
    });
  }

  const proj = $("proj");
  proj.hidden = state.phase !== "board";
  proj.innerHTML = state.projects
    .map((p) => `<option value="${ESC(p.id)}"${p.id === state.selected ? " selected" : ""}>${ESC(p.name)}</option>`)
    .join("");

  $("view").innerHTML = viewFor(state.phase) + diagnostics();
  renderToast();
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

  if (phase === "board") {
    const detailId = state.detail?.id ?? null;
    if (state.view === "list") {
      return listHTML({ ...state.board, detailId }) + (state.detail ? inlineDetailHTML() : "");
    }
    return boardHTML({ ...state.board, detailId }) + (state.detail ? overlayDetailHTML() : "");
  }

  return "";
}

/* ---------------- 详情 ---------------- */

const PRIO_LABEL = { urgent: "紧急", high: "高", medium: "中", low: "低", none: "—" };

function detailBody(item) {
  const d = state.detail;
  const states = state.board.states;
  const stateButtons = states
    .map(
      (s) => `<button class="stbtn" data-setstate="${ESC(item.id)}" data-to="${ESC(s.id)}"
        aria-pressed="${s.id === item.stateId}">${ESC(s.name)}</button>`,
    )
    .join("");
  const desc = d.loading
    ? '<div class="fine">正在取最新描述…</div>'
    : d.error
      ? `<div class="err">${ESC(d.error.code)}${d.error.message ? "：" + ESC(d.error.message) : ""}（看板数据仍可用）</div>`
      : d.description
        ? `<div class="desc">${ESC(d.description)}</div>`
        : '<div class="fine">这张卡没有描述</div>';

  return `<h3 class="dtitle">${ESC(item.name)}</h3>
    <div class="frow"><span class="k">状态</span><span class="stbtns">${stateButtons}</span></div>
    <div class="frow"><span class="k">编号</span><span class="ident">${item.identifier ? "XLMSC-" + ESC(item.identifier) : "—"}</span></div>
    <div class="frow"><span class="k">优先级</span><span>${ESC(PRIO_LABEL[item.priority] || "—")}</span></div>
    <div class="frow"><span class="k">指派</span><span>${ESC(item.assignees?.map((a) => a.name).filter(Boolean).join("、") || "未指派")}</span></div>
    <div class="frow"><span class="k">标签</span><span>${item.labels?.length ? item.labels.length + " 个" : "无"}</span></div>
    <div class="frow"><span class="k">会话</span><span class="fine">未绑定（06 片接入）</span></div>
    <div class="sec"><h4>描述</h4>${desc}</div>
    <div class="acts">
      <button class="btn pri" data-plane="${ESC(item.id)}">在 Plane 打开 ↗</button>
      <button class="btn" data-copy="${ESC(item.id)}">复制链接</button>
    </div>`;
}

function overlayDetailHTML() {
  return `<div class="overlay"><div class="dhead"><button class="back" data-close="1" title="返回">‹</button>
    <span class="ident">${state.detail.item.identifier ? "XLMSC-" + ESC(state.detail.item.identifier) : ""}</span>
    <span class="grow"></span><span class="fine">Esc 返回</span></div>
    <div class="dbody">${detailBody(state.detail.item)}<div class="acts"><button class="btn" data-close="1">关闭</button></div></div></div>`;
}

function inlineDetailHTML() {
  return `<div class="inlineD">${detailBody(state.detail.item)}<div class="acts"><button class="btn" data-close="1">收起</button></div></div>`;
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

  if (state.phase === "board") {
    const handlers = { onMove: moveItem, onOpen: openDetail };
    if (state.view === "list") wireList($("view"), handlers);
    else wireBoard($("view"), handlers);
  }

  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => closeDetail());
  });
  document.querySelectorAll("[data-setstate]").forEach((el) => {
    el.addEventListener("click", () => moveItem(el.dataset.setstate, el.dataset.to));
  });
  document.querySelectorAll("[data-plane]").forEach((el) => {
    el.addEventListener("click", () => {
      const item = state.board.items.find((i) => i.id === el.dataset.plane);
      if (item) host.openUrl(itemUrl(item)).catch(() => showToast("打不开浏览器", null, null, true));
    });
  });
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", async () => {
      const item = state.board.items.find((i) => i.id === el.dataset.copy);
      if (!item) return;
      try {
        await host.writeClipboard(itemUrl(item));
        showToast("链接已复制");
      } catch {
        showToast("复制失败", null, null, true);
      }
    });
  });

  document.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", async () => {
      const v = el.dataset.view;
      if (v === state.view) return;
      state.view = v;
      await storeView(v);
      render(); // 同一份数据换渲染，不重新拉
    });
  });

  const undo = $("toastAction");
  if (undo) {
    undo.addEventListener("click", () => {
      const action = state.toast?.onAction;
      state.toast = null;
      render();
      action?.();
    });
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.detail) {
    e.preventDefault();
    closeDetail();
  }
});

$("proj").addEventListener("change", async (e) => {
  state.selected = e.target.value;
  await storeProject(state.selected);
  await loadBoard();
});
$("refresh").addEventListener("click", () => (state.phase === "board" ? loadBoard() : loadProjects()));

/* ---------------- 启动 ---------------- */

let ready = false;
host.onReady((ctx) => {
  ready = true;
  document.body.dataset.theme = ctx?.theme?.mode === "light" ? "light" : "dark";
  render(); // 先把宿主状态画出来，再加载
  refreshServiceState();
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
