/**
 * Plane 扩展的面板（OpenChamber 沙箱 iframe）。
 *
 * 02 片：配置表单（落在 service 的数据目录）+ 列项目 + 三种错误面 + 记住项目。
 * 看板在 03 片。
 */
import { connectHost } from "@openchamber/sdk";

const host = connectHost();
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "plane.project";

const state = {
  phase: "boot", // boot | nohost | setup | loading | list | empty | error
  config: null,
  projects: [],
  selected: null,
  error: null,
};

/* ---------------- service 调用 ---------------- */

async function callService(path, { method = "POST", body } = {}) {
  const res = await host.serviceRequest({
    method,
    path,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = JSON.parse(res.body);
  } catch {
    /* 非 JSON 就当空响应 */
  }
  if (res.status >= 400 || !data || data.ok === false) {
    const info = data?.error || { code: "UNKNOWN", message: `service 返回 ${res.status}` };
    const err = new Error(info.message || "未知错误");
    err.code = info.code || "UNKNOWN";
    err.missing = info.missing;
    throw err;
  }
  return data;
}

/* ---------------- 流程 ---------------- */

async function boot() {
  setPhase("boot");
  try {
    const { config } = await callService("/config", { method: "GET" });
    state.config = config;
    rememberProject(await readStoredProject());
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

async function saveConfig(form) {
  try {
    const { config } = await callService("/config", {
      body: {
        baseUrl: form.baseUrl.value,
        apiKey: form.apiKey.value,
        workspace: form.workspace.value,
        apiVersion: form.apiVersion.value,
      },
    });
    state.config = config;
    state.error = null;
    if (!config.configured) {
      state.error = { code: "CONFIG_MISSING", message: "还缺字段，三个必填都要填" };
      return setPhase("setup");
    }
    await loadProjects();
  } catch (e) {
    fail(e);
  }
}

function fail(e) {
  state.error = { code: e.code || "UNKNOWN", message: e.message };
  // 配置类错误直接回表单，其它留在错误面
  if (e.code === "CONFIG_MISSING" || e.code === "BAD_CONFIG") setPhase("setup");
  else setPhase("error");
}

/* ---------------- 记住项目（非敏感，放宿主 storage） ---------------- */

async function readStoredProject() {
  try {
    const got = await host.storage.get(STORAGE_KEY);
    return typeof got === "string" ? got : got?.value ?? null;
  } catch {
    return null;
  }
}
async function storeProject(id) {
  try {
    await host.storage.set(STORAGE_KEY, id);
  } catch {
    /* 存不了不影响使用 */
  }
}
function rememberProject(id) {
  if (id) state.selected = id;
}

/* ---------------- 渲染 ---------------- */

function setPhase(phase) {
  state.phase = phase;
  render();
}

const ESC = (v) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function render() {
  $("dot").className = state.phase === "list" || state.phase === "empty" ? "dot on" : "dot";
  $("hostState").textContent = state.phase === "nohost" ? "未连接" : "已连接";

  const proj = $("proj");
  proj.hidden = state.phase !== "list";
  proj.innerHTML = state.projects
    .map((p) => `<option value="${ESC(p.id)}"${p.id === state.selected ? " selected" : ""}>${ESC(p.name)}</option>`)
    .join("");

  $("view").innerHTML = viewFor(state.phase);
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
      <div class="fine">Key 存在扩展自己的数据目录（600 权限），面板只拿到脱敏视图。</div>
    </form>`;
  }

  if (phase === "error") {
    const retry = err?.code === "NETWORK" ? `<button data-act="retry">重试</button>` : "";
    return `<div class="empty"><div class="t">连不上 Plane</div>
      <div class="err">${ESC(err?.code || "")}：${ESC(err?.message || "")}</div>
      <div class="acts">${retry}<button data-act="setup">改配置</button></div></div>`;
  }

  if (phase === "empty") {
    return `<div class="empty"><div class="t">这个 workspace 还没有项目</div>
      <div>去 Plane 里建一个项目，或者在上面的下拉里换 workspace 对应配置。</div>
      <div class="acts"><button data-act="retry">刷新</button><button data-act="setup">改配置</button></div></div>`;
  }

  // list
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
      saveConfig({
        baseUrl: form.baseUrl,
        apiKey: form.apiKey,
        workspace: form.workspace,
        apiVersion: form.apiVersion,
      });
    });
  }

  document.querySelectorAll("[data-act]").forEach((el) => {
    el.addEventListener("click", () => {
      const act = el.dataset.act;
      if (act === "retry") return loadProjects();
      if (act === "setup") return setPhase("setup");
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
  boot();
});

setTimeout(() => {
  if (!ready) setPhase("nohost");
}, 1500);
