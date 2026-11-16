/**
 * 看板渲染：列式（横向列 + 拖拽）与列表式（纵向分组 + 移动到下拉）。
 * 只管画和拖，不知道 service 怎么调——移动/打开都交给回调。
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

export function boardHTML({ states, items, detailId, canDrag = true }) {
  if (!states.length) {
    return `<div class="empty"><div class="t">这个项目还没有状态</div>
      <div>去 Plane 里给项目配一套状态（Backlog / Todo / …），看板列会跟着变。</div></div>`;
  }
  const columns = states
    .map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      return `<section class="col" data-state-id="${ESC(s.id)}">
        <h2><span class="nm">${ESC(s.name)}</span><span class="n">${list.length}</span></h2>
        <div class="drop">${list.map((i) => cardHTML(i, canDrag, detailId)).join("") || (canDrag ? '<div class="blank">拖到这里</div>' : "")}</div>
      </section>`;
    })
    .join("");
  return `<div class="board">${columns}</div>`;
}

/** 列表视图：纵向分组、可折叠，每张卡带「移动到」下拉。 */
export function listHTML({ states, items, detailId }) {
  if (!states.length) return boardHTML({ states, items, detailId, canDrag: false });
  return states
    .map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      const body = list.length
        ? list
            .map((it) => cardHTML(it, false, detailId) + (detailId === it.id ? "" : moveHTML(it, states)))
            .join("")
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

function cardHTML(item, draggable, detailId) {
  const p = PRIO[item.priority] || PRIO.none;
  const who = item.assignees?.[0]?.name || "";
  const initial = who ? who.slice(-2) : "";
  const sel = detailId === item.id ? " sel" : "";
  return `<article class="card${sel}" draggable="${draggable}" data-id="${ESC(item.id)}" data-state-id="${ESC(item.stateId)}">
    <div class="t">${ESC(item.name)}</div>
    <div class="meta">
      <span class="ident">${item.identifier ? "XLMSC-" + ESC(item.identifier) : ""}</span>
      ${p.label ? `<span class="chip ${p.cls}">${p.label}</span>` : ""}
      ${initial ? `<span class="avatar">${ESC(initial)}</span>` : ""}
      <span class="grow"></span>
      ${item.concl ? `<span class="chip ok" title="已回填结论">✓ 结论</span>` : ""}
      ${item.sess ? `<span class="chip sess" data-open-session="${ESC(item.sess)}" title="跳到这个会话">⌘ 会话</span>` : ""}
    </div>
  </article>`;
}

/** 接上拖拽和点击：拖到哪一列调 onMove，点卡片调 onOpen。 */
export function wireBoard(root, { onMove, onOpen, onOpenSession }) {
  let dragging = null;

  root.querySelectorAll(".card[draggable]").forEach((el) => {
    el.addEventListener("click", () => onOpen(el.dataset.id));
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
    const sessChip = el.querySelector("[data-open-session]");
    if (sessChip) {
      sessChip.addEventListener("click", (e) => {
        e.stopPropagation();
        onOpenSession?.(sessChip.dataset.openSession);
      });
    }
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

/** 列表视图的交互：点卡片开详情，下拉改状态。 */
export function wireList(root, { onMove, onOpen, onOpenSession }) {
  root.querySelectorAll(".card").forEach((el) => {
    el.addEventListener("click", () => onOpen(el.dataset.id));
  });
  root.querySelectorAll("[data-open-session]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onOpenSession?.(el.dataset.openSession);
    });
  });
  root.querySelectorAll("[data-move]").forEach((sel) => {
    sel.addEventListener("click", (e) => e.stopPropagation());
    sel.addEventListener("change", () => {
      if (sel.value) onMove(sel.dataset.move, sel.value);
    });
  });
}
