"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;

  // node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root = doc.documentElement;
    if (root.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root.setAttribute("data-oc-scrollbar-activity", "");
    const timers = /* @__PURE__ */ new WeakMap();
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== void 0)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1e3));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;

  // node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;

  // node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;

  // node_modules/@openchamber/sdk/dist/microphone.js
  var GUEST_MICROPHONE_SAMPLE_RATE_MIN = 8e3;
  var GUEST_MICROPHONE_SAMPLE_RATE_MAX = 192e3;
  var GUEST_MICROPHONE_OPEN_TIMEOUT_MS = 12e4;
  var createSampleQueue = (capacity) => {
    const chunks = [];
    let offset = 0;
    let queued = 0;
    return {
      push: (samples) => {
        chunks.push(samples);
        queued += samples.length;
        while (queued - offset > capacity && chunks.length > 1) {
          const dropped = chunks.shift();
          queued -= dropped?.length ?? 0;
          offset = 0;
        }
      },
      /** Fills `out` from the queue and pads the rest with silence. */
      pull: (out) => {
        let written = 0;
        while (written < out.length && chunks.length > 0) {
          const head = chunks[0];
          const count = Math.min(out.length - written, head.length - offset);
          out.set(head.subarray(offset, offset + count), written);
          written += count;
          offset += count;
          if (offset >= head.length) {
            chunks.shift();
            queued -= head.length;
            offset = 0;
          }
        }
        out.fill(0, written);
      },
      clear: () => {
        chunks.length = 0;
        offset = 0;
        queued = 0;
      },
      get size() {
        return queued - offset;
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = /* @__PURE__ */ new Set();
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== void 0 && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = /* @__PURE__ */ new Set();
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/manifest.js
  var GUEST_PROVIDER_LOGO_BYTES_MAX = 1024 * 1024;
  var TRACKER_URL_TOKENS = ["{id}", "{segment}", "{segments+}"];
  var TRACKER_URL_TOKEN_SET = new Set(TRACKER_URL_TOKENS);

  // node_modules/@openchamber/sdk/dist/session-events.js
  var GUEST_SESSION_EVENT_TYPES = [
    "turn-finished",
    "turn-failed",
    "permission-asked",
    "question-asked",
    "turn-started",
    "session-created",
    "session-archived",
    "session-deleted"
  ];
  var SESSION_EVENTS_IDLE_MS = 10 * 6e4;
  var EVENT_TYPES = new Set(GUEST_SESSION_EVENT_TYPES);

  // node_modules/@openchamber/sdk/dist/service-host.js
  var SERVICE_SCHEDULE_IDLE_MS = 10 * 6e4;
  var MENTIONS_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0; index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };

  // node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16e3;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request) => {
    try {
      if (String(request.id) !== request.id || !GUEST_POPOVER_ID.test(request.id) || !Number.isFinite(request.anchor.x) || Math.abs(request.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.y) || Math.abs(request.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.width) || !Number.isFinite(request.anchor.height) || request.anchor.width <= 0 || request.anchor.height <= 0 || request.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request.width) || request.width < GUEST_POPOVER_WIDTH_MIN || request.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request.height) || request.height < GUEST_POPOVER_HEIGHT_MIN || request.height > GUEST_POPOVER_HEIGHT_MAX || request.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request.side) || request.focus !== void 0 && request.focus !== true && request.focus !== false || !hasBoundedJsonTree(request.data) || !isFiniteJson(request.data))
        return false;
      return JSON.stringify(request.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_BLOCK_ANSWER_MAX = 2e3;
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32e3;
  var GUEST_COMPOSE_TEXT_MAX = 16e3;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2e3;
  var GUEST_ATTACH_TEXT_MAX = 16e3;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16e3;
  var GUEST_REQUEST_PATH_MAX = 2e3;
  var GUEST_REQUEST_TIMEOUT_MS = 2e4;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2e6;
  var GUEST_GENERATE_PROMPT_MAX = 64e3;
  var GUEST_GENERATE_SYSTEM_MAX = 8e3;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
  var GUEST_GENERATE_TIMEOUT_MS = 96e4;
  var GUEST_GENERATE_LATE_KEEP_MS = 60 * 6e4;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "REQUEST_FAILED",
    "RESPONSE_TOO_LARGE",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === void 0)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request) => {
    const id = request.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request.branches?.head);
      const base = clampBranch(request.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request.data)) {
      next.data = request.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request) => {
    const next = clampAttachRequest(request);
    if (request.projectId)
      next.projectId = request.projectId;
    if (request.navigation)
      next.navigation = request.navigation;
    if (request.worktree) {
      next.worktree = request.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request) => {
    const next = {
      text: request.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "service-event",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved",
    "generate-late",
    "microphone-audio",
    "microphone-ended"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire2) => {
    if (!isNonEmptyString(wire2.id))
      return null;
    if (wire2.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire2.id,
        ok: true
      };
      if (Object(wire2.payload) === wire2.payload) {
        message.payload = wire2.payload;
      }
      return message;
    }
    if (wire2.ok === false && isNonEmptyString(wire2.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire2.id,
        ok: false,
        error: wire2.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire2.code) ? wire2.code : void 0)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire2 = asWireRecord(data);
    if (!wire2 || wire2.channel !== OPENCHAMBER_SDK_CHANNEL || wire2.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire2.type === "result")
      return readResultMessage(wire2);
    if (!HOST_PUSH_TYPES.has(String(wire2.type)) || Object(wire2.payload) !== wire2.payload)
      return null;
    return wire2;
  };

  // node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
  var HostRequestError = class extends Error {
    constructor(code, message) {
      super(message);
      __publicField(this, "code");
      this.name = "HostRequestError";
      this.code = code;
    }
  };
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === void 0)
      return void 0;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : void 0;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = /* @__PURE__ */ new Set();
    const directoryListeners = /* @__PURE__ */ new Set();
    const sessionListeners = /* @__PURE__ */ new Set();
    const lifecycleListeners = /* @__PURE__ */ new Set();
    const connectionListeners = /* @__PURE__ */ new Set();
    const settingsListeners = /* @__PURE__ */ new Set();
    const itemListeners = /* @__PURE__ */ new Set();
    const blockListeners = /* @__PURE__ */ new Set();
    const serviceEventListeners = /* @__PURE__ */ new Set();
    const statusControlListeners = /* @__PURE__ */ new Set();
    const popoverClosedListeners = /* @__PURE__ */ new Set();
    const lateGenerateListeners = /* @__PURE__ */ new Set();
    const unclaimedLateGenerate = [];
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = /* @__PURE__ */ new Set();
    const fileSavedListeners = /* @__PURE__ */ new Set();
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = /* @__PURE__ */ new Map();
    const workspaceListeners = /* @__PURE__ */ new Map();
    const shellsListeners = /* @__PURE__ */ new Map();
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    let microphone = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const listenForLateGenerate = () => {
      if (disposed || target.parent === target || lateGenerateListeners.size === 0 || lastReady?.features?.lateGenerateResults !== true)
        return;
      post({ channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION, type: "generate-late-listen" });
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "microphone-audio") {
        microphone?.queue.push(message.payload.samples);
        return;
      }
      if (message.type === "microphone-ended") {
        const open = microphone;
        if (!open)
          return;
        microphone = null;
        open.release();
        emit(open.endedListeners, message.payload.reason);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        if (message.payload.block)
          emit(blockListeners, message.payload.block);
        listenForLateGenerate();
        return;
      }
      if (message.type === "service-event") {
        emit(serviceEventListeners, message.payload);
        return;
      }
      if (message.type === "generate-late") {
        if (lateGenerateListeners.size === 0)
          unclaimedLateGenerate.push(message.payload);
        else
          emit(lateGenerateListeners, message.payload);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail2 = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail2("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail2(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail2(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail2(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer });
        post(message);
      });
    };
    const request = (message) => send(message).then(() => void 0);
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const postMicrophoneClose = () => {
      if (!disposed && target.parent !== target)
        post({ ...envelope, type: "microphone-close", id: nextId(ids) });
    };
    const openMicrophone = async () => {
      if (microphone)
        throw new HostRequestError("HOST_REJECTED", "The microphone is already open in this frame.");
      if (lastReady?.features?.microphone !== true) {
        throw new HostRequestError("UNSUPPORTED", "This OpenChamber cannot share the microphone with extensions.");
      }
      const AudioContextCtor = globalThis.AudioContext;
      if (typeof AudioContextCtor !== "function")
        throw new HostRequestError("UNSUPPORTED", "This frame has no Web Audio.");
      const context = new AudioContextCtor();
      if (context.sampleRate < GUEST_MICROPHONE_SAMPLE_RATE_MIN || context.sampleRate > GUEST_MICROPHONE_SAMPLE_RATE_MAX) {
        void context.close().catch(() => void 0);
        throw new HostRequestError("UNSUPPORTED", `Audio at ${context.sampleRate} Hz is not supported.`);
      }
      const resumed = context.state === "suspended" ? context.resume().catch(() => void 0) : void 0;
      const queue = createSampleQueue(Math.round(context.sampleRate / 4));
      const processor = context.createScriptProcessor(1024, 1, 1);
      processor.onaudioprocess = (event) => queue.pull(event.outputBuffer.getChannelData(0));
      const destination = context.createMediaStreamDestination();
      processor.connect(destination);
      const endedListeners = /* @__PURE__ */ new Set();
      const open = {
        queue,
        endedListeners,
        release: () => {
          processor.onaudioprocess = null;
          processor.disconnect();
          queue.clear();
          for (const track of destination.stream.getTracks())
            track.stop();
          void context.close().catch(() => void 0);
        }
      };
      microphone = open;
      try {
        const result = await send(
          { ...envelope, type: "microphone-open", id: nextId(ids), payload: { sampleRate: context.sampleRate } },
          // The host may be waiting on the system's permission prompt.
          GUEST_MICROPHONE_OPEN_TIMEOUT_MS
        );
        if (!result || !("opened" in result) || result.opened !== true) {
          throw new HostRequestError("HOST_REJECTED", "Host did not open the microphone.");
        }
        await resumed;
        if (microphone !== open)
          throw new HostRequestError("DISCONNECTED", "The microphone closed while it was opening.");
      } catch (error) {
        if (microphone === open)
          microphone = null;
        open.release();
        postMicrophoneClose();
        throw error;
      }
      return {
        stream: destination.stream,
        close: () => {
          if (microphone !== open)
            return;
          microphone = null;
          open.release();
          postMicrophoneClose();
        },
        onEnded: (listener) => {
          endedListeners.add(listener);
          return () => {
            endedListeners.delete(listener);
          };
        }
      };
    };
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      void closePopover(lastReady.popover.id, "escape").catch(() => void 0);
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : void 0;
      if (!popover)
        return;
      const active = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active)
        return;
      popoverActivityReported = active;
      void setPopoverAnchorActive(popover.id, active).catch(() => void 0);
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== void 0 && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== void 0 && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : void 0;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onBlock: (listener) => {
        blockListeners.add(listener);
        if (lastReady?.block)
          listener(lastReady.block);
        return () => {
          blockListeners.delete(listener);
        };
      },
      onServiceEvent: (listener) => {
        serviceEventListeners.add(listener);
        return () => {
          serviceEventListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      answerBlock: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "block-answer",
        id: nextId(ids),
        payload: { text: text.trim().slice(0, GUEST_BLOCK_ANSWER_MAX) }
      }),
      openSurface: (surfaceId) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== void 0)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== void 0)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== void 0)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 18e4);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input) => {
        const prompt = input.prompt.trim();
        const system = input.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== void 0 && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input.maxOutputTokens === void 0 ? void 0 : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input.maxOutputTokens)));
        if (maxOutputTokens !== void 0 && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== void 0)
          payload.system = system;
        if (maxOutputTokens !== void 0)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      onLateGenerateResult: (listener) => {
        lateGenerateListeners.add(listener);
        for (const result of unclaimedLateGenerate.splice(0))
          emit([listener], result);
        listenForLateGenerate();
        return () => {
          lateGenerateListeners.delete(listener);
        };
      },
      openMicrophone,
      setBadge: (count) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        if (microphone) {
          postMicrophoneClose();
          microphone.release();
          microphone = null;
        }
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        blockListeners.clear();
        serviceEventListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
        lateGenerateListeners.clear();
        unclaimedLateGenerate.length = 0;
      }
    };
  };

  // node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.select",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize",
    "browser.close"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
  var SOURCE_CONTROL_PROVIDER_IDLE_MS = 10 * 6e4;
  var NOTIFICATIONS_PROVIDER_IDLE_MS = 10 * 6e4;
  var TRACKER_PROVIDER_IDLE_MS = 10 * 6e4;
  var QUOTA_PROVIDER_IDLE_MS = 10 * 6e4;

  // node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);

  // panel/src/board.js
  var PRIO = {
    urgent: { label: "\u7D27\u6025", cls: "p-urgent" },
    high: { label: "\u9AD8", cls: "p-high" },
    medium: { label: "\u4E2D", cls: "p-med" },
    low: { label: "\u4F4E", cls: "p-low" },
    none: { label: "", cls: "" }
  };
  var ESC = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function boardHTML({ states, items, detailId, canDrag = true }) {
    if (!states.length) {
      return `<div class="empty"><div class="t">\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u72B6\u6001</div>
      <div>\u53BB Plane \u91CC\u7ED9\u9879\u76EE\u914D\u4E00\u5957\u72B6\u6001\uFF08Backlog / Todo / \u2026\uFF09\uFF0C\u770B\u677F\u5217\u4F1A\u8DDF\u7740\u53D8\u3002</div></div>`;
    }
    const columns = states.map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      return `<section class="col" data-state-id="${ESC(s.id)}">
        <h2><span class="nm">${ESC(s.name)}</span><span class="n">${list.length}</span></h2>
        <div class="drop">${list.map((i) => cardHTML(i, canDrag, detailId)).join("") || (canDrag ? '<div class="blank">\u62D6\u5230\u8FD9\u91CC</div>' : "")}</div>
      </section>`;
    }).join("");
    return `<div class="board">${columns}</div>`;
  }
  function listHTML({ states, items, detailId }) {
    if (!states.length) return boardHTML({ states, items, detailId, canDrag: false });
    return states.map((s) => {
      const list = items.filter((i) => i.stateId === s.id);
      const body = list.length ? list.map((it) => cardHTML(it, false, detailId) + (detailId === it.id ? "" : moveHTML(it, states))).join("") : '<div class="blank">\u8FD9\u4E2A\u72B6\u6001\u8FD8\u6CA1\u6709\u5DE5\u4F5C\u9879</div>';
      return `<details class="group" open>
        <summary><span class="nm">${ESC(s.name)}</span><span class="n">${list.length}</span></summary>
        <div class="gin">${body}</div>
      </details>`;
    }).join("");
  }
  function moveHTML(item, states) {
    const options = states.map((s) => `<option value="${ESC(s.id)}"${s.id === item.stateId ? " selected" : ""}>${ESC(s.name)}</option>`).join("");
    return `<div class="moveto">\u79FB\u52A8\u5230 <select data-move="${ESC(item.id)}">${options}</select></div>`;
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
      ${item.concl ? `<span class="chip ok" title="\u5DF2\u56DE\u586B\u7ED3\u8BBA">\u2713 \u7ED3\u8BBA</span>` : ""}
      ${item.sess ? `<span class="chip sess" data-open-session="${ESC(item.sess)}" title="\u8DF3\u5230\u8FD9\u4E2A\u4F1A\u8BDD">\u2318 \u4F1A\u8BDD</span>` : ""}
    </div>
  </article>`;
  }
  function wireBoard(root, { onMove, onOpen, onOpenSession }) {
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
  function wireList(root, { onMove, onOpen, onOpenSession }) {
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

  // panel/src/main.js
  var BUILD = "0.2.1+diag";
  var host = connectHost();
  var $ = (id) => document.getElementById(id);
  var STORAGE_KEY = "plane.project";
  var VIEW_KEY = "plane.view";
  var device = { formFactor: "desktop", pointer: "fine" };
  var isPhone = () => device.formFactor === "phone" || device.pointer === "coarse";
  var state = {
    phase: "boot",
    // boot | nohost | setup | loading | list | empty | error
    config: null,
    projects: [],
    selected: null,
    board: { states: [], items: [] },
    view: "board",
    // board | list
    detail: null,
    // { id, item, description, loading, error }
    drawer: null,
    // 发起会话参数抽屉
    bindSheet: null,
    // 会话菜单动作带来的绑定 { sessionId, sessionTitle }
    configEdit: false,
    // 修改配置覆盖层
    createForm: null,
    // 新建工作项 { name, stateId, busy, error }
    toast: null,
    error: null,
    saveState: "",
    // 保存按钮旁边的即时反馈
    lastCall: null,
    // { method, path, status, code, message }
    calls: []
    // 最近 8 次调用，诊断用
  };
  function record(entry) {
    state.lastCall = entry;
    state.calls.unshift(entry);
    state.calls = state.calls.slice(0, 8);
    console.log(`[plane] ${entry.method} ${entry.path} \u2192 ${entry.status}${entry.code ? " " + entry.code : ""}`);
  }
  function paintCrash(text) {
    const box = $("crash");
    if (!box) return;
    box.hidden = false;
    box.textContent = text;
  }
  window.addEventListener("error", (e) => {
    paintCrash(`\u9762\u677F\u811A\u672C\u51FA\u9519\uFF1A${e.message}`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    paintCrash(`\u672A\u5904\u7406\u7684\u5F02\u6B65\u9519\u8BEF\uFF1A${r?.code ? r.code + "\uFF1A" : ""}${r?.message || String(r)}`);
  });
  var CALL_TIMEOUT_MS = 2e4;
  function withTimeout(promise, ms, method, path) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const err = new Error(`\u5BBF\u4E3B ${ms / 1e3}s \u5185\u6CA1\u6709\u56DE\u8BDD\uFF08${method} ${path}\uFF09\uFF0Cservice \u53EF\u80FD\u8FD8\u6CA1\u8D77\u6765`);
        err.code = "HOST_TIMEOUT";
        reject(err);
      }, ms);
      promise.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        }
      );
    });
  }
  async function callService(path, { method = "POST", body } = {}) {
    const started = Date.now();
    try {
      const res = await withTimeout(host.serviceRequest({
        method,
        path,
        body: body === void 0 ? void 0 : JSON.stringify(body)
      }), CALL_TIMEOUT_MS, method, path);
      let data = null;
      try {
        data = JSON.parse(res.body);
      } catch {
      }
      if (res.status >= 400 || !data || data.ok === false) {
        const info = data?.error || { code: "UNKNOWN", message: `service \u8FD4\u56DE ${res.status}` };
        record({ method, path, status: res.status, code: info.code, message: info.message, ms: Date.now() - started });
        const err = new Error(info.message || "\u672A\u77E5\u9519\u8BEF");
        err.code = info.code || "UNKNOWN";
        err.missing = info.missing;
        throw err;
      }
      record({ method, path, status: res.status, code: "", message: "", ms: Date.now() - started });
      return data;
    } catch (e) {
      if (!e.status) {
        record({ method, path, status: 0, code: e.code || "HOST_ERROR", message: e.message || String(e), ms: Date.now() - started });
      }
      throw e;
    }
  }
  async function boot() {
    setPhase("boot");
    try {
      const { config } = await callService("/config", { method: "GET" });
      state.config = config;
      state.selected = await readStoredProject();
      state.view = isPhone() ? "list" : await readStoredView() === "list" ? "list" : "board";
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
        body: { projectId: state.selected, name, stateId }
      });
      state.createForm = null;
      await loadBoard();
      showToast("\u5DE5\u4F5C\u9879\u5DF2\u521B\u5EFA");
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
  async function moveItem(itemId, toStateId) {
    const item = state.board.items.find((i) => i.id === itemId);
    if (!item || item.stateId === toStateId) return;
    const from = item.stateId;
    item.stateId = toStateId;
    render();
    try {
      await callService("/patch-state", {
        body: { projectId: state.selected, workItemId: itemId, stateId: toStateId }
      });
      const name = state.board.states.find((s) => s.id === toStateId)?.name || "";
      showToast(`\u5DF2\u79FB\u5230 ${name}`, "\u64A4\u9500", async () => {
        item.stateId = from;
        render();
        try {
          await callService("/patch-state", {
            body: { projectId: state.selected, workItemId: itemId, stateId: from }
          });
          showToast("\u5DF2\u64A4\u9500");
        } catch (e) {
          item.stateId = toStateId;
          render();
          showToast(`\u64A4\u9500\u5931\u8D25\uFF1A${e.code || ""}`, null, null, true);
        }
      });
    } catch (e) {
      item.stateId = from;
      render();
      showToast(`\u79FB\u52A8\u5931\u8D25\uFF1A${e.code || ""} ${e.message || ""}`, null, null, true);
    }
  }
  async function openDetail(id) {
    const item = state.board.items.find((i) => i.id === id);
    if (!item) return;
    if (state.detail?.id === id) return closeDetail();
    state.detail = { id, item, description: null, loading: true, error: null };
    render();
    try {
      const { item: fresh, description } = await callService("/work-item", {
        body: { projectId: state.selected, workItemId: id }
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
  function openSessionById(sessionId) {
    if (!sessionId) return;
    host.openSession(sessionId).then(() => showToast("\u5DF2\u8DF3\u5230\u4F1A\u8BDD")).catch(() => showToast("\u8DF3\u8F6C\u5931\u8D25", null, null, true));
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
    }, actionLabel ? 5e3 : 3e3);
  }
  async function saveConfig(fields) {
    state.saveState = "\u4FDD\u5B58\u4E2D\u2026";
    state.error = null;
    render();
    try {
      const { config } = await callService("/config", {
        body: {
          baseUrl: fields.baseUrl,
          apiKey: fields.apiKey,
          workspace: fields.workspace,
          apiVersion: fields.apiVersion
        }
      });
      state.config = config;
      if (!config.configured) {
        state.saveState = "";
        state.error = { code: "CONFIG_MISSING", message: "\u4E09\u4E2A\u5FC5\u586B\u90FD\u586B\u4E0A\u518D\u4FDD\u5B58" };
        return setPhase("setup");
      }
      state.saveState = "\u5DF2\u4FDD\u5B58\uFF0C\u6B63\u5728\u62C9\u9879\u76EE\u2026";
      await loadProjects();
      if (state.configEdit) {
        state.configEdit = false;
        state.error = null;
        state.saveState = "";
        render();
        if (state.phase !== "board") setPhase("board");
        else await loadBoard();
        showToast("\u914D\u7F6E\u5DF2\u66F4\u65B0");
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
    }
  }
  async function storeProject(id) {
    try {
      await host.storage.set(STORAGE_KEY, id);
    } catch {
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
    box.innerHTML = `<span>${ESC2(t.text)}</span>${t.actionLabel ? `<button id="toastAction">${ESC2(t.actionLabel)}</button>` : ""}`;
  }
  function setPhase(phase) {
    state.phase = phase;
    render();
  }
  var ESC2 = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function diagnostics() {
    const last = state.lastCall;
    return `<details class="diag"><summary>\u8BCA\u65AD\uFF08${ESC2(BUILD)}\uFF09</summary>
    <div>\u5BBF\u4E3B\uFF1A${ESC2($("hostState").textContent || "\u2014")} \xB7 service\uFF1A${ESC2($("svcState")?.textContent || "\u2014")}</div>
    <div>\u6700\u8FD1\u8C03\u7528\uFF1A${last ? `${ESC2(last.method)} ${ESC2(last.path)} \u2192 ${last.status} ${ESC2(last.code || "")}${last.ms ? ` (${last.ms}ms)` : ""}` : "\u65E0"}</div>
    ${last?.message ? `<div>\u6D88\u606F\uFF1A${ESC2(last.message)}</div>` : ""}
    <ol>${state.calls.slice(1, 5).map((c) => `<li>${ESC2(c.method)} ${ESC2(c.path)} \u2192 ${c.status} ${ESC2(c.code || "")}</li>`).join("")}</ol>
  </details>`;
  }
  function render() {
    const healthy = state.phase === "board" || state.phase === "empty";
    $("dot").className = healthy ? "dot on" : "dot";
    $("hostState").textContent = state.phase === "nohost" ? "\u672A\u8FDE\u63A5" : "\u5DF2\u8FDE\u63A5";
    const seg = $("seg");
    if (seg) {
      seg.hidden = state.phase !== "board";
      seg.querySelectorAll("[data-view]").forEach((el) => {
        el.setAttribute("aria-pressed", String(el.dataset.view === state.view));
      });
    }
    const proj = $("proj");
    proj.hidden = state.phase !== "board";
    proj.innerHTML = state.projects.map((p) => `<option value="${ESC2(p.id)}"${p.id === state.selected ? " selected" : ""}>${ESC2(p.name)}</option>`).join("");
    $("view").innerHTML = viewFor(state.phase) + diagnostics();
    renderToast();
    wire();
  }
  function viewFor(phase) {
    const c = state.config || {};
    const err = state.error;
    if (phase === "boot" || phase === "loading") {
      return `<div class="hint">${phase === "boot" ? "\u6B63\u5728\u8FDE\u63A5 Plane\u2026" : "\u6B63\u5728\u62C9\u9879\u76EE\u5217\u8868\u2026"}</div>`;
    }
    if (phase === "nohost") {
      return `<div class="empty"><div class="t">\u4E0D\u5728 OpenChamber \u91CC</div>
      <div>\u9762\u677F\u8981\u901A\u8FC7\u5BBF\u4E3B\u624D\u80FD\u8BBF\u95EE\u672C\u5730 service\u3002\u88C5\u8FDB OpenChamber \u540E\u518D\u6253\u5F00\u8FD9\u4E2A\u9762\u677F\u3002</div></div>`;
    }
    if (phase === "setup") {
      return `<div id="setupForm" class="form" autocomplete="off">
      <div class="t">\u8FDE\u63A5 Plane</div>
      ${err ? `<div class="err">${ESC2(err.code)}\uFF1A${ESC2(err.message)}</div>` : ""}
      <label>\u5730\u5740<input name="baseUrl" placeholder="http://192.168.1.188:8080" value="${ESC2(c.baseUrl || "")}"></label>
      <label>API Key<input name="apiKey" type="password" placeholder="${c.hasKey ? "\u5DF2\u4FDD\u5B58\uFF0C\u7559\u7A7A\u5219\u4E0D\u53D8" : "plane_api_\u2026"}" value=""></label>
      <label>Workspace<input name="workspace" placeholder="g2" value="${ESC2(c.workspace || "")}"></label>
      <label>API \u7248\u672C<input name="apiVersion" list="versions" placeholder="v1 \u6216 v2" value="${ESC2(c.apiVersion || "v2")}">
        <datalist id="versions"><option value="v1"><option value="v2"></datalist></label>
      <button type="button" id="setupSave">\u4FDD\u5B58\u5E76\u8FDE\u63A5</button>
      <div class="fine" id="saveState">${ESC2(state.saveState)}</div>
      <div class="fine">Key \u5B58\u5728\u6269\u5C55\u81EA\u5DF1\u7684\u6570\u636E\u76EE\u5F55\uFF08600 \u6743\u9650\uFF09\uFF0C\u9762\u677F\u53EA\u62FF\u5230\u8131\u654F\u89C6\u56FE\u3002</div>
    </div>`;
    }
    if (phase === "error") {
      const retry = err?.code === "NETWORK" || err?.code === "RATE_LIMITED" ? `<button data-act="retry">\u91CD\u8BD5</button>` : "";
      return `<div class="empty"><div class="t">\u8FDE\u4E0D\u4E0A Plane</div>
      <div class="err">${ESC2(err?.code || "")}\uFF1A${ESC2(err?.message || "")}</div>
      <div class="acts">${retry}<button data-act="setup">\u6539\u914D\u7F6E</button><button data-act="retry">\u518D\u8BD5\u4E00\u6B21</button></div></div>`;
    }
    if (phase === "empty") {
      return `<div class="empty"><div class="t">\u8FD9\u4E2A workspace \u8FD8\u6CA1\u6709\u9879\u76EE</div>
      <div>\u53BB Plane \u91CC\u5EFA\u4E00\u4E2A\u9879\u76EE\uFF0C\u6216\u8005\u6539\u914D\u7F6E\u6362 workspace\u3002</div>
      <div class="acts"><button data-act="retry">\u5237\u65B0</button><button data-act="setup">\u6539\u914D\u7F6E</button></div></div>`;
    }
    if (phase === "board") {
      const detailId = state.detail?.id ?? null;
      const base = state.view === "list" ? listHTML({ ...state.board, detailId }) + (state.detail ? inlineDetailHTML() : "") : boardHTML({ ...state.board, detailId, canDrag: !isPhone() }) + (state.detail ? overlayDetailHTML() : "");
      return base + (state.drawer ? drawerHTML() : "") + (state.concl ? conclHTML() : "") + (state.bindSheet ? bindSheetHTML() : "") + (state.configEdit ? configEditHTML() : "") + (state.createForm ? createItemHTML() : "");
    }
    return "";
  }
  var PRIO_LABEL = { urgent: "\u7D27\u6025", high: "\u9AD8", medium: "\u4E2D", low: "\u4F4E", none: "\u2014" };
  function detailBody(item) {
    const d = state.detail;
    const states = state.board.states;
    const stateButtons = states.map(
      (s) => `<button class="stbtn" data-setstate="${ESC2(item.id)}" data-to="${ESC2(s.id)}"
        aria-pressed="${s.id === item.stateId}">${ESC2(s.name)}</button>`
    ).join("");
    const desc = d.loading ? '<div class="fine">\u6B63\u5728\u53D6\u6700\u65B0\u63CF\u8FF0\u2026</div>' : d.error ? `<div class="err">${ESC2(d.error.code)}${d.error.message ? "\uFF1A" + ESC2(d.error.message) : ""}\uFF08\u770B\u677F\u6570\u636E\u4ECD\u53EF\u7528\uFF09</div>` : d.description ? `<div class="desc">${ESC2(d.description)}</div>` : '<div class="fine">\u8FD9\u5F20\u5361\u6CA1\u6709\u63CF\u8FF0</div>';
    return `<h3 class="dtitle">${ESC2(item.name)}</h3>
    <div class="frow"><span class="k">\u72B6\u6001</span><span class="stbtns">${stateButtons}</span></div>
    <div class="frow"><span class="k">\u7F16\u53F7</span><span class="ident">${item.identifier ? "XLMSC-" + ESC2(item.identifier) : "\u2014"}</span></div>
    <div class="frow"><span class="k">\u4F18\u5148\u7EA7</span><span>${ESC2(PRIO_LABEL[item.priority] || "\u2014")}</span></div>
    <div class="frow"><span class="k">\u6307\u6D3E</span><span>${ESC2(item.assignees?.map((a) => a.name).filter(Boolean).join("\u3001") || "\u672A\u6307\u6D3E")}</span></div>
    <div class="frow"><span class="k">\u6807\u7B7E</span><span>${item.labels?.length ? item.labels.length + " \u4E2A" : "\u65E0"}</span></div>
    <div class="frow"><span class="k">\u4F1A\u8BDD</span>${item.sess ? `<span class="chip sess" data-open-session="${ESC2(item.sess)}">\u2318 ${ESC2(item.sess)} \xB7 \u8DF3\u8F6C</span>` : `<button class="btn" data-start-session="${ESC2(item.id)}">\u53D1\u8D77\u4F1A\u8BDD</button>`}</div>
    <div class="sec"><h4>\u7ED3\u8BBA</h4>${item.concl ? `<div class="desc">${ESC2(item.conclText || "")}</div>
           <div class="fine">\u2713 \u5DF2\u56DE\u586B\u5230 Plane \u8BC4\u8BBA \xB7 ${ESC2(item.conclAt || "")}</div>` : `<div class="fine">${item.sess ? "\u4F1A\u8BDD\u8DD1\u5B8C\u540E\u53EF\u4EE5\u628A\u7ED3\u8BBA\u5199\u56DE\u8FD9\u5F20\u5361\u3002" : "\u8FD8\u6CA1\u6709\u7ED3\u8BBA\u3002"}</div>
           <div class="acts" style="margin-top:8px"><button class="btn" data-backfill="${ESC2(item.id)}">\u56DE\u586B\u7ED3\u8BBA\u2026</button></div>`}</div>
    <div class="sec"><h4>\u63CF\u8FF0</h4>${desc}</div>
    <div class="acts">
      <button class="btn pri" data-plane="${ESC2(item.id)}">\u5728 Plane \u6253\u5F00 \u2197</button>
      <button class="btn" data-copy="${ESC2(item.id)}">\u590D\u5236\u94FE\u63A5</button>
    </div>`;
  }
  function overlayDetailHTML() {
    return `<div class="overlay"><div class="dhead"><button class="back" data-close="1" title="\u8FD4\u56DE">\u2039</button>
    <span class="ident">${state.detail.item.identifier ? "XLMSC-" + ESC2(state.detail.item.identifier) : ""}</span>
    <span class="grow"></span><span class="fine">Esc \u8FD4\u56DE</span></div>
    <div class="dbody">${detailBody(state.detail.item)}<div class="acts"><button class="btn" data-close="1">\u5173\u95ED</button></div></div></div>`;
  }
  function inlineDetailHTML() {
    return `<div class="inlineD">${detailBody(state.detail.item)}<div class="acts"><button class="btn" data-close="1">\u6536\u8D77</button></div></div>`;
  }
  var MODEL_PRESETS = ["magpie/glm-5.3", "anthropic/claude-sonnet-5", "openai/gpt-5.2", "deepseek/deepseek-v4-flash"];
  var AGENT_PRESETS = ["build", "plan"];
  var VARIANT_PRESETS = ["default", "low", "medium", "high"];
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
      extra: ""
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
      state.drawer.error = { code: e.code || "PROJECTS_FAILED", message: e.message || "\u8BFB\u4E0D\u5230 OpenChamber \u9879\u76EE" };
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
    return parts.join("\n\n") + "\n\n\u5B8C\u6210\u540E\u603B\u7ED3\uFF1A\u6539\u4E86\u4EC0\u4E48\u3001\u600E\u4E48\u9A8C\u8BC1\u3001\u9057\u7559\u4EC0\u4E48\u3002";
  }
  async function submitDrawer() {
    const d = state.drawer;
    const item = state.board.items.find((i) => i.id === d.itemId);
    if (!d || !item || d.busy) return;
    const project = d.projects.find((p) => p.id === d.projectId);
    if (!project) {
      d.error = { code: "NO_PROJECT", message: "\u5148\u9009\u4E00\u4E2A OpenChamber \u9879\u76EE" };
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
            worktree: d.worktree ? { name: d.wtName, baseBranch: d.baseBranch } : null
          }
        });
        sessionId = out.sessionId;
      } else {
        const res = await host.startSession({
          providerId: "plane",
          id: item.id,
          title: `XLMSC-${item.identifier || item.id} ${item.name}`,
          url: itemUrl(item),
          text: prompt,
          projectId: project.id
        });
        sessionId = res?.sessionId || null;
      }
      if (!sessionId) throw Object.assign(new Error("\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u4F1A\u8BDD id"), { code: "NO_SESSION" });
      const inProgress = state.board.states.find((s) => /in progress|doing|进行中/i.test(s.name));
      try {
        await callService("/bind-session", {
          body: { projectId: state.selected, workItemId: item.id, sessionId, stateId: inProgress?.id }
        });
      } catch (e) {
        showToast(`\u4F1A\u8BDD\u5DF2\u5EFA\uFF0C\u4F46\u7ED1\u5B9A\u5931\u8D25\uFF1A${e.code || ""}`, null, null, true);
      }
      item.sess = sessionId;
      if (inProgress) item.stateId = inProgress.id;
      state.drawer = null;
      render();
      showToast(`\u4F1A\u8BDD\u5DF2\u521B\u5EFA\uFF1A${sessionId}`);
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
    const opts = (list, cur) => list.map((v) => `<option value="${ESC2(v)}"${v === cur ? " selected" : ""}>${ESC2(v)}</option>`).join("");
    return `<div class="overlay"><div class="dhead">
      <button class="back" data-drawer-close="1" title="\u8FD4\u56DE">\u2039</button>
      <span class="ident">\u53D1\u8D77\u4F1A\u8BDD \xB7 XLMSC-${ESC2(item.identifier || item.id)}</span>
      <span class="grow"></span><span class="fine">Esc \u8FD4\u56DE</span></div>
    <div class="dbody">
      ${d.error ? `<div class="err">${ESC2(d.error.code)}\uFF1A${ESC2(d.error.message)}</div>` : ""}
      <label class="fld">\u9879\u76EE
        <select id="dwProject">${(d.projects || []).map((p) => `<option value="${ESC2(p.id)}"${p.id === d.projectId ? " selected" : ""}>${ESC2(p.name)}</option>`).join("")}</select>
      </label>
      <label class="fld">\u5DE5\u4F5C\u533A
        <span class="wt"><input type="checkbox" id="dwWt"${d.worktree ? " checked" : ""}><span>\u5168\u65B0 worktree</span>
        <input type="text" id="dwWtName" value="${ESC2(d.wtName)}" placeholder="worktree \u540D">
        <input type="text" id="dwBase" value="${ESC2(d.baseBranch)}" placeholder="\u57FA\u7EBF\u5206\u652F"></span>
      </label>
      <label class="fld">\u6A21\u578B
        <select id="dwModel"><option value="">\u8DDF\u968F\u5F53\u524D\u9ED8\u8BA4</option>${opts(MODEL_PRESETS, d.model)}</select>
      </label>
      <label class="fld">\u601D\u8003\u7EA7\u522B
        <select id="dwVariant">${opts(VARIANT_PRESETS, d.variant)}</select>
      </label>
      <label class="fld">\u667A\u80FD\u4F53
        <select id="dwAgent">${opts(AGENT_PRESETS, d.agent)}</select>
      </label>
      <div class="fine" style="margin-top:8px">\u8865\u5145\u63D0\u793A\u8BCD</div>
      <textarea id="dwExtra" placeholder="\u7EA6\u675F\u3001\u9A8C\u6536\u6807\u51C6\u3001\u4E0D\u8981\u78B0\u7684\u6587\u4EF6\u2026">${ESC2(d.extra)}</textarea>
      <div class="fine" style="margin-top:8px">\u5C06\u53D1\u9001</div>
      <pre class="pv" id="dwPreview">${ESC2(promptForDrawer(item))}</pre>
      <div class="acts">
        <button class="btn pri" data-drawer-go="1"${d.busy ? " disabled" : ""}>${d.busy ? "\u53D1\u8D77\u4E2D\u2026" : "\u5F00\u59CB\u4F1A\u8BDD"}</button>
        <button class="btn" data-drawer-close="1">\u53D6\u6D88</button>
      </div>
      <div class="fine">\u9009\u4E86\u4E09\u4EF6\u5957\u6216 worktree \u8D70 service\uFF08\u80FD\u6307\u5B9A\u6A21\u578B\uFF09\uFF1B\u90FD\u4E0D\u6539\u5219\u8D70\u5BBF\u4E3B startSession\uFF08\u66F4\u8F7B\uFF09\u3002</div>
    </div></div>`;
  }
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
      c.error = { code: "EMPTY", message: "\u8349\u7A3F\u662F\u7A7A\u7684" };
      return render();
    }
    c.busy = true;
    c.error = null;
    render();
    try {
      const { comment } = await callService("/comment", {
        body: { projectId: state.selected, workItemId: item.id, body: text, sessionId: item.sess || void 0 }
      });
      item.concl = true;
      item.conclText = text;
      item.conclAt = (comment?.createdAt || "").slice(0, 16).replace("T", " ") || "\u521A\u521A";
      state.concl = null;
      render();
      showToast("\u5DF2\u5199\u5165 Plane \u8BC4\u8BBA");
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
      <button class="back" data-concl-close="1" title="\u8FD4\u56DE">\u2039</button>
      <span class="ident">\u56DE\u586B\u7ED3\u8BBA \xB7 XLMSC-${ESC2(item?.identifier || c.itemId)}</span>
      <span class="grow"></span><span class="fine">Esc \u8FD4\u56DE</span></div>
    <div class="dbody">
      <div class="fine">\u4F5C\u4E3A\u8BC4\u8BBA\u8FFD\u52A0\u5230 Plane\uFF0C\u4E0D\u6539\u52A8\u539F\u63CF\u8FF0\u3002</div>
      ${c.error ? `<div class="err">${ESC2(c.error.code)}\uFF1A${ESC2(c.error.message)}</div>` : ""}
      <textarea id="conclText" style="height:120px;margin-top:8px" placeholder="\u6539\u4E86\u4EC0\u4E48\u3001\u600E\u4E48\u9A8C\u8BC1\u3001\u9057\u7559\u4EC0\u4E48\u2026">${ESC2(c.text)}</textarea>
      <div class="acts">
        <button class="btn pri" data-concl-go="1"${c.busy || !String(c.text || "").trim() ? " disabled" : ""}>${c.busy ? "\u5199\u5165\u4E2D\u2026" : "\u5199\u5165\u8BC4\u8BBA"}</button>
        <button class="btn" data-concl-close="1">\u53D6\u6D88</button>
      </div>
    </div></div>`;
  }
  function wire() {
    const setupSave = $("setupSave");
    if (setupSave) {
      setupSave.addEventListener("click", () => {
        if (setupSave.disabled) return;
        const form = $("setupForm");
        if (!form) return;
        const input = (name) => form.querySelector(`input[name="${name}"]`);
        setupSave.disabled = true;
        setupSave.textContent = "\u4FDD\u5B58\u4E2D\u2026";
        saveConfig({
          baseUrl: input("baseUrl")?.value ?? "",
          apiKey: input("apiKey")?.value ?? "",
          workspace: input("workspace")?.value ?? "",
          apiVersion: input("apiVersion")?.value ?? ""
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
            body: { projectId: state.selected, workItemId: item.id, sessionId: b.sessionId }
          });
          item.sess = b.sessionId;
          state.bindSheet = null;
          render();
          showToast("\u5DF2\u7ED1\u5B9A\uFF0C\u4F1A\u8BDD\u7ED3\u8BBA\u4F1A\u81EA\u52A8\u56DE\u586B");
        } catch (e2) {
          b.busy = false;
          showToast(`\u7ED1\u5B9A\u5931\u8D25\uFF1A${e2.code || ""} ${e2.message || ""}`, null, null, true);
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
        host.openSession(el.dataset.openSession).catch(() => showToast("\u8DF3\u8F6C\u5931\u8D25", null, null, true));
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
          apiVersion: input("apiVersion")?.value ?? ""
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
        const go2 = document.querySelector("[data-concl-go]");
        if (go2) go2.disabled = !conclText.value.trim() || c.busy;
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
        if (item) host.openUrl(itemUrl(item)).catch(() => showToast("\u6253\u4E0D\u5F00\u6D4F\u89C8\u5668", null, null, true));
      });
    });
    document.querySelectorAll("[data-copy]").forEach((el) => {
      el.addEventListener("click", async () => {
        const item = state.board.items.find((i) => i.id === el.dataset.copy);
        if (!item) return;
        try {
          await host.writeClipboard(itemUrl(item));
          showToast("\u94FE\u63A5\u5DF2\u590D\u5236");
        } catch {
          showToast("\u590D\u5236\u5931\u8D25", null, null, true);
        }
      });
    });
    document.querySelectorAll("[data-view]").forEach((el) => {
      el.addEventListener("click", async () => {
        const v = el.dataset.view;
        if (v === state.view) return;
        state.view = v;
        await storeView(v);
        render();
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
  function handleHostCallbacks() {
    host.onResolve(async (req) => {
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
        data: { workItemId: card.id }
      };
    });
    host.onItem((item) => {
      if (!item) return;
      if (item.kind === "link") {
        const seq = String(item.identifier || "").replace(/^.*-/, "");
        const card = state.board.items.find((i) => i.identifier === seq);
        if (card) return openDetail(card.id);
        showToast(`\u627E\u4E0D\u5230 ${item.identifier}\uFF0C\u5237\u65B0\u770B\u677F\u8BD5\u8BD5`, null, null, true);
        return;
      }
      if (item.kind === "session") {
        state.bindSheet = { sessionId: item.sessionId, sessionTitle: item.sessionTitle };
        render();
      }
    });
  }
  $("proj").addEventListener("change", async (e) => {
    state.selected = e.target.value;
    await storeProject(state.selected);
    await loadBoard();
  });
  $("refresh").addEventListener("click", () => state.phase === "board" ? loadBoard() : loadProjects());
  var ready = false;
  var booted = false;
  host.onReady((ctx) => {
    ready = true;
    document.body.dataset.theme = ctx?.theme?.mode === "light" ? "light" : "dark";
    if (ctx?.device) {
      Object.assign(device, ctx.device);
      document.body.dataset.device = device.formFactor;
    }
    render();
    if (!booted) {
      booted = true;
      refreshServiceState();
      handleHostCallbacks();
      boot();
    }
  });
  host.onConnection?.((c) => {
    $("hostState").textContent = c?.connected === false ? "\u8FDE\u63A5\u4E2D\u65AD" : "\u5DF2\u8FDE\u63A5";
  });
  async function refreshServiceState() {
    try {
      const status = await host.serviceStatus();
      const label = { ready: "\u5C31\u7EEA", starting: "\u542F\u52A8\u4E2D", stopped: "\u672A\u542F\u52A8", failed: "\u542F\u52A8\u5931\u8D25" }[status?.status ?? status] || String(status?.status ?? status);
      $("svcState").textContent = label;
    } catch {
      $("svcState").textContent = "\u4E0D\u53EF\u7528";
    }
  }
  setTimeout(() => {
    if (!ready) setPhase("nohost");
  }, 1500);
})();
