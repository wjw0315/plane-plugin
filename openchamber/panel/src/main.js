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

/** 宿主给的设备信息（ready.device）：formFactor = phone | tablet | desktop，pointer = coarse | fine。 */
const device = { formFactor: "desktop", pointer: "fine" };
const isPhone = () => device.formFactor === "phone" || device.pointer === "coarse";

const state = {
  phase: "boot", // boot | nohost | setup | loading | list | empty | error
  config: null,
  projects: [],
  selected: null,
  board: { states: [], items: [] },
  view: "board", // board | list
  detail: null, // { id, item, description, loading, error }
  drawer: null, // 发起会话参数抽屉
  bindSheet: null, // 会话菜单动作带来的绑定 { sessionId, sessionTitle }
  configEdit: false, // 修改配置覆盖层
  createForm: null, // 新建工作项 { name, stateId, busy, error }
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
  const stack = e.error?.stack || "";
  paintCrash(`面板脚本出错：${e.message}${stack ? "\n" + stack.slice(0, 1200) : ""}`);
});
window.addEventListener("unhandledrejection", (e) => {
  const r = e.reason;
  const stack = r?.stack || "";
  paintCrash(`未处理的异步错误：${r?.code ? r.code + "：" : ""}${r?.message || String(r)}${stack ? "\n" + stack.slice(0, 1200) : ""}`);
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
    // 手机上没有 HTML5 拖拽，默认给列表视图（列表用「移动到」下拉改状态）
    state.view = isPhone() ? "list" : (await readStoredView()) === "list" ? "list" : "board";
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

async function submitCreateItem(name, stateId) {
  state.createForm.busy = true;
  render();
  try {
    await callService("/create-work-item", {
      body: { projectId: state.selected, name, stateId },
    });
    state.createForm = null;
    await loadBoard();
    showToast("工作项已创建");
  } catch (e) {
    state.createForm.busy = false;
    state.createForm.error = { code: e.code || "CREATE_FAILED", message: e.message || String(e) };
    render();
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
/** 跳到 OpenChamber 会话（卡片 ⌘ 角标 / 详情里的会话 chip）。 */
function openSessionById(sessionId) {
  if (!sessionId) return;
  host
    .openSession(sessionId)
    .then(() => showToast("已跳到会话"))
    .catch(() => showToast("跳转失败", null, null, true));
}

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
    // 从「修改配置」覆盖层保存的：关掉覆盖层并刷新看板
    if (state.configEdit) {
      state.configEdit = false;
      state.error = null;
      state.saveState = "";
      render();
      if (state.phase !== "board") setPhase("board");
      else await loadBoard();
      showToast("配置已更新");
    } else {
      state.saveState = "";
    }
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
    return `<div id="setupForm" class="form" autocomplete="off">
      <div class="t">连接 Plane</div>
      ${err ? `<div class="err">${ESC(err.code)}：${ESC(err.message)}</div>` : ""}
      <label>地址<input name="baseUrl" placeholder="http://192.168.1.188:8080" value="${ESC(c.baseUrl || "")}"></label>
      <label>API Key<input name="apiKey" type="password" placeholder="${c.hasKey ? "已保存，留空则不变" : "plane_api_…"}" value=""></label>
      <label>Workspace<input name="workspace" placeholder="g2" value="${ESC(c.workspace || "")}"></label>
      <label>API 版本<input name="apiVersion" list="versions" placeholder="v1 或 v2" value="${ESC(c.apiVersion || "v2")}">
        <datalist id="versions"><option value="v1"><option value="v2"></datalist></label>
      <button type="button" id="setupSave">保存并连接</button>
      <div class="fine" id="saveState">${ESC(state.saveState)}</div>
      <div class="fine">Key 存在扩展自己的数据目录（600 权限），面板只拿到脱敏视图。</div>
    </div>`;
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
    const base =
      state.view === "list"
        ? listHTML({ ...state.board, detailId }) + (state.detail ? inlineDetailHTML() : "")
        : boardHTML({ ...state.board, detailId, canDrag: !isPhone() }) + (state.detail ? overlayDetailHTML() : "");
    return (
      base +
      (state.drawer ? drawerHTML() : "") +
      (state.concl ? conclHTML() : "") +
      (state.bindSheet ? bindSheetHTML() : "") +
      (state.configEdit ? configEditHTML() : "") +
      (state.createForm ? createItemHTML() : "")
    );
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
    <div class="frow"><span class="k">会话</span>${
      item.sess
        ? `<span class="chip sess" data-open-session="${ESC(item.sess)}">⌘ ${ESC(item.sess)} · 跳转</span>`
        : `<button class="btn" data-start-session="${ESC(item.id)}">发起会话</button>`
    }</div>
    <div class="sec"><h4>结论</h4>${
      item.concl
        ? `<div class="desc">${ESC(item.conclText || "")}</div>
           <div class="fine">✓ 已回填到 Plane 评论 · ${ESC(item.conclAt || "")}</div>`
        : `<div class="fine">${item.sess ? "会话跑完后可以把结论写回这张卡。" : "还没有结论。"}</div>
           <div class="acts" style="margin-top:8px"><button class="btn" data-backfill="${ESC(item.id)}">回填结论…</button></div>`
    }</div>
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

/* ---------------- 发起会话 ---------------- */

const MODEL_PRESETS = ["magpie/glm-5.3", "anthropic/claude-sonnet-5", "openai/gpt-5.2", "deepseek/deepseek-v4-flash"];
const AGENT_PRESETS = ["build", "plan"];
const VARIANT_PRESETS = ["default", "low", "medium", "high"];

async function openDrawer(itemId) {
  const item = state.board.items.find((i) => i.id === itemId);
  if (!item) return;
  state.drawer = {
    itemId,
    busy: false,
    error: null,
    projects: [],
    projectId: null,
    worktree: false,
    wtName: `oc-${item.identifier || item.id}`,
    baseBranch: "main",
    model: "",
    variant: "default",
    agent: "build",
    extra: "",
  };
  render();
  try {
    const snap = await host.listProjects();
    const projects = snap?.projects || [];
    const d = state.drawer;
    if (!d) return;
    d.projects = projects;
    d.projectId = projects[0]?.id ?? null;
    render();
  } catch (e) {
    if (!state.drawer) return;
    state.drawer.error = { code: e.code || "PROJECTS_FAILED", message: e.message || "读不到 OpenChamber 项目" };
    render();
  }
}

function closeDrawer() {
  state.drawer = null;
  render();
}

function promptForDrawer(item) {
  const d = state.drawer;
  const head = `XLMSC-${item.identifier || item.id} ${item.name}`;
  const parts = [head, state.detail?.description || "", d?.extra?.trim() || ""].filter(Boolean);
  return parts.join("\n\n") + "\n\n完成后总结：改了什么、怎么验证、遗留什么。";
}

async function submitDrawer() {
  const d = state.drawer;
  const item = state.board.items.find((i) => i.id === d.itemId);
  if (!d || !item || d.busy) return;
  const project = d.projects.find((p) => p.id === d.projectId);
  if (!project) {
    d.error = { code: "NO_PROJECT", message: "先选一个 OpenChamber 项目" };
    return render();
  }

  d.busy = true;
  d.error = null;
  render();

  const prompt = promptForDrawer(item);
  const needsService = Boolean(d.model) || d.variant !== "default" || d.agent !== "build" || d.worktree;

  try {
    let sessionId = null;
    if (needsService) {
      const out = await callService("/session-start", {
        body: {
          prompt,
          title: `XLMSC-${item.identifier || item.id} ${item.name}`,
          projectId: project.id,
          directory: project.directory,
          model: d.model || null,
          variant: d.variant,
          agent: d.agent,
          worktree: d.worktree ? { name: d.wtName, baseBranch: d.baseBranch } : null,
        },
      });
      sessionId = out.sessionId;
    } else {
      const res = await host.startSession({
        providerId: "plane",
        id: item.id,
        title: `XLMSC-${item.identifier || item.id} ${item.name}`,
        url: itemUrl(item),
        text: prompt,
        projectId: project.id,
      });
      sessionId = res?.sessionId || null;
    }

    if (!sessionId) throw Object.assign(new Error("宿主没有返回会话 id"), { code: "NO_SESSION" });

    const inProgress = state.board.states.find((s) => /in progress|doing|进行中/i.test(s.name));
    try {
      await callService("/bind-session", {
        body: { projectId: state.selected, workItemId: item.id, sessionId, stateId: inProgress?.id },
      });
    } catch (e) {
      showToast(`会话已建，但绑定失败：${e.code || ""}`, null, null, true);
    }

    item.sess = sessionId;
    if (inProgress) item.stateId = inProgress.id;
    state.drawer = null;
    render();
    showToast(`会话已创建：${sessionId}`);
    loadBoard();
  } catch (e) {
    d.busy = false;
    d.error = { code: e.code || "START_FAILED", message: e.message || String(e) };
    render();
  }
}

function drawerHTML() {
  const d = state.drawer;
  const item = state.board.items.find((i) => i.id === d.itemId);
  if (!item) return "";
  const opts = (list, cur) =>
    list.map((v) => `<option value="${ESC(v)}"${v === cur ? " selected" : ""}>${ESC(v)}</option>`).join("");

  return `<div class="overlay"><div class="dhead">
      <button class="back" data-drawer-close="1" title="返回">‹</button>
      <span class="ident">发起会话 · XLMSC-${ESC(item.identifier || item.id)}</span>
      <span class="grow"></span><span class="fine">Esc 返回</span></div>
    <div class="dbody">
      ${d.error ? `<div class="err">${ESC(d.error.code)}：${ESC(d.error.message)}</div>` : ""}
      <label class="fld">项目
        <select id="dwProject">${(d.projects || [])
          .map((p) => `<option value="${ESC(p.id)}"${p.id === d.projectId ? " selected" : ""}>${ESC(p.name)}</option>`)
          .join("")}</select>
      </label>
      <label class="fld">工作区
        <span class="wt"><input type="checkbox" id="dwWt"${d.worktree ? " checked" : ""}><span>全新 worktree</span>
        <input type="text" id="dwWtName" value="${ESC(d.wtName)}" placeholder="worktree 名">
        <input type="text" id="dwBase" value="${ESC(d.baseBranch)}" placeholder="基线分支"></span>
      </label>
      <label class="fld">模型
        <select id="dwModel"><option value="">跟随当前默认</option>${opts(MODEL_PRESETS, d.model)}</select>
      </label>
      <label class="fld">思考级别
        <select id="dwVariant">${opts(VARIANT_PRESETS, d.variant)}</select>
      </label>
      <label class="fld">智能体
        <select id="dwAgent">${opts(AGENT_PRESETS, d.agent)}</select>
      </label>
      <div class="fine" style="margin-top:8px">补充提示词</div>
      <textarea id="dwExtra" placeholder="约束、验收标准、不要碰的文件…">${ESC(d.extra)}</textarea>
      <div class="fine" style="margin-top:8px">将发送</div>
      <pre class="pv" id="dwPreview">${ESC(promptForDrawer(item))}</pre>
      <div class="acts">
        <button class="btn pri" data-drawer-go="1"${d.busy ? " disabled" : ""}>${d.busy ? "发起中…" : "开始会话"}</button>
        <button class="btn" data-drawer-close="1">取消</button>
      </div>
      <div class="fine">选了三件套或 worktree 走 service（能指定模型）；都不改则走宿主 startSession（更轻）。</div>
    </div></div>`;
}

/* ---------------- 回填结论 ---------------- */

function openConcl(itemId) {
  const item = state.board.items.find((i) => i.id === itemId);
  if (!item) return;
  state.concl = { itemId, text: item.conclText || "", busy: false, error: null };
  render();
}

function closeConcl() {
  state.concl = null;
  render();
}

async function submitConcl() {
  const c = state.concl;
  const item = state.board.items.find((i) => i.id === c.itemId);
  if (!c || !item || c.busy) return;
  const text = String(c.text || "").trim();
  if (!text) {
    c.error = { code: "EMPTY", message: "草稿是空的" };
    return render();
  }
  c.busy = true;
  c.error = null;
  render();
  try {
    const { comment } = await callService("/comment", {
      body: { projectId: state.selected, workItemId: item.id, body: text, sessionId: item.sess || undefined },
    });
    item.concl = true;
    item.conclText = text;
    item.conclAt = (comment?.createdAt || "").slice(0, 16).replace("T", " ") || "刚刚";
    state.concl = null;
    render();
    showToast("已写入 Plane 评论");
  } catch (e) {
    c.busy = false;
    c.error = { code: e.code || "COMMENT_FAILED", message: e.message || String(e) };
    render();
  }
}

function conclHTML() {
  const c = state.concl;
  const item = state.board.items.find((i) => i.id === c.itemId);
  return `<div class="overlay"><div class="dhead">
      <button class="back" data-concl-close="1" title="返回">‹</button>
      <span class="ident">回填结论 · XLMSC-${ESC(item?.identifier || c.itemId)}</span>
      <span class="grow"></span><span class="fine">Esc 返回</span></div>
    <div class="dbody">
      <div class="fine">作为评论追加到 Plane，不改动原描述。</div>
      ${c.error ? `<div class="err">${ESC(c.error.code)}：${ESC(c.error.message)}</div>` : ""}
      <textarea id="conclText" style="height:120px;margin-top:8px" placeholder="改了什么、怎么验证、遗留什么…">${ESC(c.text)}</textarea>
      <div class="acts">
        <button class="btn pri" data-concl-go="1"${c.busy || !String(c.text || "").trim() ? " disabled" : ""}>${c.busy ? "写入中…" : "写入评论"}</button>
        <button class="btn" data-concl-close="1">取消</button>
      </div>
    </div></div>`;
}

/* ---------------- 事件 ---------------- */

function wire() {
  const setupSave = $("setupSave");
  if (setupSave) {
    setupSave.addEventListener("click", () => {
      if (setupSave.disabled) return;
      const form = $("setupForm");
      if (!form) return;
      const input = (name) => form.querySelector(`input[name="${name}"]`);
      setupSave.disabled = true;
      setupSave.textContent = "保存中…";
      saveConfig({
        baseUrl: input("baseUrl")?.value ?? "",
        apiKey: input("apiKey")?.value ?? "",
        workspace: input("workspace")?.value ?? "",
        apiVersion: input("apiVersion")?.value ?? "",
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
    const handlers = { onMove: moveItem, onOpen: openDetail, onOpenSession: openSessionById };
    if (state.view === "list") wireList($("view"), handlers);
    else wireBoard($("view"), handlers);
  }

  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => closeDetail());
  });
  document.querySelectorAll("[data-start-session]").forEach((el) => {
    el.addEventListener("click", () => openDrawer(el.dataset.startSession));
  });
  document.querySelectorAll("[data-drawer-close]").forEach((el) => {
    el.addEventListener("click", () => closeDrawer());
  });
  document.querySelectorAll("[data-backfill]").forEach((el) => {
    el.addEventListener("click", () => openConcl(el.dataset.backfill));
  });
  document.querySelectorAll("[data-bind-to]").forEach((el) => {
    el.addEventListener("click", async () => {
      const b = state.bindSheet;
      const item = state.board.items.find((i) => i.id === el.dataset.bindTo);
      if (!b || !item || b.busy) return;
      b.busy = true;
      render();
      try {
        await callService("/bind-session", {
          body: { projectId: state.selected, workItemId: item.id, sessionId: b.sessionId },
        });
        item.sess = b.sessionId;
        state.bindSheet = null;
        render();
        showToast("已绑定，会话结论会自动回填");
      } catch (e2) {
        b.busy = false;
        showToast(`绑定失败：${e2.code || ""} ${e2.message || ""}`, null, null, true);
      }
    });
  });
  document.querySelectorAll("[data-bind-close]").forEach((el) => {
    el.addEventListener("click", () => {
      state.bindSheet = null;
      render();
    });
  });
  document.querySelectorAll("[data-open-session]").forEach((el) => {
    el.addEventListener("click", () => {
      host.openSession(el.dataset.openSession).catch(() => showToast("跳转失败", null, null, true));
    });
  });

  const addItemBtn = $("addItem");
  if (addItemBtn) {
    addItemBtn.hidden = state.phase !== "board";
    addItemBtn.addEventListener("click", () => {
      state.createForm = { name: "", stateId: "", busy: false, error: null };
      render();
    });
  }
  const cfgBtn = $("cfgBtn");
  if (cfgBtn) {
    cfgBtn.addEventListener("click", () => {
      state.configEdit = true;
      render();
    });
  }
  const cfgForm = $("cfgForm");
  if (cfgForm) {
    cfgForm.addEventListener("click", (e) => {
      if (e.target.id !== "cfgSave") return;
      const input = (name) => cfgForm.querySelector(`input[name="${name}"]`);
      saveConfig({
        baseUrl: input("baseUrl")?.value ?? "",
        apiKey: input("apiKey")?.value ?? "",
        workspace: input("workspace")?.value ?? "",
        apiVersion: input("apiVersion")?.value ?? "",
      }).then(() => {
        state.configEdit = false;
        render();
      });
    });
  }
  const ciForm = $("ciForm");
  if (ciForm) {
    ciForm.addEventListener("click", (e) => {
      const name = $("ciName")?.value ?? "";
      const stateId = $("ciState")?.value ?? "";
      if (e.target.id !== "ciSave") return;
      if (!name.trim() || !stateId) return;
      submitCreateItem(name.trim(), stateId);
    });
  }
  document.querySelectorAll("[data-concl-close]").forEach((el) => {
    el.addEventListener("click", () => closeConcl());
  });
  const conclGo = document.querySelector("[data-concl-go]");
  if (conclGo) conclGo.addEventListener("click", () => submitConcl());
  const conclText = $("conclText");
  if (conclText) {
    conclText.addEventListener("input", () => {
      const c = state.concl;
      if (!c) return;
      c.text = conclText.value;
      const go = document.querySelector("[data-concl-go]");
      if (go) go.disabled = !conclText.value.trim() || c.busy;
    });
  }
  const go = document.querySelector("[data-drawer-go]");
  if (go) {
    go.addEventListener("click", () => {
      const d = state.drawer;
      if (!d) return;
      d.projectId = $("dwProject")?.value ?? d.projectId;
      d.worktree = Boolean($("dwWt")?.checked);
      d.wtName = $("dwWtName")?.value ?? d.wtName;
      d.baseBranch = $("dwBase")?.value ?? d.baseBranch;
      d.model = $("dwModel")?.value ?? "";
      d.variant = $("dwVariant")?.value ?? "default";
      d.agent = $("dwAgent")?.value ?? "build";
      d.extra = $("dwExtra")?.value ?? "";
      submitDrawer();
    });
  }
  const extra = $("dwExtra");
  if (extra) {
    extra.addEventListener("input", () => {
      const d = state.drawer;
      if (!d) return;
      d.extra = extra.value;
      const item = state.board.items.find((i) => i.id === d.itemId);
      const pv = $("dwPreview");
      if (item && pv) pv.textContent = promptForDrawer(item);
    });
  }
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
  if (e.key === "Escape" && state.createForm) {
    e.preventDefault();
    state.createForm = null;
    render();
    return;
  }
  if (e.key === "Escape" && state.bindSheet) {
    e.preventDefault();
    state.bindSheet = null;
    render();
    return;
  }
  if (e.key === "Escape" && state.concl) {
    e.preventDefault();
    closeConcl();
    return;
  }
  if (e.key === "Escape" && state.drawer) {
    e.preventDefault();
    closeDrawer();
    return;
  }
  if (e.key === "Escape" && state.detail) {
    e.preventDefault();
    closeDetail();
  }
});

/** 宿主回调：/plane 命令、聊天里的编号 chip、会话菜单动作。 */
function handleHostCallbacks() {
  const guarded = (label, fn) => (...args) => {
    try {
      const out = fn(...args);
      if (out && typeof out.catch === "function") out.catch((e) => paintCrash(`${label}：${e.code ? e.code + "：" : ""}${e.stack || e.message || e}`));
      return out;
    } catch (e) {
      paintCrash(`${label}：${e.stack || e.message || String(e)}`);
    }
  };
  host.onResolve(guarded("resolve", async (req) => {
    const args = String(req.args || "").trim();
    const m2 = args.match(/^([A-Za-z]+)-(\d+)$/);
    if (!m2) return null;
    const card = state.board.items.find((i) => i.identifier === m2[2]);
    if (!card) return null;
    return {
      providerId: "plane",
      id: card.id,
      title: `XLMSC-${card.identifier} ${card.name}`,
      url: itemUrl(card),
      kind: "issue",
      data: { workItemId: card.id },
    };
  }));

  host.onItem(guarded("item", (item) => {
    if (!item) return;
    if (item.kind === "link") {
      const seq = String(item.identifier || "").replace(/^.*-/, "");
      const card = state.board.items.find((i) => i.identifier === seq);
      if (card) return openDetail(card.id);
      showToast(`找不到 ${item.identifier}，刷新看板试试`, null, null, true);
      return;
    }
    if (item.kind === "session") {
      state.bindSheet = { sessionId: item.sessionId, sessionTitle: item.sessionTitle };
      render();
    }
  }));
}

$("proj").addEventListener("change", async (e) => {
  state.selected = e.target.value;
  await storeProject(state.selected);
  await loadBoard();
});
$("refresh").addEventListener("click", () => (state.phase === "board" ? loadBoard() : loadProjects()));

/* ---------------- 启动 ---------------- */

let ready = false;
let booted = false;
host.onReady((ctx) => {
  ready = true;
  document.body.dataset.theme = ctx?.theme?.mode === "light" ? "light" : "dark";
  if (ctx?.device) {
    Object.assign(device, ctx.device);
    document.body.dataset.device = device.formFactor;
  }
  render(); // 先把宿主状态画出来，再加载
  if (!booted) {
    booted = true; // 宿主会多次推 ready（iframe 加载 + 每次 hello），业务只初始化一次
    refreshServiceState();
    handleHostCallbacks();
    boot().catch((e) => paintCrash(`初始化失败：${e.code ? e.code + "：" : ""}${e.stack || e.message || e}`));
  }
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
