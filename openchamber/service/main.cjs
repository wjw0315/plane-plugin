"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// service/src/main.js
var import_node_http = __toESM(require("node:http"), 1);
var PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
var TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || "";
if (!PORT || !TOKEN) {
  console.error("[plane] \u7F3A\u5C11 OPENCHAMBER_SERVICE_PORT / OPENCHAMBER_SERVICE_TOKEN\uFF0C\u65E0\u6CD5\u542F\u52A8");
  process.exit(1);
}
var server = import_node_http.default.createServer((req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    json(401, { ok: false, error: { code: "UNAUTHORIZED", message: "\u7F3A\u5C11\u6216\u9519\u8BEF\u7684 service token" } });
    return;
  }
  const path = (req.url || "").split("?")[0];
  if (req.method === "GET" && path === "/health") {
    json(200, { ok: true, service: "plane", version: "0.1.0" });
    return;
  }
  json(404, { ok: false, error: { code: "NOT_FOUND", message: `\u6CA1\u6709\u8FD9\u4E2A\u8DEF\u7531\uFF1A${req.method} ${path}` } });
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[plane] service \u76D1\u542C 127.0.0.1:${PORT}`);
});
function shutdown(signal) {
  console.log(`[plane] \u6536\u5230 ${signal}\uFF0C\u9000\u51FA`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1e4).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
