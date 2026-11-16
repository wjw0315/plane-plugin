/**
 * Plane 扩展的面板（运行在 OpenChamber 的沙箱 iframe 里）。
 *
 * 第 01 片只做骨架：面板能画出来、能跟宿主握手、能问出本地 service 的状态。
 * 真正接 Plane 在下一片。
 */
import { connectHost } from "@openchamber/sdk";

const host = connectHost();

const el = {
  dot: document.getElementById("dot"),
  host: document.getElementById("hostState"),
  service: document.getElementById("serviceState"),
  retry: document.getElementById("retry"),
};

/** 宿主握手超时：iframe 里没有父窗口时（比如直接开 HTML 调试）不该一直转。 */
let readyTimer = null;

function setState(hostOk) {
  el.dot.className = hostOk ? "dot on" : "dot";
  el.host.textContent = hostOk ? "已连接" : "未连接（不在 OpenChamber 里）";
}

async function refreshService() {
  el.service.textContent = "检测中…";
  try {
    const status = await host.serviceStatus();
    const label = {
      ready: "就绪",
      starting: "启动中",
      stopped: "未启动",
      failed: "启动失败",
    }[status] || String(status);
    el.service.textContent = label;
  } catch (err) {
    el.service.textContent = "不可用";
  }
}

function onReady() {
  clearTimeout(readyTimer);
  setState(true);
  refreshService();
}

host.onReady((ctx) => {
  document.body.dataset.theme = ctx?.theme?.mode === "light" ? "light" : "dark";
  onReady();
});

host.onConnection?.((connection) => {
  setState(Boolean(connection?.connected));
});

el.retry.addEventListener("click", () => {
  refreshService();
});

setState(false);
refreshService();
// 1.2s 内没握手就当不在宿主里，界面照常可读，不卡在加载态
readyTimer = setTimeout(() => setState(false), 1200);
