/**
 * 看板渲染（列式）：状态列 + 卡片 + 拖拽。
 * 只管画和拖，不知道 service 怎么调——移动交给 onMove 回调。
 */

const PRIO = {
  urgent: { label: "紧急", cls: "p-urgent" },
  high: { label: "高", cls: "p-high" },
  medium: { label: "中", cls: "p-med" },
  low: { label: "低", cls: "p-low" },
  none: { label: "", cls: "" },
};

const ESC = (v) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function boardHTML({ states, items }) {
  if (!states.length) {
    return `<div class="empty"><div class="t">这个项目还没有状态</div>
      <div>去 Plane 里给项目配一套状态（Backlog / Todo / …），看板列会跟着变。</div></div>`;
  }
  const columns = states
    .map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      return `<section class="col" data-state-id="${ESC(s.id)}">
        <h2><span class="nm">${ESC(s.name)}</span><span class="n">${list.length}</span></h2>
        <div class="drop">${list.map(cardHTML).join("") || '<div class="blank">拖到这里</div>'}</div>
      </section>`;
    })
    .join("");
  return `<div class="board">${columns}</div>`;
}

function cardHTML(item, draggable = true) {
  const p = PRIO[item.priority] || PRIO.none;
  const who = item.assignees?.[0]?.name || "";
  const initial = who ? who.slice(-2) : "";
  return `<article class="card" draggable="${draggable}" data-id="${ESC(item.id)}" data-state-id="${ESC(item.stateId)}">
    <div class="t">${ESC(item.name)}</div>
    <div class="meta">
      <span class="ident">${item.identifier ? "XLMSC-" + ESC(item.identifier) : ""}</span>
      ${p.label ? `<span class="chip ${p.cls}">${p.label}</span>` : ""}
      ${initial ? `<span class="avatar">${ESC(initial)}</span>` : ""}
      <span class="grow"></span>
      ${item.sess ? `<span class="chip sess">⌘ 会话</span>` : ""}
    </div>
  </article>`;
}

/** 接上拖拽：拖到哪一列就调 onMove(itemId, stateId)。 */
export function wireBoard(root, { onMove }) {
  let dragging = null;

  root.querySelectorAll(".card[draggable]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragging = el.dataset.id;
      el.classList.add("dragging");
      try {
        e.dataTransfer.setData("text/plain", el.dataset.id);
        e.dataTransfer.effectAllowed = "move";
      } catch {
        /* 老浏览器 */
      }
    });
    el.addEventListener("dragend", () => {
      dragging = null;
      el.classList.remove("dragging");
      root.querySelectorAll(".col.over").forEach((c) => c.classList.remove("over"));
    });
  });

  root.querySelectorAll(".col").forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      col.classList.add("over");
    });
    col.addEventListener("dragleave", (e) => {
      if (!col.contains(e.relatedTarget)) col.classList.remove("over");
    });
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("over");
      const id = dragging || e.dataTransfer?.getData("text/plain");
      const to = col.dataset.stateId;
      if (id && to) onMove(id, to);
    });
  });
}

/* ---------------- 列表视图：纵向按状态分组 ---------------- */

/**
 * 单列纵向、按状态分组、可折叠；每张卡下面给「移动到」下拉。
 * 窄面板（300–420px）里不用左右滚，代价是改状态多两次点击。
 */
export function listHTML({ states, items }) {
  if (!states.length) return boardHTML({ states, items });
  return states
    .map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      const body = list.length
        ? list.map((it) => cardHTML(it, false) + moveHTML(it, states)).join("")
        : '<div class="blank">这个状态还没有工作项</div>';
      return `<details class="group" open>
        <summary><span class="nm">${ESC(s.name)}</span><span class="n">${list.length}</span></summary>
        <div class="gin">${body}</div>
      </details>`;
    })
    .join("");
}

function moveHTML(item, states) {
  const options = states
    .map((s) => `<option value="${ESC(s.id)}"${s.id === item.stateId ? " selected" : ""}>${ESC(s.name)}</option>`)
    .join("");
  return `<div class="moveto">移动到 <select data-move="${ESC(item.id)}">${options}</select></div>`;
}

/** 列表视图的交互：下拉改状态。 */
export function wireList(root, { onMove }) {
  root.querySelectorAll("[data-move]").forEach((sel) => {
    sel.addEventListener("change", () => {
      if (sel.value) onMove(sel.dataset.move, sel.value);
    });
  });
}
