"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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

// node_modules/@openchamber/sdk/dist/api-version.js
var OPENCHAMBER_SDK_CHANNEL, OPENCHAMBER_SDK_API_VERSION, OPENCHAMBER_SDK_MANIFEST_API_VERSIONS;
var init_api_version = __esm({
  "node_modules/@openchamber/sdk/dist/api-version.js"() {
    OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
    OPENCHAMBER_SDK_API_VERSION = 1;
    OPENCHAMBER_SDK_MANIFEST_API_VERSIONS = [1];
  }
});

// node_modules/@openchamber/sdk/dist/scrollbar-style.js
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
var GUEST_SCROLLING_ATTRIBUTE, GUEST_SCROLLBAR_CSS, GUEST_SCROLLBAR_SCRIPT;
var init_scrollbar_style = __esm({
  "node_modules/@openchamber/sdk/dist/scrollbar-style.js"() {
    GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
    GUEST_SCROLLBAR_CSS = `
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
    GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;
  }
});

// node_modules/@openchamber/sdk/dist/frame-policy.js
var guestFramePolicy;
var init_frame_policy = __esm({
  "node_modules/@openchamber/sdk/dist/frame-policy.js"() {
    guestFramePolicy = (connectSource, origins = []) => {
      const approved = origins.length > 0 ? ` ${origins.join(" ")}` : "";
      const local = "'self' data: blob:";
      const connect = [connectSource, ...origins].filter((source) => Boolean(source));
      return [
        "default-src 'none'",
        `script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' ${local}`,
        `style-src 'unsafe-inline' ${local}${approved}`,
        `img-src ${local}${approved}`,
        `font-src ${local}${approved}`,
        `media-src ${local}${approved}`,
        `worker-src ${local}`,
        `frame-src ${local}`,
        `connect-src ${connect.length > 0 ? connect.join(" ") : "'none'"}`,
        "object-src 'none'",
        "form-action 'none'"
      ].join("; ");
    };
  }
});

// node_modules/@openchamber/sdk/dist/workspace.js
var GUEST_STORAGE_KEY_MAX, GUEST_STORAGE_VALUE_BYTES, GUEST_STORAGE_TOTAL_BYTES, GUEST_DEVICE_STORAGE_TOTAL_BYTES, GUEST_STORAGE_KEYS_MAX;
var init_workspace = __esm({
  "node_modules/@openchamber/sdk/dist/workspace.js"() {
    GUEST_STORAGE_KEY_MAX = 128;
    GUEST_STORAGE_VALUE_BYTES = 65536;
    GUEST_STORAGE_TOTAL_BYTES = 2097152;
    GUEST_DEVICE_STORAGE_TOTAL_BYTES = 16777216;
    GUEST_STORAGE_KEYS_MAX = 2e3;
  }
});

// node_modules/@openchamber/sdk/dist/shells.js
var GUEST_SHELL_ID_MAX, GUEST_SHELLS_MAX, GUEST_SHELL_OUTPUT_TAIL_MAX, GUEST_SHELL_END_STATUSES;
var init_shells = __esm({
  "node_modules/@openchamber/sdk/dist/shells.js"() {
    GUEST_SHELL_ID_MAX = 128;
    GUEST_SHELLS_MAX = 200;
    GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;
    GUEST_SHELL_END_STATUSES = ["exited", "timeout", "killed", "stopped", "unknown"];
  }
});

// node_modules/@openchamber/sdk/dist/microphone.js
var GUEST_MICROPHONE_SAMPLE_RATE_MIN, GUEST_MICROPHONE_SAMPLE_RATE_MAX, GUEST_MICROPHONE_OPEN_TIMEOUT_MS, GUEST_MICROPHONE_FRAME_MAX, GUEST_MICROPHONE_END_REASONS, createSampleQueue;
var init_microphone = __esm({
  "node_modules/@openchamber/sdk/dist/microphone.js"() {
    GUEST_MICROPHONE_SAMPLE_RATE_MIN = 8e3;
    GUEST_MICROPHONE_SAMPLE_RATE_MAX = 192e3;
    GUEST_MICROPHONE_OPEN_TIMEOUT_MS = 12e4;
    GUEST_MICROPHONE_FRAME_MAX = 16384;
    GUEST_MICROPHONE_END_REASONS = ["revoked", "device-lost"];
    createSampleQueue = (capacity) => {
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
  }
});

// node_modules/@openchamber/sdk/dist/status-controls.js
var GUEST_STATUS_CONTROLS_MAX, GUEST_STATUS_CONTROL_ID, GUEST_STATUS_CONTROL_LABEL_MAX, GUEST_STATUS_CONTROL_OPTIONS_MAX, GUEST_STATUS_CONTROL_VALUE_MAX, isControlObject, hasOnlyKeys, isLabel, isValue, isGuestStatusControls;
var init_status_controls = __esm({
  "node_modules/@openchamber/sdk/dist/status-controls.js"() {
    GUEST_STATUS_CONTROLS_MAX = 4;
    GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
    GUEST_STATUS_CONTROL_LABEL_MAX = 60;
    GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
    GUEST_STATUS_CONTROL_VALUE_MAX = 80;
    isControlObject = (value) => Object(value) === value && !Array.isArray(value);
    hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
    isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
    isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
    isGuestStatusControls = (controls) => {
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
  }
});

// node_modules/@openchamber/sdk/dist/status-view.js
var GUEST_STATUS_SOURCE_INTERVAL_MIN, GUEST_STATUS_SOURCE_INTERVAL_MAX, GUEST_STATUS_SOURCE_INTERVAL_DEFAULT, GUEST_STATUS_VIEW_ROWS_MAX, GUEST_STATUS_VIEW_ACTIONS_MAX, GUEST_STATUS_VIEW_CHIPS_MAX, GUEST_STATUS_VIEW_CHART_POINTS_MAX, GUEST_STATUS_VIEW_SEGMENTS_MIN, GUEST_STATUS_VIEW_SEGMENTS_MAX, GUEST_STATUS_VIEW_TEXT_MAX, GUEST_STATUS_VIEW_NOTE_MAX, GUEST_STATUS_VIEW_ICON;
var init_status_view = __esm({
  "node_modules/@openchamber/sdk/dist/status-view.js"() {
    GUEST_STATUS_SOURCE_INTERVAL_MIN = 1e3;
    GUEST_STATUS_SOURCE_INTERVAL_MAX = 6e4;
    GUEST_STATUS_SOURCE_INTERVAL_DEFAULT = 2e3;
    GUEST_STATUS_VIEW_ROWS_MAX = 16;
    GUEST_STATUS_VIEW_ACTIONS_MAX = 2;
    GUEST_STATUS_VIEW_CHIPS_MAX = 6;
    GUEST_STATUS_VIEW_CHART_POINTS_MAX = 120;
    GUEST_STATUS_VIEW_SEGMENTS_MIN = 2;
    GUEST_STATUS_VIEW_SEGMENTS_MAX = 4;
    GUEST_STATUS_VIEW_TEXT_MAX = 200;
    GUEST_STATUS_VIEW_NOTE_MAX = 300;
    GUEST_STATUS_VIEW_ICON = /^[a-z0-9][a-z0-9-]{0,39}$/;
  }
});

// node_modules/@openchamber/sdk/dist/host-version.js
var CORE_VERSION, OPENCHAMBER_ENGINE_PATTERN, parseOpenChamberVersion, compareOpenChamberVersions, openChamberEngineMinimum, hostMeetsOpenChamberEngine;
var init_host_version = __esm({
  "node_modules/@openchamber/sdk/dist/host-version.js"() {
    CORE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
    OPENCHAMBER_ENGINE_PATTERN = /^(>=)?\d+\.\d+\.\d+$/;
    parseOpenChamberVersion = (value) => {
      const core = String(value || "").trim().replace(/^v/i, "").split(/[-+]/)[0] ?? "";
      const match = CORE_VERSION.exec(core);
      if (!match) {
        return null;
      }
      return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3])
      };
    };
    compareOpenChamberVersions = (left, right) => {
      const a = parseOpenChamberVersion(left);
      const b = parseOpenChamberVersion(right);
      if (!a || !b) {
        return 0;
      }
      if (a.major !== b.major)
        return a.major - b.major;
      if (a.minor !== b.minor)
        return a.minor - b.minor;
      return a.patch - b.patch;
    };
    openChamberEngineMinimum = (engine) => {
      const trimmed = engine.trim();
      if (!OPENCHAMBER_ENGINE_PATTERN.test(trimmed)) {
        return null;
      }
      const floor = trimmed.startsWith(">=") ? trimmed.slice(2) : trimmed;
      return parseOpenChamberVersion(floor) ? floor : null;
    };
    hostMeetsOpenChamberEngine = (hostVersion, engine) => {
      const minimum = openChamberEngineMinimum(engine);
      if (!minimum) {
        return false;
      }
      if (!parseOpenChamberVersion(hostVersion)) {
        return false;
      }
      return compareOpenChamberVersions(hostVersion, minimum) >= 0;
    };
  }
});

// node_modules/@openchamber/sdk/dist/manifest.js
var GUEST_SURFACE_DOCKS, GUEST_SURFACE_DOCK_DEFAULT, GUEST_SURFACE_DOCK_SIZE_DEFAULT, GUEST_SURFACE_DOCK_SIZE_MIN, GUEST_SURFACE_DOCK_SIZE_MAX, GUEST_STATUS_SECTION_TITLE_MAX, GUEST_STATUS_SECTION_HEIGHT_MIN, GUEST_STATUS_SECTION_HEIGHT_MAX, GUEST_STATUS_SECTION_HEIGHT_DEFAULT, GUEST_ACTIONS_MAX, GUEST_ACTION_LABEL_MAX, GUEST_COMMANDS_MAX, GUEST_COMMAND_DESCRIPTION_MAX, GUEST_COMMAND_NAME, GUEST_PROVIDER_LOGOS_MAX, GUEST_PROVIDER_LOGO_BYTES_MAX, GUEST_TOOLS_MAX, GUEST_TOOL_MATCH_MAX, GUEST_TOOL_MATCH, GUEST_TOOL_NAME_MAX, GUEST_TOOL_TEMPLATE_MAX, GUEST_TOOL_TEMPLATE_VALUE_MAX, GUEST_TOOL_LANGUAGE_MAX, GUEST_TOOL_COLUMNS_MAX, GUEST_TOOL_COLUMN_MAX, GUEST_TOOL_CARD_FIELDS_MAX, GUEST_TOOL_CARD_TONES_MAX, GUEST_TOOL_CARD_TONE_KEY_MAX, GUEST_TOOL_CARD_URL_MAX, GUEST_TOOL_OUTPUTS, GUEST_TONES, GUEST_TOOL_TEMPLATE_ROOTS, guestToolPlaceholderPattern, GUEST_TOOL_CARD_TEMPLATE_ROOTS, guestToolLinkSettingIds, HOST_LINEAR_API_ORIGIN, resolveIntegrationAuth, resolveTokenAuthorization, resolveIntegrationApi, GUEST_SERVICE_PROVIDES, SOURCE_CONTROL_GUEST_ID_MAX, sourceControlProviderIdOf, NOTIFICATIONS_GUEST_ID_MAX, notificationProviderIdOf, toPublicNotifications, QUOTA_GUEST_ID_MAX, quotaProviderIdOf, QUOTA_PROVIDERS_MAX, OPENCODE_PROVIDER_ID, isOpenCodeProviderId, toPublicQuota, TRACKER_GUEST_ID_MAX, trackerProviderIdOf, TRACKER_URL_TEMPLATES_MAX, TRACKER_URL_TEMPLATE_MAX, TRACKER_URL_TOKENS, TRACKER_URL_TEMPLATE_LITERAL, TRACKER_URL_TOKEN_SET, TRACKER_QUERY_TEMPLATE, isTrackerUrlTemplate, TRACKER_BASE_STATE_FILTERS, TRACKER_STATE_FILTERS_MAX, TRACKER_IDENTIFIER_KINDS, toPublicTracker, SOURCE_CONTROL_DEFAULT_INSTANCES_MAX, SOURCE_CONTROL_URL_TEMPLATES_MAX, SOURCE_CONTROL_URL_TEMPLATE_MAX, SOURCE_CONTROL_URL_TOKENS, toPublicSourceControl, serviceProvides, GUEST_CAPABILITIES, DECLARED_GUEST_CAPABILITIES, GUEST_ORIGINS_MAX, GUEST_FILESYSTEM_PATTERNS_MAX, GUEST_FILESYSTEM_PATTERN_MAX, isGuestFilesystemPattern, GUEST_LINK_KEYS_MAX, GUEST_LINK_KEY, GUEST_LINK_ACTIONS, isBuildableLinkTemplate, buildLinkUrl, GUEST_BLOCK_NAME, GUEST_BLOCK_ARG_NAME, GUEST_BLOCKS_MAX, GUEST_BLOCK_ARGS_MAX, GUEST_BLOCK_DESCRIPTION_MAX, GUEST_BLOCK_ARGS_TEXT_MAX, GUEST_BLOCK_HEIGHT_DEFAULT, GUEST_BLOCK_RESERVED_NAMES, GUEST_BLOCK_HEIGHT_MAX, guestActionsNeedConversation, requestedGuestCapabilities, toPublicSessionEvents, hasGuestPage, isGuestApproved, hasGuestCapability, isAttachObject, resolveAttachMode, resolveAttachEntry, resolvePageEntry, resolvePageMobile, resolveStatusSectionEntry, resolveStatusSectionSource, clampStatusSectionHeight, isSafeAssetPath, isGuestPackageSvgIcon, isGuestProviderLogoPath, toPublicIntegration, toPublicService;
var init_manifest = __esm({
  "node_modules/@openchamber/sdk/dist/manifest.js"() {
    init_status_view();
    GUEST_SURFACE_DOCKS = ["top", "bottom", "left", "right"];
    GUEST_SURFACE_DOCK_DEFAULT = "top";
    GUEST_SURFACE_DOCK_SIZE_DEFAULT = 40;
    GUEST_SURFACE_DOCK_SIZE_MIN = 24;
    GUEST_SURFACE_DOCK_SIZE_MAX = 480;
    GUEST_STATUS_SECTION_TITLE_MAX = 60;
    GUEST_STATUS_SECTION_HEIGHT_MIN = 24;
    GUEST_STATUS_SECTION_HEIGHT_MAX = 480;
    GUEST_STATUS_SECTION_HEIGHT_DEFAULT = 120;
    GUEST_ACTIONS_MAX = 8;
    GUEST_ACTION_LABEL_MAX = 40;
    GUEST_COMMANDS_MAX = 8;
    GUEST_COMMAND_DESCRIPTION_MAX = 80;
    GUEST_COMMAND_NAME = /^[a-z][a-z0-9-]{0,23}$/;
    GUEST_PROVIDER_LOGOS_MAX = 256;
    GUEST_PROVIDER_LOGO_BYTES_MAX = 1024 * 1024;
    GUEST_TOOLS_MAX = 16;
    GUEST_TOOL_MATCH_MAX = 128;
    GUEST_TOOL_MATCH = /^[A-Za-z0-9_.:-]+\*?$/;
    GUEST_TOOL_NAME_MAX = 40;
    GUEST_TOOL_TEMPLATE_MAX = 200;
    GUEST_TOOL_TEMPLATE_VALUE_MAX = 200;
    GUEST_TOOL_LANGUAGE_MAX = 32;
    GUEST_TOOL_COLUMNS_MAX = 16;
    GUEST_TOOL_COLUMN_MAX = 64;
    GUEST_TOOL_CARD_FIELDS_MAX = 8;
    GUEST_TOOL_CARD_TONES_MAX = 16;
    GUEST_TOOL_CARD_TONE_KEY_MAX = 64;
    GUEST_TOOL_CARD_URL_MAX = 2048;
    GUEST_TOOL_OUTPUTS = ["auto", "text", "json", "markdown", "code", "table", "card"];
    GUEST_TONES = ["neutral", "info", "success", "warning", "error"];
    GUEST_TOOL_TEMPLATE_ROOTS = ["input", "output", "metadata"];
    guestToolPlaceholderPattern = (roots) => new RegExp(`\\{(${roots.join("|")})((?:\\.[A-Za-z0-9_-]+)*)\\}`, "g");
    GUEST_TOOL_CARD_TEMPLATE_ROOTS = ["input", "output", "metadata", "settings"];
    guestToolLinkSettingIds = (tools) => {
      const ids = /* @__PURE__ */ new Set();
      for (const tool of tools ?? []) {
        for (const match of (tool.card?.link?.url ?? "").matchAll(guestToolPlaceholderPattern(["settings"]))) {
          if (match[2])
            ids.add(match[2].slice(1));
        }
      }
      return [...ids];
    };
    HOST_LINEAR_API_ORIGIN = "https://api.linear.app";
    resolveIntegrationAuth = (integration) => {
      const kinds = [Boolean(integration.oauth), Boolean(integration.token), Boolean(integration.host)].filter(Boolean).length;
      if (kinds !== 1) {
        return null;
      }
      if (integration.host)
        return "host";
      return integration.oauth ? "oauth" : "token";
    };
    resolveTokenAuthorization = (scheme) => {
      if (scheme === "bearer" || scheme === "basic") {
        return scheme;
      }
      return "header";
    };
    resolveIntegrationApi = (integration) => {
      if (integration.oauth) {
        return {
          apiOrigin: integration.oauth.apiOrigin,
          account: integration.oauth.account,
          authorization: "bearer"
        };
      }
      if (integration.token) {
        return {
          apiOrigin: integration.token.apiOrigin,
          account: integration.token.account,
          authorization: resolveTokenAuthorization(integration.token.scheme)
        };
      }
      if (integration.host?.provider === "linear") {
        return {
          apiOrigin: HOST_LINEAR_API_ORIGIN,
          authorization: "bearer"
        };
      }
      return null;
    };
    GUEST_SERVICE_PROVIDES = ["browser", "source-control", "notifications", "tracker", "quota", "opencode"];
    SOURCE_CONTROL_GUEST_ID_MAX = 28;
    sourceControlProviderIdOf = (guestId) => `ext-${guestId}`;
    NOTIFICATIONS_GUEST_ID_MAX = 28;
    notificationProviderIdOf = (guestId) => `ext-${guestId}`;
    toPublicNotifications = (contribution) => {
      const token = {
        scheme: contribution.token.scheme,
        username: contribution.token.username === true,
        scopes: [...contribution.token.scopes ?? []]
      };
      if (contribution.token.createPath)
        token.createPath = contribution.token.createPath;
      return { label: contribution.label, instances: { ...contribution.instances }, token };
    };
    QUOTA_GUEST_ID_MAX = 28;
    quotaProviderIdOf = (guestId) => `ext-${guestId}`;
    QUOTA_PROVIDERS_MAX = 16;
    OPENCODE_PROVIDER_ID = /^[a-z0-9][a-z0-9._-]{0,63}$/;
    isOpenCodeProviderId = (value) => OPENCODE_PROVIDER_ID.test(value);
    toPublicQuota = (contribution) => ({ providers: [...contribution.providers] });
    TRACKER_GUEST_ID_MAX = 28;
    trackerProviderIdOf = (guestId) => `ext-${guestId}`;
    TRACKER_URL_TEMPLATES_MAX = 8;
    TRACKER_URL_TEMPLATE_MAX = 256;
    TRACKER_URL_TOKENS = ["{id}", "{segment}", "{segments+}"];
    TRACKER_URL_TEMPLATE_LITERAL = /^[A-Za-z0-9._~-]+$/;
    TRACKER_URL_TOKEN_SET = new Set(TRACKER_URL_TOKENS);
    TRACKER_QUERY_TEMPLATE = /^([A-Za-z0-9_.-]{1,64})=\{id\}$/;
    isTrackerUrlTemplate = (value) => {
      if (!value.startsWith("/") || value.length > TRACKER_URL_TEMPLATE_MAX)
        return false;
      const queryAt = value.indexOf("?");
      const pathPart = queryAt === -1 ? value : value.slice(0, queryAt);
      const queryPart = queryAt === -1 ? null : value.slice(queryAt + 1);
      const segments = pathPart === "/" ? [] : pathPart.slice(1).split("/");
      if (segments.some((segment) => segment === "." || segment === ".."))
        return false;
      if (segments.some((segment) => !TRACKER_URL_TOKEN_SET.has(segment) && !TRACKER_URL_TEMPLATE_LITERAL.test(segment)))
        return false;
      const count = (token) => segments.filter((segment) => segment === token).length;
      if (count("{segments+}") > 1)
        return false;
      if (queryPart === null)
        return count("{id}") === 1;
      return TRACKER_QUERY_TEMPLATE.test(queryPart) && count("{id}") === 0;
    };
    TRACKER_BASE_STATE_FILTERS = ["open", "all"];
    TRACKER_STATE_FILTERS_MAX = 16;
    TRACKER_IDENTIFIER_KINDS = ["key-number", "number", "short-code"];
    toPublicTracker = (contribution) => {
      const view = {
        label: contribution.label,
        instances: { ...contribution.instances },
        // Browser sign-in first where both exist: it needs no token to be made by hand.
        authMethods: [
          ...contribution.auth.oauth ? ["oauth"] : [],
          ...contribution.auth.token ? ["token"] : []
        ]
      };
      if (contribution.auth.token) {
        view.token = {
          scheme: contribution.auth.token.scheme,
          username: contribution.auth.token.username === true,
          scopes: [...contribution.auth.token.scopes ?? []]
        };
        if (contribution.auth.token.createPath)
          view.token.createPath = contribution.auth.token.createPath;
      }
      if (contribution.auth.oauth)
        view.oauth = { scopes: [...contribution.auth.oauth.scopes ?? []] };
      return view;
    };
    SOURCE_CONTROL_DEFAULT_INSTANCES_MAX = 4;
    SOURCE_CONTROL_URL_TEMPLATES_MAX = 8;
    SOURCE_CONTROL_URL_TEMPLATE_MAX = 256;
    SOURCE_CONTROL_URL_TOKENS = ["{owner}", "{namespace+}", "{repo}", "{number}"];
    toPublicSourceControl = (contribution) => ({
      label: contribution.label,
      defaultInstances: [...contribution.instances.defaultInstances],
      custom: contribution.instances.custom
    });
    serviceProvides = (service, role) => Boolean(service?.provides?.includes(role));
    GUEST_CAPABILITIES = ["prompt", "sessions", "files", "model", "shells", "microphone", "conversation", "service", "network", "filesystem", "origins", "transcript", "sessionControl", "sessionAnswers", "instructions", "skills", "opencodePlugin", "opencode", "links", "wake", "marks"];
    DECLARED_GUEST_CAPABILITIES = ["prompt", "sessions", "files", "model", "shells", "microphone"];
    GUEST_ORIGINS_MAX = 8;
    GUEST_FILESYSTEM_PATTERNS_MAX = 16;
    GUEST_FILESYSTEM_PATTERN_MAX = 256;
    isGuestFilesystemPattern = (value) => {
      if (value.length === 0 || value.length > GUEST_FILESYSTEM_PATTERN_MAX) {
        return false;
      }
      if (value.includes("\0") || value.includes("\\")) {
        return false;
      }
      if (!value.startsWith("/") && !value.startsWith("~/")) {
        return false;
      }
      const segments = value.split("/").slice(1);
      return !segments.some((segment) => segment === "" || segment === "..");
    };
    GUEST_LINK_KEYS_MAX = 8;
    GUEST_LINK_KEY = /^[A-Z][A-Z0-9_]{0,31}$/;
    GUEST_LINK_ACTIONS = ["open", "attach"];
    isBuildableLinkTemplate = (template) => isTrackerUrlTemplate(template) && !template.includes("{segment}") && !template.includes("{segments+}");
    buildLinkUrl = (origin, template, identifier) => `${origin}${template.replace("{id}", encodeURIComponent(identifier))}`;
    GUEST_BLOCK_NAME = /^[A-Z][A-Za-z0-9]{1,31}$/;
    GUEST_BLOCK_ARG_NAME = /^[a-z][A-Za-z0-9]{0,31}$/;
    GUEST_BLOCKS_MAX = 4;
    GUEST_BLOCK_ARGS_MAX = 8;
    GUEST_BLOCK_DESCRIPTION_MAX = 120;
    GUEST_BLOCK_ARGS_TEXT_MAX = 16e3;
    GUEST_BLOCK_HEIGHT_DEFAULT = 120;
    GUEST_BLOCK_RESERVED_NAMES = [
      "Stack",
      "Row",
      "Card",
      "Tabs",
      "Tab",
      "Text",
      "Badge",
      "Callout",
      "KeyValue",
      "Table",
      "Steps",
      "BarChart",
      "LineChart",
      "Series",
      "Stat",
      "Progress",
      "Choice",
      "Input",
      "DateInput",
      "Slider",
      "Details",
      "Button"
    ];
    GUEST_BLOCK_HEIGHT_MAX = 960;
    guestActionsNeedConversation = (actions) => Boolean(actions?.some((action) => action.payload?.includes("messages")));
    requestedGuestCapabilities = (contributes) => {
      const declared = new Set(contributes.capabilities ?? []);
      if (guestActionsNeedConversation(contributes.actions))
        declared.add("conversation");
      if (contributes.service)
        declared.add("service");
      if (serviceProvides(contributes.service, "opencode"))
        declared.add("opencode");
      if (contributes.integration)
        declared.add("network");
      if (contributes.filesystem && contributes.filesystem.length > 0)
        declared.add("filesystem");
      if (contributes.origins && contributes.origins.length > 0)
        declared.add("origins");
      if (contributes.sessionEvents?.content || contributes.sessionControl?.content)
        declared.add("transcript");
      if (contributes.sessionControl)
        declared.add("sessionControl");
      if (contributes.sessionControl?.answers)
        declared.add("sessionAnswers");
      if (contributes.instructions)
        declared.add("instructions");
      if (contributes.skills)
        declared.add("skills");
      if (contributes.opencodePlugin)
        declared.add("opencodePlugin");
      if (contributes.links)
        declared.add("links");
      if (contributes.waits && contributes.waits.length > 0)
        declared.add("wake");
      if (contributes.marks)
        declared.add("marks");
      return GUEST_CAPABILITIES.filter((capability) => declared.has(capability));
    };
    toPublicSessionEvents = (contribution) => ({
      events: [...contribution.events],
      content: contribution.content === true
    });
    hasGuestPage = (contributes) => Boolean(contributes.panel.entry);
    isGuestApproved = (capabilities) => capabilities.requested.every((capability) => capabilities.granted.includes(capability));
    hasGuestCapability = (capabilities, capability) => capabilities.granted.includes(capability);
    isAttachObject = (attach) => attach !== void 0 && attach !== true && attach !== false && attach !== "panel" && attach !== "dialog";
    resolveAttachMode = (attach) => {
      if (attach === true || attach === "panel")
        return "panel";
      if (attach === "dialog")
        return "dialog";
      if (isAttachObject(attach))
        return attach.mode;
      return null;
    };
    resolveAttachEntry = (contributes) => {
      const attach = contributes.attach;
      if (!isAttachObject(attach) || attach.mode !== "dialog")
        return null;
      return attach.entry ?? null;
    };
    resolvePageEntry = (contributes) => {
      if (!contributes.page)
        return null;
      return contributes.page === true ? contributes.panel.entry ?? null : contributes.page.entry;
    };
    resolvePageMobile = (contributes) => {
      if (!contributes.page)
        return false;
      return (contributes.page === true ? contributes.panel.mobile : contributes.page.mobile) === true;
    };
    resolveStatusSectionEntry = (contributes) => {
      const section = contributes.statusSection;
      if (!section)
        return null;
      return section === true ? contributes.panel.entry ?? null : section.entry ?? null;
    };
    resolveStatusSectionSource = (contributes) => {
      const section = contributes.statusSection;
      if (!section || section === true || !section.source)
        return null;
      return { path: section.source.path, interval: section.source.interval ?? GUEST_STATUS_SOURCE_INTERVAL_DEFAULT };
    };
    clampStatusSectionHeight = (height) => {
      if (!Number.isFinite(height))
        return GUEST_STATUS_SECTION_HEIGHT_DEFAULT;
      return Math.min(GUEST_STATUS_SECTION_HEIGHT_MAX, Math.max(GUEST_STATUS_SECTION_HEIGHT_MIN, Math.round(height)));
    };
    isSafeAssetPath = (value) => {
      if (value.includes("\0") || value.includes("\\") || value.startsWith("/") || value.includes("://")) {
        return false;
      }
      const segments = value.split("/");
      if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
        return false;
      }
      return /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(value);
    };
    isGuestPackageSvgIcon = (value) => isSafeAssetPath(value) && value.toLowerCase().endsWith(".svg");
    isGuestProviderLogoPath = (value) => isSafeAssetPath(value) && /\.(?:svg|png)$/i.test(value);
    toPublicIntegration = (integration) => {
      const auth = resolveIntegrationAuth(integration) ?? "oauth";
      const next = {
        name: integration.name,
        description: integration.description,
        auth
      };
      const api = resolveIntegrationApi(integration);
      if (api?.apiOrigin) {
        next.apiOrigin = api.apiOrigin;
      }
      if (auth === "token" && integration.token) {
        next.token = { scheme: integration.token.scheme ?? "raw" };
        if (integration.token.usernameLabel) {
          next.token.usernameLabel = integration.token.usernameLabel;
        }
      }
      if (integration.settings && integration.settings.length > 0) {
        next.settings = integration.settings.map((field) => ({
          id: field.id,
          label: field.label,
          ...field.secret ? { secret: true } : {}
        }));
      }
      return next;
    };
    toPublicService = (service, granted, socketBindings) => {
      if (!service) {
        return void 0;
      }
      const next = {
        runtime: service.runtime,
        granted
      };
      if (service.permissions) {
        const permissions = {};
        if (service.permissions.sockets && service.permissions.sockets.length > 0) {
          permissions.sockets = service.permissions.sockets.map((binding) => binding.id);
        }
        if (service.permissions.exec && service.permissions.exec.length > 0) {
          permissions.exec = [...service.permissions.exec];
        }
        if (permissions.sockets || permissions.exec) {
          next.permissions = permissions;
        }
      }
      if (socketBindings && socketBindings.length > 0) {
        next.socketBindings = socketBindings.map((binding) => ({
          id: binding.id,
          candidates: [...binding.candidates],
          resolved: binding.resolved,
          override: binding.override
        }));
      }
      if (service.provides && service.provides.length > 0) {
        next.provides = [...service.provides];
      }
      if (service.surface) {
        next.surface = true;
      }
      if (service.keepRunning) {
        next.keepRunning = true;
      }
      if (service.schedule) {
        next.schedule = service.schedule.map((entry) => ({ ...entry }));
      }
      return next;
    };
  }
});

// node_modules/@openchamber/sdk/dist/session-events.js
var GUEST_SESSION_EVENT_TYPES, SESSION_EVENTS_PATH, SESSION_EVENTS_WIRE_VERSION, SESSION_EVENT_TIMEOUT_MS, SESSION_EVENTS_IDLE_MS, SESSION_EVENT_REPLY_MAX, SESSION_EVENT_PENDING_MAX, SESSION_EVENT_ERROR_MAX, EVENT_TYPES, isGuestSessionEventType, readSessionEventRequest;
var init_session_events = __esm({
  "node_modules/@openchamber/sdk/dist/session-events.js"() {
    GUEST_SESSION_EVENT_TYPES = [
      "turn-finished",
      "turn-failed",
      "permission-asked",
      "question-asked",
      "turn-started",
      "session-created",
      "session-archived",
      "session-deleted"
    ];
    SESSION_EVENTS_PATH = "/session-events";
    SESSION_EVENTS_WIRE_VERSION = 1;
    SESSION_EVENT_TIMEOUT_MS = 1e4;
    SESSION_EVENTS_IDLE_MS = 10 * 6e4;
    SESSION_EVENT_REPLY_MAX = 64e3;
    SESSION_EVENT_PENDING_MAX = 200;
    SESSION_EVENT_ERROR_MAX = 2e3;
    EVENT_TYPES = new Set(GUEST_SESSION_EVENT_TYPES);
    isGuestSessionEventType = (value) => EVENT_TYPES.has(value);
    readSessionEventRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { v, requestId, event, content } = wire;
      if (v !== SESSION_EVENTS_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (Object(event) !== event || event === void 0)
        return null;
      const { id, type, at, session, project, linked, permission, question } = event;
      if (String(id) !== id || id.length === 0)
        return null;
      if (String(type) !== type || !isGuestSessionEventType(type))
        return null;
      if (!Number.isFinite(at))
        return null;
      if (Object(session) !== session || session === void 0)
        return null;
      const sessionId = session.id;
      if (String(sessionId) !== sessionId || sessionId.length === 0)
        return null;
      const parentId = session.parentId;
      if (parentId !== null && (String(parentId) !== parentId || parentId.length === 0))
        return null;
      if (Object(project) !== project || project === void 0)
        return null;
      const directory = project.directory;
      if (directory !== null && (String(directory) !== directory || directory.length === 0))
        return null;
      if (!Array.isArray(linked))
        return null;
      const request2 = {
        v: SESSION_EVENTS_WIRE_VERSION,
        requestId,
        event: { id, type, at: Number(at), session: { id: sessionId, parentId }, project: { directory }, linked }
      };
      if (permission !== void 0) {
        if (Object(permission) !== permission)
          return null;
        const permissionRequestId = permission.requestId;
        if (String(permissionRequestId) !== permissionRequestId || permissionRequestId.length === 0)
          return null;
        request2.event.permission = { requestId: permissionRequestId };
      }
      if (question !== void 0) {
        if (Object(question) !== question)
          return null;
        const { kind, id: questionId } = question;
        if (kind !== "form" && kind !== "page")
          return null;
        if (String(questionId) !== questionId || questionId.length === 0)
          return null;
        request2.event.question = { kind, id: questionId };
      }
      if (content !== void 0) {
        if (Object(content) !== content || content.type !== type)
          return null;
        request2.content = content;
      }
      return request2;
    };
  }
});

// node_modules/@openchamber/sdk/dist/service-host.js
var SERVICE_HOST_PATH, OPENCHAMBER_HOST_CALLBACK_URL_ENV, SERVICE_PROMPT_MAX, SERVICE_INSTRUCTIONS_MAX, SERVICE_EVENT_TOPIC_MAX, SERVICE_EVENT_DATA_MAX, SERVICE_EVENT_RATE_MAX, SERVICE_STATUS_MESSAGE_MAX, SERVICE_MARK_TEXT_MAX, SERVICE_MARK_URL_MAX, SERVICE_MARKS_MAX, SERVICE_MARK_RATE_MAX, SERVICE_HOST_TIMEOUT_MS, SERVICE_SCHEDULE_PATH, SERVICE_SCHEDULE_WIRE_VERSION, SERVICE_SCHEDULE_TIMEOUT_MS, SERVICE_SCHEDULE_IDLE_MS, SERVICE_SCHEDULE_MAX, SERVICE_SCHEDULE_CRON_MAX, SERVICE_SCHEDULE_TIMEZONE_MAX, isServiceScheduleCron, readServiceScheduleRequest, MENTIONS_SEARCH_PATH, MENTIONS_RESOLVE_PATH, MENTIONS_SEARCH_TIMEOUT_MS, MENTIONS_RESOLVE_TIMEOUT_MS, MENTIONS_IDLE_MS, MENTIONS_ITEMS_MAX, MENTION_TITLE_MAX, MENTION_ID_MAX, MENTION_TEXT_MAX, SERVICE_ANSWER_MESSAGE_MAX, SERVICE_HOST_METHODS, ServiceHostError, createServiceHost;
var init_service_host = __esm({
  "node_modules/@openchamber/sdk/dist/service-host.js"() {
    SERVICE_HOST_PATH = "/service/call";
    OPENCHAMBER_HOST_CALLBACK_URL_ENV = "OPENCHAMBER_HOST_CALLBACK_URL";
    SERVICE_PROMPT_MAX = 64e3;
    SERVICE_INSTRUCTIONS_MAX = 4096;
    SERVICE_EVENT_TOPIC_MAX = 64;
    SERVICE_EVENT_DATA_MAX = 64e3;
    SERVICE_EVENT_RATE_MAX = 30;
    SERVICE_STATUS_MESSAGE_MAX = 200;
    SERVICE_MARK_TEXT_MAX = 200;
    SERVICE_MARK_URL_MAX = 2048;
    SERVICE_MARKS_MAX = 200;
    SERVICE_MARK_RATE_MAX = 60;
    SERVICE_HOST_TIMEOUT_MS = 3e4;
    SERVICE_SCHEDULE_PATH = "/schedule";
    SERVICE_SCHEDULE_WIRE_VERSION = 1;
    SERVICE_SCHEDULE_TIMEOUT_MS = 1e4;
    SERVICE_SCHEDULE_IDLE_MS = 10 * 6e4;
    SERVICE_SCHEDULE_MAX = 8;
    SERVICE_SCHEDULE_CRON_MAX = 64;
    SERVICE_SCHEDULE_TIMEZONE_MAX = 64;
    isServiceScheduleCron = (value) => value.length <= SERVICE_SCHEDULE_CRON_MAX && /^[A-Za-z0-9*/,\-?]+(?: +[A-Za-z0-9*/,\-?]+){4}$/.test(value);
    readServiceScheduleRequest = (body) => {
      let wire;
      try {
        wire = JSON.parse(body);
      } catch {
        return null;
      }
      if (Object(wire) !== wire || wire === null)
        return null;
      const { v, requestId, id, at } = wire;
      if (v !== SERVICE_SCHEDULE_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(id) !== id || id.length === 0)
        return null;
      if (!Number.isFinite(at))
        return null;
      return { v: SERVICE_SCHEDULE_WIRE_VERSION, requestId, id, at: Number(at) };
    };
    MENTIONS_SEARCH_PATH = "/mentions/search";
    MENTIONS_RESOLVE_PATH = "/mentions/resolve";
    MENTIONS_SEARCH_TIMEOUT_MS = 2e3;
    MENTIONS_RESOLVE_TIMEOUT_MS = 1e4;
    MENTIONS_IDLE_MS = 10 * 6e4;
    MENTIONS_ITEMS_MAX = 20;
    MENTION_TITLE_MAX = 120;
    MENTION_ID_MAX = 256;
    MENTION_TEXT_MAX = 16e3;
    SERVICE_ANSWER_MESSAGE_MAX = 2e3;
    SERVICE_HOST_METHODS = [
      "sessions.start",
      "sessions.send",
      "sessions.retry",
      "sessions.status",
      "sessions.lastReply",
      "sessions.stop",
      "sessions.answerPermission",
      "sessions.answerForm",
      "instructions.set",
      "panels.emit",
      "settings.read",
      "status.set",
      "marks.set"
    ];
    ServiceHostError = class extends Error {
      code;
      status;
      constructor(message, code, status) {
        super(message);
        this.name = "ServiceHostError";
        this.code = code;
        this.status = status;
      }
    };
    createServiceHost = ({ env }) => {
      const call = async (method, input) => {
        const base = env[OPENCHAMBER_HOST_CALLBACK_URL_ENV];
        const token = env.OPENCHAMBER_SERVICE_TOKEN;
        if (!base || !token)
          throw new ServiceHostError("This service was not started by OpenChamber.", "HOST_UNAVAILABLE", 0);
        let response;
        try {
          response = await fetch(`${base.replace(/\/+$/, "")}${SERVICE_HOST_PATH}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ method, input }),
            signal: AbortSignal.timeout(SERVICE_HOST_TIMEOUT_MS)
          });
        } catch {
          throw new ServiceHostError("OpenChamber did not answer.", "HOST_UNAVAILABLE", 0);
        }
        const body = await response.json().catch(() => null);
        if (response.ok && body?.result !== void 0)
          return body.result;
        throw new ServiceHostError(body?.error?.message ?? `OpenChamber answered HTTP ${response.status}.`, body?.error?.code ?? "HOST_UNAVAILABLE", response.status);
      };
      return {
        sessions: {
          start: (input) => call("sessions.start", input),
          send: (sessionId, prompt) => call("sessions.send", { sessionId, prompt }),
          retry: (sessionId) => call("sessions.retry", { sessionId }),
          status: (sessionId) => call("sessions.status", { sessionId }),
          lastReply: (sessionId) => call("sessions.lastReply", { sessionId }),
          stop: (sessionId) => call("sessions.stop", { sessionId }),
          answerPermission: (sessionId, requestId, answer) => call("sessions.answerPermission", { sessionId, requestId, ...answer }),
          answerForm: (sessionId, formId, values, message) => call("sessions.answerForm", { sessionId, formId, values, ...message === void 0 ? {} : { message } })
        },
        setInstructions: (directory, text) => call("instructions.set", { directory, text }),
        emit: (topic, data) => call("panels.emit", { topic, data }),
        readSettings: () => call("settings.read", {}).then(({ settings }) => settings),
        needsConfiguration: (message) => call("status.set", { needsConfiguration: message }),
        setMark: (target, mark) => call("marks.set", { target, mark })
      };
    };
  }
});

// node_modules/@openchamber/sdk/dist/waits.js
var WAITS_START_PATH, WAITS_CHECK_PATH, WAITS_WIRE_VERSION, GUEST_WAITS_MAX, GUEST_WAIT_ID, GUEST_WAIT_TITLE_MAX, GUEST_WAIT_DESCRIPTION_MAX, GUEST_WAIT_PARAMS_MAX, GUEST_WAIT_PARAM_NAME, GUEST_WAIT_PARAM_DESCRIPTION_MAX, GUEST_WAIT_PARAM_TYPES, GUEST_WAIT_ARG_STRING_MAX, WAIT_CHECK_INTERVAL_MIN, WAIT_CHECK_INTERVAL_MAX, WAIT_CHECK_INTERVAL_DEFAULT, WAIT_REQUEST_TIMEOUT_MS, WAITS_CHECK_BATCH_MAX, WAIT_STATE_MAX, WAIT_SUMMARY_MAX, WAIT_LABEL_MAX, WAIT_ERROR_MAX, resolveWaitInterval, toPublicWaits, parseBody, argsOf, readWaitStartRequest, readWaitCheckRequest;
var init_waits = __esm({
  "node_modules/@openchamber/sdk/dist/waits.js"() {
    WAITS_START_PATH = "/waits/start";
    WAITS_CHECK_PATH = "/waits/check";
    WAITS_WIRE_VERSION = 1;
    GUEST_WAITS_MAX = 8;
    GUEST_WAIT_ID = /^[a-z][a-z0-9-]{0,31}$/;
    GUEST_WAIT_TITLE_MAX = 40;
    GUEST_WAIT_DESCRIPTION_MAX = 200;
    GUEST_WAIT_PARAMS_MAX = 8;
    GUEST_WAIT_PARAM_NAME = /^[a-zA-Z][a-zA-Z0-9_]{0,31}$/;
    GUEST_WAIT_PARAM_DESCRIPTION_MAX = 200;
    GUEST_WAIT_PARAM_TYPES = ["string", "number", "boolean"];
    GUEST_WAIT_ARG_STRING_MAX = 2e3;
    WAIT_CHECK_INTERVAL_MIN = 1e4;
    WAIT_CHECK_INTERVAL_MAX = 36e5;
    WAIT_CHECK_INTERVAL_DEFAULT = 3e4;
    WAIT_REQUEST_TIMEOUT_MS = 1e4;
    WAITS_CHECK_BATCH_MAX = 50;
    WAIT_STATE_MAX = 4096;
    WAIT_SUMMARY_MAX = 2e3;
    WAIT_LABEL_MAX = 80;
    WAIT_ERROR_MAX = 2e3;
    resolveWaitInterval = (wait) => wait.interval ?? WAIT_CHECK_INTERVAL_DEFAULT;
    toPublicWaits = (waits) => waits.map((wait) => ({
      id: wait.id,
      title: wait.title,
      description: wait.description,
      params: { ...wait.params ?? {} },
      interval: resolveWaitInterval(wait)
    }));
    parseBody = (body) => {
      try {
        const parsed = JSON.parse(body);
        return Object(parsed) === parsed && parsed !== null && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    };
    argsOf = (wire) => {
      if (Object(wire) !== wire || wire === void 0 || Array.isArray(wire))
        return null;
      const args = {};
      for (const [name, entry] of Object.entries(wire)) {
        if (String(entry) !== entry && !Number.isFinite(entry) && entry !== true && entry !== false)
          return null;
        args[name] = entry;
      }
      return args;
    };
    readWaitStartRequest = (body) => {
      const wire = parseBody(body);
      if (!wire || wire.v !== WAITS_WIRE_VERSION)
        return null;
      const { requestId, wait } = wire;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (Object(wait) !== wait || wait === void 0)
        return null;
      const { id, type, session } = wait;
      if (String(id) !== id || id.length === 0 || String(type) !== type || type.length === 0)
        return null;
      const args = argsOf(wait.args);
      if (!args)
        return null;
      if (Object(session) !== session || session === void 0)
        return null;
      const sessionId = session.id;
      if (String(sessionId) !== sessionId || sessionId.length === 0)
        return null;
      const directory = session.directory;
      if (directory !== null && (String(directory) !== directory || directory.length === 0))
        return null;
      return { v: WAITS_WIRE_VERSION, requestId, wait: { id, type, args, session: { id: sessionId, directory } } };
    };
    readWaitCheckRequest = (body) => {
      const wire = parseBody(body);
      if (!wire || wire.v !== WAITS_WIRE_VERSION)
        return null;
      const { requestId } = wire;
      if (String(requestId) !== requestId || requestId.length === 0 || !Array.isArray(wire.waits))
        return null;
      const waits = [];
      for (const entry of wire.waits) {
        if (Object(entry) !== entry || entry.state === void 0)
          return null;
        const { id, type, state } = entry;
        if (String(id) !== id || id.length === 0 || String(type) !== type || type.length === 0)
          return null;
        const args = argsOf(entry.args);
        if (!args)
          return null;
        waits.push({ id, type, args, state });
      }
      return { v: WAITS_WIRE_VERSION, requestId, waits };
    };
  }
});

// node_modules/@openchamber/sdk/dist/file-editor.js
var GUEST_FILE_EDITORS_MAX, GUEST_FILE_EDITOR_TITLE_MAX, GUEST_FILE_EDITOR_PATTERNS_MAX, GUEST_FILE_EDITOR_PATTERN_MAX, GUEST_FILE_EDITOR_CONTENT_MAX, GUEST_FILE_EDITOR_VERSION_MAX, isFileEditorPattern, patternExpressions, patternExpression, matchesFileEditorPattern, fileEditorPayloadSize, sameFileEditorDocument, createFileSaveTracker;
var init_file_editor = __esm({
  "node_modules/@openchamber/sdk/dist/file-editor.js"() {
    GUEST_FILE_EDITORS_MAX = 8;
    GUEST_FILE_EDITOR_TITLE_MAX = 60;
    GUEST_FILE_EDITOR_PATTERNS_MAX = 16;
    GUEST_FILE_EDITOR_PATTERN_MAX = 128;
    GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
    GUEST_FILE_EDITOR_VERSION_MAX = 256;
    isFileEditorPattern = (value) => value.length > 0 && value.length <= GUEST_FILE_EDITOR_PATTERN_MAX && !/[/\\\0]/.test(value) && /[^*?]/.test(value);
    patternExpressions = /* @__PURE__ */ new Map();
    patternExpression = (pattern) => {
      const cached = patternExpressions.get(pattern);
      if (cached)
        return cached;
      const source = pattern.split("").map((character) => {
        if (character === "*")
          return ".*";
        if (character === "?")
          return ".";
        return character.replace(/[\\^$.|+()[\]{}]/g, "\\$&");
      }).join("");
      const expression = new RegExp(`^${source}$`, "is");
      patternExpressions.set(pattern, expression);
      return expression;
    };
    matchesFileEditorPattern = (fileName, pattern) => isFileEditorPattern(pattern) && patternExpression(pattern).test(fileName);
    fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
    sameFileEditorDocument = (left, right) => {
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
    createFileSaveTracker = (initialVersion) => {
      let saved = initialVersion;
      let live = initialVersion;
      return {
        /** A new live version; `edited` is true when it differs from the previous one. */
        observe: (version) => {
          const edited = version !== live;
          live = version;
          return { edited, dirty: version !== saved };
        },
        /** Records a written version; returns whether the live state is still dirty. */
        markSaved: (version) => {
          saved = version;
          return live !== version;
        }
      };
    };
  }
});

// node_modules/@openchamber/sdk/dist/popover.js
var GUEST_POPOVER_ID, GUEST_POPOVER_COORDINATE_MAX, GUEST_POPOVER_WIDTH_MIN, GUEST_POPOVER_WIDTH_MAX, GUEST_POPOVER_HEIGHT_MIN, GUEST_POPOVER_HEIGHT_MAX, GUEST_POPOVER_DATA_MAX, GUEST_POPOVER_DATA_DEPTH_MAX, GUEST_POPOVER_SIDES, GUEST_POPOVER_CLOSE_REASONS, hasBoundedJsonTree, isFiniteJson, isGuestPopoverRequest;
var init_popover = __esm({
  "node_modules/@openchamber/sdk/dist/popover.js"() {
    GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
    GUEST_POPOVER_COORDINATE_MAX = 1e5;
    GUEST_POPOVER_WIDTH_MIN = 160;
    GUEST_POPOVER_WIDTH_MAX = 640;
    GUEST_POPOVER_HEIGHT_MIN = 48;
    GUEST_POPOVER_HEIGHT_MAX = 480;
    GUEST_POPOVER_DATA_MAX = 16e3;
    GUEST_POPOVER_DATA_DEPTH_MAX = 32;
    GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
    GUEST_POPOVER_CLOSE_REASONS = ["escape", "outside", "anchor", "owner", "closed", "replaced"];
    hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
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
    isFiniteJson = (value) => {
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
    isGuestPopoverRequest = (request2) => {
      try {
        if (String(request2.id) !== request2.id || !GUEST_POPOVER_ID.test(request2.id) || !Number.isFinite(request2.anchor.x) || Math.abs(request2.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request2.anchor.y) || Math.abs(request2.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request2.anchor.width) || !Number.isFinite(request2.anchor.height) || request2.anchor.width <= 0 || request2.anchor.height <= 0 || request2.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request2.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request2.width) || request2.width < GUEST_POPOVER_WIDTH_MIN || request2.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request2.height) || request2.height < GUEST_POPOVER_HEIGHT_MIN || request2.height > GUEST_POPOVER_HEIGHT_MAX || request2.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request2.side) || request2.focus !== void 0 && request2.focus !== true && request2.focus !== false || !hasBoundedJsonTree(request2.data) || !isFiniteJson(request2.data))
          return false;
        return JSON.stringify(request2.data).length <= GUEST_POPOVER_DATA_MAX;
      } catch {
        return false;
      }
    };
  }
});

// node_modules/@openchamber/sdk/dist/contract.js
var START_SESSION_SENT, GUEST_BLOCK_ANSWER_MAX, SESSION_LIFECYCLE_PHASES, GUEST_FILE_ENTRY_KINDS, GUEST_FILE_STAT_KINDS, isStartSessionResult, isPromptResult, EMPTY_GUEST_CONNECTION, isGuestMessageItem, isGuestSessionItem, isGuestLinkItem, isGuestAttachItem, GUEST_COMMIT_SHA, isGuestCommitSha, GUEST_TOAST_MAX, GUEST_CLIPBOARD_TEXT_MAX, GUEST_COMPOSE_TEXT_MAX, GUEST_ATTACH_ID_MAX, GUEST_ATTACH_TITLE_MAX, GUEST_ATTACH_URL_MAX, GUEST_ATTACH_TEXT_MAX, GUEST_ATTACH_AUTHOR_MAX, GUEST_ATTACH_BRANCH_MAX, GUEST_ATTACH_DATA_MAX, GUEST_ACCOUNT_MAX, GUEST_SESSION_MODEL_MAX, GUEST_SESSION_AGENT_MAX, GUEST_SETTING_VALUE_MAX, GUEST_REQUEST_PATH_MAX, GUEST_REQUEST_BODY_MAX, GUEST_REQUEST_RESPONSE_MAX, GUEST_REQUEST_TIMEOUT_MS, GUEST_FILE_PATH_MAX, GUEST_FILE_CONTENT_MAX, GUEST_FILE_LIST_MAX, GUEST_GENERATE_PROMPT_MAX, GUEST_GENERATE_SYSTEM_MAX, GUEST_GENERATE_OUTPUT_TOKENS_MAX, GUEST_GENERATE_TEXT_MAX, GUEST_GENERATE_TIMEOUT_MS, GUEST_GENERATE_LATE_KEEP_MS, GUEST_GENERATE_LATE_MAX, GUEST_ITEM_MESSAGE_TEXT_MAX, GUEST_ITEM_SESSION_MAX, GUEST_BADGE_MAX, GUEST_FRAME_HEIGHT_MAX, GUEST_RESOLVE_ERROR_MAX, HOST_REQUEST_ERROR_CODES, SERVICE_STATUS_VALUES, hostRequestErrorCodeSet, isHostRequestErrorCode, resolveHostRequestErrorCode, isJsonValue, isAttachData, clampBranch, clampAttachRequest, clampStartSessionRequest, clampPromptRequest, clampBadgeCount, clampFrameHeight, guestFileScope, isGuestFilePath, isGuestRequestPath, serviceStatusSet, isServiceStatusResult, isGuestRequestResult, isFileReadResult, isFileWriteResult, isFileListResult, fileStatKindSet, isFileStatResult, isGenerateResult, HOST_PUSH_TYPES, asWireRecord, isNonEmptyString, readResultMessage, readHostMessage;
var init_contract = __esm({
  "node_modules/@openchamber/sdk/dist/contract.js"() {
    init_api_version();
    START_SESSION_SENT = ["sent", "no-model", "skipped", "failed"];
    GUEST_BLOCK_ANSWER_MAX = 2e3;
    SESSION_LIFECYCLE_PHASES = ["started", "completed", "failure"];
    GUEST_FILE_ENTRY_KINDS = ["file", "directory", "other"];
    GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
    isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
    isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
    EMPTY_GUEST_CONNECTION = {
      connected: false,
      account: ""
    };
    isGuestMessageItem = (item) => item !== null && item.kind === "message";
    isGuestSessionItem = (item) => item !== null && item.kind === "session";
    isGuestLinkItem = (item) => item !== null && item.kind === "link";
    isGuestAttachItem = (item) => item !== null && (item.kind === void 0 || item.kind === "issue" || item.kind === "pull");
    GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
    isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
    GUEST_TOAST_MAX = 500;
    GUEST_CLIPBOARD_TEXT_MAX = 32e3;
    GUEST_COMPOSE_TEXT_MAX = 16e3;
    GUEST_ATTACH_ID_MAX = 128;
    GUEST_ATTACH_TITLE_MAX = 200;
    GUEST_ATTACH_URL_MAX = 2e3;
    GUEST_ATTACH_TEXT_MAX = 16e3;
    GUEST_ATTACH_AUTHOR_MAX = 80;
    GUEST_ATTACH_BRANCH_MAX = 200;
    GUEST_ATTACH_DATA_MAX = 16e3;
    GUEST_ACCOUNT_MAX = 200;
    GUEST_SESSION_MODEL_MAX = 200;
    GUEST_SESSION_AGENT_MAX = 80;
    GUEST_SETTING_VALUE_MAX = 2e3;
    GUEST_REQUEST_PATH_MAX = 2e3;
    GUEST_REQUEST_BODY_MAX = 64e3;
    GUEST_REQUEST_RESPONSE_MAX = 8e6;
    GUEST_REQUEST_TIMEOUT_MS = 2e4;
    GUEST_FILE_PATH_MAX = 1024;
    GUEST_FILE_CONTENT_MAX = 2e6;
    GUEST_FILE_LIST_MAX = 2e3;
    GUEST_GENERATE_PROMPT_MAX = 64e3;
    GUEST_GENERATE_SYSTEM_MAX = 8e3;
    GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
    GUEST_GENERATE_TEXT_MAX = 256e3;
    GUEST_GENERATE_TIMEOUT_MS = 96e4;
    GUEST_GENERATE_LATE_KEEP_MS = 60 * 6e4;
    GUEST_GENERATE_LATE_MAX = 8;
    GUEST_ITEM_MESSAGE_TEXT_MAX = 2e5;
    GUEST_ITEM_SESSION_MAX = 2e6;
    GUEST_BADGE_MAX = 999;
    GUEST_FRAME_HEIGHT_MAX = 1e4;
    GUEST_RESOLVE_ERROR_MAX = 500;
    HOST_REQUEST_ERROR_CODES = [
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
    SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
    hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
    isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
    resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
    isJsonValue = (value) => {
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
    isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
    clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
    clampAttachRequest = (request2) => {
      const id = request2.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
      const title = request2.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
      const url = request2.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
      const text = request2.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
      const author = request2.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
      const kind = request2.kind === "pull" ? "pull" : "issue";
      const next = {
        providerId: request2.providerId.trim(),
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
        const head = clampBranch(request2.branches?.head);
        const base = clampBranch(request2.branches?.base);
        if (head && base) {
          next.branches = { head, base };
        }
      }
      if (isAttachData(request2.data)) {
        next.data = request2.data;
      }
      return next;
    };
    clampStartSessionRequest = (request2) => {
      const next = clampAttachRequest(request2);
      if (request2.projectId)
        next.projectId = request2.projectId;
      if (request2.navigation)
        next.navigation = request2.navigation;
      if (request2.worktree) {
        next.worktree = request2.worktree;
      }
      return next;
    };
    clampPromptRequest = (request2) => {
      const next = {
        text: request2.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
      };
      if (request2.send) {
        next.send = true;
      }
      return next;
    };
    clampBadgeCount = (count) => {
      if (count === null || !Number.isFinite(count))
        return null;
      return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
    };
    clampFrameHeight = (height) => {
      if (!Number.isFinite(height))
        return 0;
      return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
    };
    guestFileScope = (path) => path.startsWith("/") || path === "~" || path.startsWith("~/") ? "filesystem" : "project";
    isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
    isGuestRequestPath = (value) => {
      if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
        return false;
      }
      if (value.length > GUEST_REQUEST_PATH_MAX) {
        return false;
      }
      const segments = value.split("/");
      return !segments.some((segment) => segment === "." || segment === "..");
    };
    serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
    isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
    isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
    isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
    isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
    isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
    fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
    isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
    isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
    HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
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
    asWireRecord = (data) => Object(data) === data ? data : null;
    isNonEmptyString = (value) => String(value) === value && value.length > 0;
    readResultMessage = (wire) => {
      if (!isNonEmptyString(wire.id))
        return null;
      if (wire.ok === true) {
        const message = {
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "result",
          id: wire.id,
          ok: true
        };
        if (Object(wire.payload) === wire.payload) {
          message.payload = wire.payload;
        }
        return message;
      }
      if (wire.ok === false && isNonEmptyString(wire.error)) {
        return {
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "result",
          id: wire.id,
          ok: false,
          error: wire.error,
          code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : void 0)
        };
      }
      return null;
    };
    readHostMessage = (data) => {
      const wire = asWireRecord(data);
      if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
        return null;
      if (wire.type === "result")
        return readResultMessage(wire);
      if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
        return null;
      return wire;
    };
  }
});

// node_modules/@openchamber/sdk/dist/host.js
var isKeyEvent, isSaveShortcut, HostRequestError, rejectBadPath, rejectBadFilePath, deviceStorageScope, nextId, connectHost;
var init_host = __esm({
  "node_modules/@openchamber/sdk/dist/host.js"() {
    init_api_version();
    init_workspace();
    init_status_controls();
    init_popover();
    init_file_editor();
    init_contract();
    init_microphone();
    init_shells();
    isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
    isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
    HostRequestError = class extends Error {
      code;
      constructor(code, message) {
        super(message);
        this.name = "HostRequestError";
        this.code = code;
      }
    };
    rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
    rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
    deviceStorageScope = (options) => {
      if (options === void 0)
        return void 0;
      if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
        throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
      }
      return options.scope === "device" ? "device" : void 0;
    };
    nextId = (n) => {
      n.value += 1;
      return `oc-${n.value}`;
    };
    connectHost = (options = {}) => {
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
          const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
          const handler = fileSnapshotHandler;
          if (!handler) {
            fail("This extension does not edit files.");
            return;
          }
          Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
            if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
              fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
              return;
            }
            if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
              fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
              return;
            }
            answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
          }, (error) => fail(error instanceof Error ? error.message : String(error)));
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
      const request2 = (message) => send(message).then(() => void 0);
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
          await request2({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
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
          await request2({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
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
      const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request2({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
      const setPopoverAnchorActive = (id, active) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request2({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active } });
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
          await request2({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
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
          return request2({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
        },
        openPopover: (payload) => {
          if (lastReady?.features?.popovers !== true) {
            return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
          }
          if (!isGuestPopoverRequest(payload)) {
            return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
          }
          return request2({ ...envelope, type: "popover-open", id: nextId(ids), payload });
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
          return request2({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "toast",
            id: nextId(ids),
            payload: { ...payload, message }
          });
        },
        openUrl: (url) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "open-url",
          id: nextId(ids),
          payload: { url }
        }),
        openCommit: (sha) => isGuestCommitSha(sha) ? request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "open-commit",
          id: nextId(ids),
          payload: { sha }
        }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
        answerBlock: (text) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "block-answer",
          id: nextId(ids),
          payload: { text: text.trim().slice(0, GUEST_BLOCK_ANSWER_MAX) }
        }),
        openSurface: (surfaceId) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "open-surface",
          id: nextId(ids),
          payload: { surfaceId }
        }),
        writeClipboard: (text) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "clipboard-write",
          id: nextId(ids),
          payload: { text }
        }),
        compose: (payload) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "compose",
          id: nextId(ids),
          payload
        }),
        attach: (payload) => request2({
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
        sessionLink: (payload) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "session-link",
          id: nextId(ids),
          payload: clampAttachRequest(payload)
        }),
        close: () => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "close",
          id: nextId(ids)
        }),
        oauthStart: () => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "oauth-start",
          id: nextId(ids)
        }),
        oauthDisconnect: () => request2({
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
        setBadge: (count) => request2({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "badge",
          id: nextId(ids),
          payload: { count: clampBadgeCount(count) }
        }),
        setHeight: (height) => request2({
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
  }
});

// node_modules/@openchamber/sdk/dist/service-providers.js
var BROWSER_PROVIDER_PATH, BROWSER_CONTROL_ACTIONS, BROWSER_VIEWPORT_MODES, BROWSER_SCROLL_DIRECTIONS, BROWSER_PROVIDER_OPEN_TIMEOUT_MS, BROWSER_PROVIDER_ACTION_TIMEOUT_MS, BROWSER_PROVIDER_RESPONSE_MAX, BROWSER_PROVIDER_IDLE_MS, CONTROL_ACTIONS, isBrowserControlAction, readContext, readBrowserProviderRequest, SOURCE_CONTROL_PROVIDER_PATH, SOURCE_CONTROL_PROVIDER_WIRE_VERSION, SOURCE_CONTROL_PROVIDER_METHODS, SOURCE_CONTROL_PROVIDER_STATUS_TIMEOUT_MS, SOURCE_CONTROL_PROVIDER_READ_TIMEOUT_MS, SOURCE_CONTROL_PROVIDER_MUTATION_TIMEOUT_MS, SOURCE_CONTROL_PROVIDER_AUTH_TIMEOUT_MS, SOURCE_CONTROL_PROVIDER_RESPONSE_MAX, SOURCE_CONTROL_PROVIDER_ERROR_MESSAGE_MAX, SOURCE_CONTROL_PROVIDER_IDLE_MS, SOURCE_CONTROL_PROVIDER_TARGET_MAX, sourceControlProviderTimeoutMs, OPENCHAMBER_HOST_CALLBACK_URL, OPENCHAMBER_SERVICE_DATA_DIR, SOURCE_CONTROL_OUTBOUND_PATH, SOURCE_CONTROL_OUTBOUND_METHODS, SOURCE_CONTROL_OUTBOUND_REQUEST_HEADERS, SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADERS, SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADER_PREFIX, SOURCE_CONTROL_OUTBOUND_BODY_MAX, SOURCE_CONTROL_OUTBOUND_RESPONSE_MAX, SOURCE_CONTROL_OUTBOUND_TIMEOUT_MS, isSourceControlProviderMethod, readSessionUser, readSession, readSourceControlProviderRequest, SourceControlForgeError, postOutbound, createSourceControlForge, NOTIFICATIONS_PROVIDER_PATH, NOTIFICATIONS_PROVIDER_WIRE_VERSION, NOTIFICATIONS_PROVIDER_METHODS, NOTIFICATIONS_PROVIDER_NOTIFY_TIMEOUT_MS, NOTIFICATIONS_PROVIDER_AUTH_TIMEOUT_MS, NOTIFICATIONS_PROVIDER_RESPONSE_MAX, NOTIFICATIONS_PROVIDER_ERROR_MESSAGE_MAX, NOTIFICATIONS_PROVIDER_IDLE_MS, NOTIFICATIONS_OUTBOUND_PATH, NOTIFICATIONS_OUTBOUND_TIMEOUT_MS, notificationsProviderTimeoutMs, GUEST_NOTIFICATION_KINDS, isNotificationsProviderMethod, readNotificationsAccount, readNotificationsProviderRequest, NotificationsOutboundError, createNotificationsOutbound, TRACKER_PROVIDER_PATH, TRACKER_PROVIDER_WIRE_VERSION, TRACKER_PROVIDER_METHODS, TRACKER_PROVIDER_WRITE_METHODS, TRACKER_PROVIDER_AUTH_TIMEOUT_MS, TRACKER_PROVIDER_READ_TIMEOUT_MS, TRACKER_PROVIDER_WRITE_TIMEOUT_MS, TRACKER_PROVIDER_RESPONSE_MAX, TRACKER_PROVIDER_ERROR_MESSAGE_MAX, TRACKER_PROVIDER_IDLE_MS, TRACKER_PROVIDER_LIST_MAX, TRACKER_PROVIDER_LIVE_SUMMARIES_MAX, TRACKER_PROVIDER_CONTAINERS_MAX, TRACKER_OUTBOUND_PATH, TRACKER_OUTBOUND_TIMEOUT_MS, isTrackerProviderWriteMethod, trackerProviderTimeoutMs, isTrackerProviderMethod, readTrackerProviderRequest, TrackerOutboundError, createTrackerOutbound, QUOTA_PROVIDER_PATH, QUOTA_PROVIDER_WIRE_VERSION, QUOTA_PROVIDER_METHODS, QUOTA_PROVIDER_TIMEOUT_MS, QUOTA_PROVIDER_RESPONSE_MAX, QUOTA_PROVIDER_ERROR_MESSAGE_MAX, QUOTA_PROVIDER_IDLE_MS, QUOTA_PROVIDER_WINDOWS_MAX, QUOTA_PROVIDER_MODELS_MAX, QUOTA_PROVIDER_NAME_MAX, QUOTA_PROVIDER_LABEL_MAX, isQuotaProviderMethod, readQuotaProviderRequest;
var init_service_providers = __esm({
  "node_modules/@openchamber/sdk/dist/service-providers.js"() {
    BROWSER_PROVIDER_PATH = "/browser-control";
    BROWSER_CONTROL_ACTIONS = [
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
    BROWSER_VIEWPORT_MODES = ["mobile", "tablet", "desktop", "fill"];
    BROWSER_SCROLL_DIRECTIONS = ["up", "down", "top", "bottom"];
    BROWSER_PROVIDER_OPEN_TIMEOUT_MS = 45e3;
    BROWSER_PROVIDER_ACTION_TIMEOUT_MS = 2e4;
    BROWSER_PROVIDER_RESPONSE_MAX = 12e6;
    BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
    CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
    isBrowserControlAction = (value) => CONTROL_ACTIONS.has(value);
    readContext = (wire) => {
      const directory = wire?.directory;
      const sessionId = wire?.sessionId;
      return {
        directory: String(directory) === directory && directory.length > 0 ? directory : null,
        sessionId: String(sessionId) === sessionId && sessionId.length > 0 ? sessionId : null
      };
    };
    readBrowserProviderRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { requestId, action, parameters, context } = wire;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(action) !== action || !isBrowserControlAction(action))
        return null;
      if (Object(parameters) !== parameters)
        return null;
      return { requestId, action, parameters, context: readContext(context) };
    };
    SOURCE_CONTROL_PROVIDER_PATH = "/source-control";
    SOURCE_CONTROL_PROVIDER_WIRE_VERSION = 1;
    SOURCE_CONTROL_PROVIDER_METHODS = [
      "auth.verify",
      "auth.probe",
      "auth.status",
      "changeRequestStatus",
      "listChangeRequests",
      "changeRequestContext",
      "listIssues",
      "getIssue",
      "issueComments",
      "projectUpstream",
      "projectBranches",
      "listLabels",
      "listReviewerCandidates",
      "readChangeRequestPatch",
      "readChangeRequestFile",
      "liveSummaries",
      "readChangeRequestHead",
      "resolveChangeRequestSource",
      "mutation.resolveTarget",
      "mutation.perform",
      "mutation.reconcile"
    ];
    SOURCE_CONTROL_PROVIDER_STATUS_TIMEOUT_MS = 12e3;
    SOURCE_CONTROL_PROVIDER_READ_TIMEOUT_MS = 2e4;
    SOURCE_CONTROL_PROVIDER_MUTATION_TIMEOUT_MS = 3e4;
    SOURCE_CONTROL_PROVIDER_AUTH_TIMEOUT_MS = 15e3;
    SOURCE_CONTROL_PROVIDER_RESPONSE_MAX = 8e6;
    SOURCE_CONTROL_PROVIDER_ERROR_MESSAGE_MAX = 2e3;
    SOURCE_CONTROL_PROVIDER_IDLE_MS = 10 * 6e4;
    SOURCE_CONTROL_PROVIDER_TARGET_MAX = 4096;
    sourceControlProviderTimeoutMs = (method) => {
      if (method === "changeRequestStatus")
        return SOURCE_CONTROL_PROVIDER_STATUS_TIMEOUT_MS;
      if (method === "auth.verify" || method === "auth.probe" || method === "auth.status")
        return SOURCE_CONTROL_PROVIDER_AUTH_TIMEOUT_MS;
      if (method.startsWith("mutation."))
        return SOURCE_CONTROL_PROVIDER_MUTATION_TIMEOUT_MS;
      return SOURCE_CONTROL_PROVIDER_READ_TIMEOUT_MS;
    };
    OPENCHAMBER_HOST_CALLBACK_URL = "OPENCHAMBER_HOST_CALLBACK_URL";
    OPENCHAMBER_SERVICE_DATA_DIR = "OPENCHAMBER_SERVICE_DATA_DIR";
    SOURCE_CONTROL_OUTBOUND_PATH = "/source-control/outbound";
    SOURCE_CONTROL_OUTBOUND_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    SOURCE_CONTROL_OUTBOUND_REQUEST_HEADERS = ["accept", "content-type", "if-none-match", "range"];
    SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADERS = ["content-type", "link", "etag", "x-total-count", "x-total", "retry-after"];
    SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADER_PREFIX = "x-ratelimit-";
    SOURCE_CONTROL_OUTBOUND_BODY_MAX = 1e6;
    SOURCE_CONTROL_OUTBOUND_RESPONSE_MAX = 8e6;
    SOURCE_CONTROL_OUTBOUND_TIMEOUT_MS = 2e4;
    isSourceControlProviderMethod = (value) => SOURCE_CONTROL_PROVIDER_METHODS.some((method) => method === value);
    readSessionUser = (user) => {
      if (user === null)
        return null;
      if (Object(user) !== user || user === void 0)
        return void 0;
      const { id, login } = user;
      const isPositiveSafeIntegerId = typeof id === "number" && Number.isSafeInteger(id) && id > 0;
      const isBoundedStringId = typeof id === "string" && id.length > 0 && id.length <= 256;
      const validId = isPositiveSafeIntegerId || isBoundedStringId;
      if (!validId || String(login) !== login || login.length === 0)
        return void 0;
      return { id, login };
    };
    readSession = (session) => {
      if (session === null)
        return null;
      if (Object(session) !== session || session === void 0)
        return void 0;
      const { instance, handle } = session;
      if (String(instance) !== instance || instance.length === 0 || String(handle) !== handle || handle.length === 0)
        return void 0;
      const user = readSessionUser(session.user);
      if (user === void 0)
        return void 0;
      return { instance, handle, user };
    };
    readSourceControlProviderRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { v, requestId, method, provider, input } = wire;
      if (v !== SOURCE_CONTROL_PROVIDER_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(provider) !== provider || provider.length === 0)
        return null;
      if (String(method) !== method || !isSourceControlProviderMethod(method))
        return null;
      if (Object(input) !== input || Array.isArray(input))
        return null;
      const session = readSession(wire.session);
      if (session === void 0)
        return null;
      return { v: SOURCE_CONTROL_PROVIDER_WIRE_VERSION, requestId, method, provider, session, input };
    };
    SourceControlForgeError = class extends Error {
      code;
      status;
      constructor(message, code, status) {
        super(message);
        this.name = "SourceControlForgeError";
        this.code = code;
        this.status = status;
      }
    };
    postOutbound = async (url, handle, request2, timeoutMs, fail) => {
      let response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { authorization: `Bearer ${handle}`, "content-type": "application/json" },
          body: JSON.stringify(request2),
          // A little past OpenChamber's own deadline, so its answer wins.
          signal: AbortSignal.timeout(timeoutMs + 5e3)
        });
      } catch (error) {
        throw fail(`OpenChamber did not answer: ${error instanceof Error ? error.message : String(error)}`, "HOST_UNAVAILABLE", 0);
      }
      let answer;
      try {
        answer = Object(await response.json());
      } catch {
        throw fail("OpenChamber answered with something other than JSON", "HOST_UNAVAILABLE", response.status);
      }
      if (!response.ok) {
        const message = answer.error?.message;
        const code = answer.error?.code;
        throw fail(String(message) === message && message.length > 0 ? message : `OpenChamber refused the request (${response.status})`, String(code) === code && code.length > 0 ? code : "OUTBOUND_REFUSED", response.status);
      }
      if (!Number.isSafeInteger(answer.status) || String(answer.body) !== answer.body) {
        throw fail("OpenChamber relayed a malformed answer", "HOST_UNAVAILABLE", response.status);
      }
      const headers = {};
      for (const [name, text] of Object.entries(Object(answer.headers ?? {}))) {
        if (String(text) === text)
          headers[name] = text;
      }
      return { status: Number(answer.status), headers, body: answer.body };
    };
    createSourceControlForge = ({ env }) => {
      const base = env[OPENCHAMBER_HOST_CALLBACK_URL];
      if (!base)
        throw new Error(`${OPENCHAMBER_HOST_CALLBACK_URL} is not set: only a service that provides "source-control" can reach a forge.`);
      const url = `${base.replace(/\/+$/, "")}${SOURCE_CONTROL_OUTBOUND_PATH}`;
      return {
        request: (handle, request2) => postOutbound(url, handle, request2, SOURCE_CONTROL_OUTBOUND_TIMEOUT_MS, (message, code, status) => new SourceControlForgeError(message, code, status))
      };
    };
    NOTIFICATIONS_PROVIDER_PATH = "/notifications";
    NOTIFICATIONS_PROVIDER_WIRE_VERSION = 1;
    NOTIFICATIONS_PROVIDER_METHODS = ["auth.verify", "auth.probe", "notify"];
    NOTIFICATIONS_PROVIDER_NOTIFY_TIMEOUT_MS = 1e4;
    NOTIFICATIONS_PROVIDER_AUTH_TIMEOUT_MS = 15e3;
    NOTIFICATIONS_PROVIDER_RESPONSE_MAX = 16e3;
    NOTIFICATIONS_PROVIDER_ERROR_MESSAGE_MAX = 2e3;
    NOTIFICATIONS_PROVIDER_IDLE_MS = 10 * 6e4;
    NOTIFICATIONS_OUTBOUND_PATH = "/notifications/outbound";
    NOTIFICATIONS_OUTBOUND_TIMEOUT_MS = 2e4;
    notificationsProviderTimeoutMs = (method) => method === "notify" ? NOTIFICATIONS_PROVIDER_NOTIFY_TIMEOUT_MS : NOTIFICATIONS_PROVIDER_AUTH_TIMEOUT_MS;
    GUEST_NOTIFICATION_KINDS = ["ready", "error", "question", "permission", "review", "goal_complete", "goal_blocked", "goal_budget", "pull-request"];
    isNotificationsProviderMethod = (value) => NOTIFICATIONS_PROVIDER_METHODS.some((method) => method === value);
    readNotificationsAccount = (account) => {
      if (account === null)
        return null;
      if (Object(account) !== account || account === void 0)
        return void 0;
      const { id, login } = account;
      if (String(id) !== id || id.length === 0)
        return void 0;
      if (login !== null && (String(login) !== login || login.length === 0))
        return void 0;
      return { id, login };
    };
    readNotificationsProviderRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { v, requestId, method, provider, session, input } = wire;
      if (v !== NOTIFICATIONS_PROVIDER_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(provider) !== provider || provider.length === 0)
        return null;
      if (String(method) !== method || !isNotificationsProviderMethod(method))
        return null;
      if (Object(input) !== input || Array.isArray(input))
        return null;
      if (Object(session) !== session || session === null || session === void 0)
        return null;
      const { instance, handle } = session;
      if (String(instance) !== instance || instance.length === 0 || String(handle) !== handle || handle.length === 0)
        return null;
      const account = readNotificationsAccount(session.account);
      if (account === void 0)
        return null;
      return { v: NOTIFICATIONS_PROVIDER_WIRE_VERSION, requestId, method, provider, session: { instance, handle, account }, input };
    };
    NotificationsOutboundError = class extends Error {
      code;
      status;
      constructor(message, code, status) {
        super(message);
        this.name = "NotificationsOutboundError";
        this.code = code;
        this.status = status;
      }
    };
    createNotificationsOutbound = ({ env }) => {
      const base = env[OPENCHAMBER_HOST_CALLBACK_URL];
      if (!base)
        throw new Error(`${OPENCHAMBER_HOST_CALLBACK_URL} is not set: only a service that provides "notifications" can reach a channel's server.`);
      const url = `${base.replace(/\/+$/, "")}${NOTIFICATIONS_OUTBOUND_PATH}`;
      return {
        request: (handle, request2) => postOutbound(url, handle, request2, NOTIFICATIONS_OUTBOUND_TIMEOUT_MS, (message, code, status) => new NotificationsOutboundError(message, code, status))
      };
    };
    TRACKER_PROVIDER_PATH = "/tracker";
    TRACKER_PROVIDER_WIRE_VERSION = 1;
    TRACKER_PROVIDER_METHODS = [
      "auth.probe",
      "auth.verify",
      "items.list",
      "items.get",
      "items.updateState",
      "items.liveSummaries",
      "states.list",
      "containers.list",
      "comments.create"
    ];
    TRACKER_PROVIDER_WRITE_METHODS = ["items.updateState", "comments.create"];
    TRACKER_PROVIDER_AUTH_TIMEOUT_MS = 15e3;
    TRACKER_PROVIDER_READ_TIMEOUT_MS = 2e4;
    TRACKER_PROVIDER_WRITE_TIMEOUT_MS = 3e4;
    TRACKER_PROVIDER_RESPONSE_MAX = 2e6;
    TRACKER_PROVIDER_ERROR_MESSAGE_MAX = 2e3;
    TRACKER_PROVIDER_IDLE_MS = 10 * 6e4;
    TRACKER_PROVIDER_LIST_MAX = 100;
    TRACKER_PROVIDER_LIVE_SUMMARIES_MAX = 50;
    TRACKER_PROVIDER_CONTAINERS_MAX = 500;
    TRACKER_OUTBOUND_PATH = "/tracker/outbound";
    TRACKER_OUTBOUND_TIMEOUT_MS = 2e4;
    isTrackerProviderWriteMethod = (method) => TRACKER_PROVIDER_WRITE_METHODS.some((write) => write === method);
    trackerProviderTimeoutMs = (method) => {
      if (method === "auth.probe" || method === "auth.verify")
        return TRACKER_PROVIDER_AUTH_TIMEOUT_MS;
      if (isTrackerProviderWriteMethod(method))
        return TRACKER_PROVIDER_WRITE_TIMEOUT_MS;
      return TRACKER_PROVIDER_READ_TIMEOUT_MS;
    };
    isTrackerProviderMethod = (value) => TRACKER_PROVIDER_METHODS.some((method) => method === value);
    readTrackerProviderRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { v, requestId, method, provider, session, input } = wire;
      if (v !== TRACKER_PROVIDER_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(provider) !== provider || provider.length === 0)
        return null;
      if (String(method) !== method || !isTrackerProviderMethod(method))
        return null;
      if (Object(input) !== input || Array.isArray(input))
        return null;
      if (Object(session) !== session || session === null || session === void 0)
        return null;
      const { instance, handle } = session;
      if (String(instance) !== instance || instance.length === 0 || String(handle) !== handle || handle.length === 0)
        return null;
      const account = readNotificationsAccount(session.account);
      if (account === void 0)
        return null;
      return { v: TRACKER_PROVIDER_WIRE_VERSION, requestId, method, provider, session: { instance, handle, account }, input };
    };
    TrackerOutboundError = class extends Error {
      code;
      status;
      constructor(message, code, status) {
        super(message);
        this.name = "TrackerOutboundError";
        this.code = code;
        this.status = status;
      }
    };
    createTrackerOutbound = ({ env }) => {
      const base = env[OPENCHAMBER_HOST_CALLBACK_URL];
      if (!base)
        throw new Error(`${OPENCHAMBER_HOST_CALLBACK_URL} is not set: only a service that provides "tracker" can reach a tracker's server.`);
      const url = `${base.replace(/\/+$/, "")}${TRACKER_OUTBOUND_PATH}`;
      return {
        request: (handle, request2) => postOutbound(url, handle, request2, TRACKER_OUTBOUND_TIMEOUT_MS, (message, code, status) => new TrackerOutboundError(message, code, status))
      };
    };
    QUOTA_PROVIDER_PATH = "/quota";
    QUOTA_PROVIDER_WIRE_VERSION = 1;
    QUOTA_PROVIDER_METHODS = ["usage.read"];
    QUOTA_PROVIDER_TIMEOUT_MS = 2e4;
    QUOTA_PROVIDER_RESPONSE_MAX = 1e6;
    QUOTA_PROVIDER_ERROR_MESSAGE_MAX = 2e3;
    QUOTA_PROVIDER_IDLE_MS = 10 * 6e4;
    QUOTA_PROVIDER_WINDOWS_MAX = 32;
    QUOTA_PROVIDER_MODELS_MAX = 64;
    QUOTA_PROVIDER_NAME_MAX = 128;
    QUOTA_PROVIDER_LABEL_MAX = 128;
    isQuotaProviderMethod = (value) => QUOTA_PROVIDER_METHODS.some((method) => method === value);
    readQuotaProviderRequest = (body) => {
      let wire;
      try {
        const parsed = JSON.parse(body);
        if (Object(parsed) !== parsed || parsed === null)
          return null;
        wire = parsed;
      } catch {
        return null;
      }
      const { v, requestId, method, provider, input } = wire;
      if (v !== QUOTA_PROVIDER_WIRE_VERSION)
        return null;
      if (String(requestId) !== requestId || requestId.length === 0)
        return null;
      if (String(provider) !== provider || provider.length === 0)
        return null;
      if (String(method) !== method || !isQuotaProviderMethod(method))
        return null;
      if (Object(input) !== input || input === null || input === void 0 || Array.isArray(input))
        return null;
      const { credentials } = input;
      if (Object(credentials) !== credentials || credentials === null || Array.isArray(credentials))
        return null;
      if (Object.values(Object(credentials)).some((credential) => Object(credential) !== credential || credential === null || Array.isArray(credential)))
        return null;
      return { v: QUOTA_PROVIDER_WIRE_VERSION, requestId, method, provider, input: { credentials } };
    };
  }
});

// node_modules/@openchamber/sdk/dist/service-surface.js
var SURFACE_FRAME_PATH, SURFACE_INPUT_PATH, SURFACE_CONTROL_PATH, SURFACE_RESIZE_PATH, SURFACE_CLIPBOARD_PATH, SURFACE_SEQ_HEADER, SURFACE_WIDTH_HEADER, SURFACE_HEIGHT_HEADER, SURFACE_TITLE_HEADER, SURFACE_AGENT_ACTIVE_HEADER, SURFACE_VIEWER_HEADER, SURFACE_FRAME_SEQ_HEADER, SURFACE_VIEWER_CONTROLS_HEADER, SURFACE_FRAME_MIMES, SURFACE_FRAME_WAIT_MS, SURFACE_FRAME_MAX_BYTES, SURFACE_INPUT_BATCH_MAX, SURFACE_TEXT_MAX, SURFACE_TITLE_MAX, SURFACE_DIMENSION_MAX, SURFACE_AGENT_HOLD_MS, SURFACE_CONTROLLERS, isFiniteNumber, isBool, isText, readModifiers, readEvent, readSurfaceInputBatch, CONTROLLERS, readSurfaceControlNotice, readSurfaceResizeRequest;
var init_service_surface = __esm({
  "node_modules/@openchamber/sdk/dist/service-surface.js"() {
    SURFACE_FRAME_PATH = "/surface/frame";
    SURFACE_INPUT_PATH = "/surface/input";
    SURFACE_CONTROL_PATH = "/surface/control";
    SURFACE_RESIZE_PATH = "/surface/resize";
    SURFACE_CLIPBOARD_PATH = "/surface/clipboard";
    SURFACE_SEQ_HEADER = "x-surface-seq";
    SURFACE_WIDTH_HEADER = "x-surface-width";
    SURFACE_HEIGHT_HEADER = "x-surface-height";
    SURFACE_TITLE_HEADER = "x-surface-title";
    SURFACE_AGENT_ACTIVE_HEADER = "x-surface-agent-active";
    SURFACE_VIEWER_HEADER = "x-surface-viewer";
    SURFACE_FRAME_SEQ_HEADER = "x-surface-frame-seq";
    SURFACE_VIEWER_CONTROLS_HEADER = "x-surface-viewer-controls";
    SURFACE_FRAME_MIMES = ["image/jpeg", "image/png"];
    SURFACE_FRAME_WAIT_MS = 25e3;
    SURFACE_FRAME_MAX_BYTES = 8e6;
    SURFACE_INPUT_BATCH_MAX = 256;
    SURFACE_TEXT_MAX = 64e3;
    SURFACE_TITLE_MAX = 200;
    SURFACE_DIMENSION_MAX = 16384;
    SURFACE_AGENT_HOLD_MS = 3e4;
    SURFACE_CONTROLLERS = ["none", "agent", "user"];
    isFiniteNumber = (value) => Number(value) === value && Number.isFinite(value);
    isBool = (value) => value === true || value === false;
    isText = (value) => String(value) === value;
    readModifiers = (value) => {
      if (Object(value) !== value || value === null)
        return null;
      const wire = value;
      if (!isBool(wire.alt) || !isBool(wire.ctrl) || !isBool(wire.meta) || !isBool(wire.shift))
        return null;
      return { alt: wire.alt, ctrl: wire.ctrl, meta: wire.meta, shift: wire.shift };
    };
    readEvent = (value) => {
      if (value.type === "text") {
        if (!isText(value.text) || value.text.length > SURFACE_TEXT_MAX)
          return null;
        return { type: "text", text: value.text };
      }
      const modifiers = readModifiers(value.modifiers);
      if (!modifiers)
        return null;
      if (value.type === "pointer") {
        if (value.action !== "down" && value.action !== "up" && value.action !== "move")
          return null;
        if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.button) || !isFiniteNumber(value.buttons))
          return null;
        return { type: "pointer", action: value.action, x: value.x, y: value.y, button: value.button, buttons: value.buttons, modifiers };
      }
      if (value.type === "wheel") {
        if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.deltaX) || !isFiniteNumber(value.deltaY))
          return null;
        return { type: "wheel", x: value.x, y: value.y, deltaX: value.deltaX, deltaY: value.deltaY, modifiers };
      }
      if (value.type === "key") {
        if (value.action !== "down" && value.action !== "up")
          return null;
        if (!isText(value.key) || !isText(value.code) || value.key.length > 64 || value.code.length > 64)
          return null;
        if (value.keyCode === void 0)
          return { type: "key", action: value.action, key: value.key, code: value.code, modifiers };
        if (!isFiniteNumber(value.keyCode) || !Number.isInteger(value.keyCode) || value.keyCode < 0 || value.keyCode > 255)
          return null;
        return { type: "key", action: value.action, key: value.key, code: value.code, keyCode: value.keyCode, modifiers };
      }
      return null;
    };
    readSurfaceInputBatch = (body) => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return null;
      }
      if (Object(parsed) !== parsed || parsed === null || !Array.isArray(parsed.events))
        return null;
      if (parsed.events.length > SURFACE_INPUT_BATCH_MAX)
        return null;
      const events = [];
      for (const item of parsed.events) {
        if (Object(item) !== item || item === null)
          return null;
        const event = readEvent(item);
        if (!event)
          return null;
        events.push(event);
      }
      return { events };
    };
    CONTROLLERS = new Set(SURFACE_CONTROLLERS);
    readSurfaceControlNotice = (body) => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return null;
      }
      if (Object(parsed) !== parsed || parsed === null)
        return null;
      const { controller, viewer } = parsed;
      if (!isText(controller) || !CONTROLLERS.has(controller))
        return null;
      const notice = { controller };
      if (controller === "user" && isText(viewer) && viewer.length > 0)
        notice.viewer = viewer;
      return notice;
    };
    readSurfaceResizeRequest = (body) => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        return null;
      }
      if (Object(parsed) !== parsed || parsed === null)
        return null;
      const { width, height } = parsed;
      if (!isFiniteNumber(width) || !isFiniteNumber(height))
        return null;
      if (width < 1 || height < 1 || width > SURFACE_DIMENSION_MAX || height > SURFACE_DIMENSION_MAX)
        return null;
      return { width: Math.round(width), height: Math.round(height) };
    };
  }
});

// node_modules/@openchamber/sdk/dist/index.js
var dist_exports = {};
__export(dist_exports, {
  BROWSER_CONTROL_ACTIONS: () => BROWSER_CONTROL_ACTIONS,
  BROWSER_PROVIDER_ACTION_TIMEOUT_MS: () => BROWSER_PROVIDER_ACTION_TIMEOUT_MS,
  BROWSER_PROVIDER_IDLE_MS: () => BROWSER_PROVIDER_IDLE_MS,
  BROWSER_PROVIDER_OPEN_TIMEOUT_MS: () => BROWSER_PROVIDER_OPEN_TIMEOUT_MS,
  BROWSER_PROVIDER_PATH: () => BROWSER_PROVIDER_PATH,
  BROWSER_PROVIDER_RESPONSE_MAX: () => BROWSER_PROVIDER_RESPONSE_MAX,
  BROWSER_SCROLL_DIRECTIONS: () => BROWSER_SCROLL_DIRECTIONS,
  BROWSER_VIEWPORT_MODES: () => BROWSER_VIEWPORT_MODES,
  DECLARED_GUEST_CAPABILITIES: () => DECLARED_GUEST_CAPABILITIES,
  EMPTY_GUEST_CONNECTION: () => EMPTY_GUEST_CONNECTION,
  GUEST_ACCOUNT_MAX: () => GUEST_ACCOUNT_MAX,
  GUEST_ACTIONS_MAX: () => GUEST_ACTIONS_MAX,
  GUEST_ACTION_LABEL_MAX: () => GUEST_ACTION_LABEL_MAX,
  GUEST_ATTACH_AUTHOR_MAX: () => GUEST_ATTACH_AUTHOR_MAX,
  GUEST_ATTACH_BRANCH_MAX: () => GUEST_ATTACH_BRANCH_MAX,
  GUEST_ATTACH_DATA_MAX: () => GUEST_ATTACH_DATA_MAX,
  GUEST_ATTACH_ID_MAX: () => GUEST_ATTACH_ID_MAX,
  GUEST_ATTACH_TEXT_MAX: () => GUEST_ATTACH_TEXT_MAX,
  GUEST_ATTACH_TITLE_MAX: () => GUEST_ATTACH_TITLE_MAX,
  GUEST_ATTACH_URL_MAX: () => GUEST_ATTACH_URL_MAX,
  GUEST_BADGE_MAX: () => GUEST_BADGE_MAX,
  GUEST_BLOCKS_MAX: () => GUEST_BLOCKS_MAX,
  GUEST_BLOCK_ANSWER_MAX: () => GUEST_BLOCK_ANSWER_MAX,
  GUEST_BLOCK_ARGS_MAX: () => GUEST_BLOCK_ARGS_MAX,
  GUEST_BLOCK_ARGS_TEXT_MAX: () => GUEST_BLOCK_ARGS_TEXT_MAX,
  GUEST_BLOCK_ARG_NAME: () => GUEST_BLOCK_ARG_NAME,
  GUEST_BLOCK_DESCRIPTION_MAX: () => GUEST_BLOCK_DESCRIPTION_MAX,
  GUEST_BLOCK_HEIGHT_DEFAULT: () => GUEST_BLOCK_HEIGHT_DEFAULT,
  GUEST_BLOCK_HEIGHT_MAX: () => GUEST_BLOCK_HEIGHT_MAX,
  GUEST_BLOCK_NAME: () => GUEST_BLOCK_NAME,
  GUEST_BLOCK_RESERVED_NAMES: () => GUEST_BLOCK_RESERVED_NAMES,
  GUEST_CAPABILITIES: () => GUEST_CAPABILITIES,
  GUEST_CLIPBOARD_TEXT_MAX: () => GUEST_CLIPBOARD_TEXT_MAX,
  GUEST_COMMANDS_MAX: () => GUEST_COMMANDS_MAX,
  GUEST_COMMAND_DESCRIPTION_MAX: () => GUEST_COMMAND_DESCRIPTION_MAX,
  GUEST_COMMAND_NAME: () => GUEST_COMMAND_NAME,
  GUEST_COMMIT_SHA: () => GUEST_COMMIT_SHA,
  GUEST_COMPOSE_TEXT_MAX: () => GUEST_COMPOSE_TEXT_MAX,
  GUEST_DEVICE_STORAGE_TOTAL_BYTES: () => GUEST_DEVICE_STORAGE_TOTAL_BYTES,
  GUEST_FILESYSTEM_PATTERNS_MAX: () => GUEST_FILESYSTEM_PATTERNS_MAX,
  GUEST_FILESYSTEM_PATTERN_MAX: () => GUEST_FILESYSTEM_PATTERN_MAX,
  GUEST_FILE_CONTENT_MAX: () => GUEST_FILE_CONTENT_MAX,
  GUEST_FILE_EDITORS_MAX: () => GUEST_FILE_EDITORS_MAX,
  GUEST_FILE_EDITOR_CONTENT_MAX: () => GUEST_FILE_EDITOR_CONTENT_MAX,
  GUEST_FILE_EDITOR_PATTERNS_MAX: () => GUEST_FILE_EDITOR_PATTERNS_MAX,
  GUEST_FILE_EDITOR_PATTERN_MAX: () => GUEST_FILE_EDITOR_PATTERN_MAX,
  GUEST_FILE_EDITOR_TITLE_MAX: () => GUEST_FILE_EDITOR_TITLE_MAX,
  GUEST_FILE_EDITOR_VERSION_MAX: () => GUEST_FILE_EDITOR_VERSION_MAX,
  GUEST_FILE_ENTRY_KINDS: () => GUEST_FILE_ENTRY_KINDS,
  GUEST_FILE_LIST_MAX: () => GUEST_FILE_LIST_MAX,
  GUEST_FILE_PATH_MAX: () => GUEST_FILE_PATH_MAX,
  GUEST_FILE_STAT_KINDS: () => GUEST_FILE_STAT_KINDS,
  GUEST_FRAME_HEIGHT_MAX: () => GUEST_FRAME_HEIGHT_MAX,
  GUEST_GENERATE_LATE_KEEP_MS: () => GUEST_GENERATE_LATE_KEEP_MS,
  GUEST_GENERATE_LATE_MAX: () => GUEST_GENERATE_LATE_MAX,
  GUEST_GENERATE_OUTPUT_TOKENS_MAX: () => GUEST_GENERATE_OUTPUT_TOKENS_MAX,
  GUEST_GENERATE_PROMPT_MAX: () => GUEST_GENERATE_PROMPT_MAX,
  GUEST_GENERATE_SYSTEM_MAX: () => GUEST_GENERATE_SYSTEM_MAX,
  GUEST_GENERATE_TEXT_MAX: () => GUEST_GENERATE_TEXT_MAX,
  GUEST_GENERATE_TIMEOUT_MS: () => GUEST_GENERATE_TIMEOUT_MS,
  GUEST_ITEM_MESSAGE_TEXT_MAX: () => GUEST_ITEM_MESSAGE_TEXT_MAX,
  GUEST_ITEM_SESSION_MAX: () => GUEST_ITEM_SESSION_MAX,
  GUEST_LINK_ACTIONS: () => GUEST_LINK_ACTIONS,
  GUEST_LINK_KEY: () => GUEST_LINK_KEY,
  GUEST_LINK_KEYS_MAX: () => GUEST_LINK_KEYS_MAX,
  GUEST_MICROPHONE_END_REASONS: () => GUEST_MICROPHONE_END_REASONS,
  GUEST_MICROPHONE_FRAME_MAX: () => GUEST_MICROPHONE_FRAME_MAX,
  GUEST_MICROPHONE_OPEN_TIMEOUT_MS: () => GUEST_MICROPHONE_OPEN_TIMEOUT_MS,
  GUEST_MICROPHONE_SAMPLE_RATE_MAX: () => GUEST_MICROPHONE_SAMPLE_RATE_MAX,
  GUEST_MICROPHONE_SAMPLE_RATE_MIN: () => GUEST_MICROPHONE_SAMPLE_RATE_MIN,
  GUEST_NOTIFICATION_KINDS: () => GUEST_NOTIFICATION_KINDS,
  GUEST_ORIGINS_MAX: () => GUEST_ORIGINS_MAX,
  GUEST_POPOVER_CLOSE_REASONS: () => GUEST_POPOVER_CLOSE_REASONS,
  GUEST_POPOVER_COORDINATE_MAX: () => GUEST_POPOVER_COORDINATE_MAX,
  GUEST_POPOVER_DATA_DEPTH_MAX: () => GUEST_POPOVER_DATA_DEPTH_MAX,
  GUEST_POPOVER_DATA_MAX: () => GUEST_POPOVER_DATA_MAX,
  GUEST_POPOVER_HEIGHT_MAX: () => GUEST_POPOVER_HEIGHT_MAX,
  GUEST_POPOVER_HEIGHT_MIN: () => GUEST_POPOVER_HEIGHT_MIN,
  GUEST_POPOVER_ID: () => GUEST_POPOVER_ID,
  GUEST_POPOVER_SIDES: () => GUEST_POPOVER_SIDES,
  GUEST_POPOVER_WIDTH_MAX: () => GUEST_POPOVER_WIDTH_MAX,
  GUEST_POPOVER_WIDTH_MIN: () => GUEST_POPOVER_WIDTH_MIN,
  GUEST_PROVIDER_LOGOS_MAX: () => GUEST_PROVIDER_LOGOS_MAX,
  GUEST_PROVIDER_LOGO_BYTES_MAX: () => GUEST_PROVIDER_LOGO_BYTES_MAX,
  GUEST_REQUEST_BODY_MAX: () => GUEST_REQUEST_BODY_MAX,
  GUEST_REQUEST_PATH_MAX: () => GUEST_REQUEST_PATH_MAX,
  GUEST_REQUEST_RESPONSE_MAX: () => GUEST_REQUEST_RESPONSE_MAX,
  GUEST_REQUEST_TIMEOUT_MS: () => GUEST_REQUEST_TIMEOUT_MS,
  GUEST_RESOLVE_ERROR_MAX: () => GUEST_RESOLVE_ERROR_MAX,
  GUEST_SCROLLBAR_CSS: () => GUEST_SCROLLBAR_CSS,
  GUEST_SCROLLBAR_SCRIPT: () => GUEST_SCROLLBAR_SCRIPT,
  GUEST_SERVICE_PROVIDES: () => GUEST_SERVICE_PROVIDES,
  GUEST_SESSION_AGENT_MAX: () => GUEST_SESSION_AGENT_MAX,
  GUEST_SESSION_EVENT_TYPES: () => GUEST_SESSION_EVENT_TYPES,
  GUEST_SESSION_MODEL_MAX: () => GUEST_SESSION_MODEL_MAX,
  GUEST_SETTING_VALUE_MAX: () => GUEST_SETTING_VALUE_MAX,
  GUEST_SHELLS_MAX: () => GUEST_SHELLS_MAX,
  GUEST_SHELL_END_STATUSES: () => GUEST_SHELL_END_STATUSES,
  GUEST_SHELL_ID_MAX: () => GUEST_SHELL_ID_MAX,
  GUEST_SHELL_OUTPUT_TAIL_MAX: () => GUEST_SHELL_OUTPUT_TAIL_MAX,
  GUEST_STATUS_CONTROLS_MAX: () => GUEST_STATUS_CONTROLS_MAX,
  GUEST_STATUS_CONTROL_ID: () => GUEST_STATUS_CONTROL_ID,
  GUEST_STATUS_CONTROL_LABEL_MAX: () => GUEST_STATUS_CONTROL_LABEL_MAX,
  GUEST_STATUS_CONTROL_OPTIONS_MAX: () => GUEST_STATUS_CONTROL_OPTIONS_MAX,
  GUEST_STATUS_CONTROL_VALUE_MAX: () => GUEST_STATUS_CONTROL_VALUE_MAX,
  GUEST_STATUS_SECTION_HEIGHT_DEFAULT: () => GUEST_STATUS_SECTION_HEIGHT_DEFAULT,
  GUEST_STATUS_SECTION_HEIGHT_MAX: () => GUEST_STATUS_SECTION_HEIGHT_MAX,
  GUEST_STATUS_SECTION_HEIGHT_MIN: () => GUEST_STATUS_SECTION_HEIGHT_MIN,
  GUEST_STATUS_SECTION_TITLE_MAX: () => GUEST_STATUS_SECTION_TITLE_MAX,
  GUEST_STATUS_SOURCE_INTERVAL_DEFAULT: () => GUEST_STATUS_SOURCE_INTERVAL_DEFAULT,
  GUEST_STATUS_SOURCE_INTERVAL_MAX: () => GUEST_STATUS_SOURCE_INTERVAL_MAX,
  GUEST_STATUS_SOURCE_INTERVAL_MIN: () => GUEST_STATUS_SOURCE_INTERVAL_MIN,
  GUEST_STATUS_VIEW_ACTIONS_MAX: () => GUEST_STATUS_VIEW_ACTIONS_MAX,
  GUEST_STATUS_VIEW_CHART_POINTS_MAX: () => GUEST_STATUS_VIEW_CHART_POINTS_MAX,
  GUEST_STATUS_VIEW_CHIPS_MAX: () => GUEST_STATUS_VIEW_CHIPS_MAX,
  GUEST_STATUS_VIEW_ICON: () => GUEST_STATUS_VIEW_ICON,
  GUEST_STATUS_VIEW_NOTE_MAX: () => GUEST_STATUS_VIEW_NOTE_MAX,
  GUEST_STATUS_VIEW_ROWS_MAX: () => GUEST_STATUS_VIEW_ROWS_MAX,
  GUEST_STATUS_VIEW_SEGMENTS_MAX: () => GUEST_STATUS_VIEW_SEGMENTS_MAX,
  GUEST_STATUS_VIEW_SEGMENTS_MIN: () => GUEST_STATUS_VIEW_SEGMENTS_MIN,
  GUEST_STATUS_VIEW_TEXT_MAX: () => GUEST_STATUS_VIEW_TEXT_MAX,
  GUEST_STORAGE_KEYS_MAX: () => GUEST_STORAGE_KEYS_MAX,
  GUEST_STORAGE_KEY_MAX: () => GUEST_STORAGE_KEY_MAX,
  GUEST_STORAGE_TOTAL_BYTES: () => GUEST_STORAGE_TOTAL_BYTES,
  GUEST_STORAGE_VALUE_BYTES: () => GUEST_STORAGE_VALUE_BYTES,
  GUEST_SURFACE_DOCKS: () => GUEST_SURFACE_DOCKS,
  GUEST_SURFACE_DOCK_DEFAULT: () => GUEST_SURFACE_DOCK_DEFAULT,
  GUEST_SURFACE_DOCK_SIZE_DEFAULT: () => GUEST_SURFACE_DOCK_SIZE_DEFAULT,
  GUEST_SURFACE_DOCK_SIZE_MAX: () => GUEST_SURFACE_DOCK_SIZE_MAX,
  GUEST_SURFACE_DOCK_SIZE_MIN: () => GUEST_SURFACE_DOCK_SIZE_MIN,
  GUEST_TOAST_MAX: () => GUEST_TOAST_MAX,
  GUEST_TONES: () => GUEST_TONES,
  GUEST_TOOLS_MAX: () => GUEST_TOOLS_MAX,
  GUEST_TOOL_CARD_FIELDS_MAX: () => GUEST_TOOL_CARD_FIELDS_MAX,
  GUEST_TOOL_CARD_TEMPLATE_ROOTS: () => GUEST_TOOL_CARD_TEMPLATE_ROOTS,
  GUEST_TOOL_CARD_TONES_MAX: () => GUEST_TOOL_CARD_TONES_MAX,
  GUEST_TOOL_CARD_TONE_KEY_MAX: () => GUEST_TOOL_CARD_TONE_KEY_MAX,
  GUEST_TOOL_CARD_URL_MAX: () => GUEST_TOOL_CARD_URL_MAX,
  GUEST_TOOL_COLUMNS_MAX: () => GUEST_TOOL_COLUMNS_MAX,
  GUEST_TOOL_COLUMN_MAX: () => GUEST_TOOL_COLUMN_MAX,
  GUEST_TOOL_LANGUAGE_MAX: () => GUEST_TOOL_LANGUAGE_MAX,
  GUEST_TOOL_MATCH: () => GUEST_TOOL_MATCH,
  GUEST_TOOL_MATCH_MAX: () => GUEST_TOOL_MATCH_MAX,
  GUEST_TOOL_NAME_MAX: () => GUEST_TOOL_NAME_MAX,
  GUEST_TOOL_OUTPUTS: () => GUEST_TOOL_OUTPUTS,
  GUEST_TOOL_TEMPLATE_MAX: () => GUEST_TOOL_TEMPLATE_MAX,
  GUEST_TOOL_TEMPLATE_ROOTS: () => GUEST_TOOL_TEMPLATE_ROOTS,
  GUEST_TOOL_TEMPLATE_VALUE_MAX: () => GUEST_TOOL_TEMPLATE_VALUE_MAX,
  GUEST_WAITS_MAX: () => GUEST_WAITS_MAX,
  GUEST_WAIT_ARG_STRING_MAX: () => GUEST_WAIT_ARG_STRING_MAX,
  GUEST_WAIT_DESCRIPTION_MAX: () => GUEST_WAIT_DESCRIPTION_MAX,
  GUEST_WAIT_ID: () => GUEST_WAIT_ID,
  GUEST_WAIT_PARAMS_MAX: () => GUEST_WAIT_PARAMS_MAX,
  GUEST_WAIT_PARAM_DESCRIPTION_MAX: () => GUEST_WAIT_PARAM_DESCRIPTION_MAX,
  GUEST_WAIT_PARAM_NAME: () => GUEST_WAIT_PARAM_NAME,
  GUEST_WAIT_PARAM_TYPES: () => GUEST_WAIT_PARAM_TYPES,
  GUEST_WAIT_TITLE_MAX: () => GUEST_WAIT_TITLE_MAX,
  HOST_LINEAR_API_ORIGIN: () => HOST_LINEAR_API_ORIGIN,
  HOST_REQUEST_ERROR_CODES: () => HOST_REQUEST_ERROR_CODES,
  HostRequestError: () => HostRequestError,
  MENTIONS_IDLE_MS: () => MENTIONS_IDLE_MS,
  MENTIONS_ITEMS_MAX: () => MENTIONS_ITEMS_MAX,
  MENTIONS_RESOLVE_PATH: () => MENTIONS_RESOLVE_PATH,
  MENTIONS_RESOLVE_TIMEOUT_MS: () => MENTIONS_RESOLVE_TIMEOUT_MS,
  MENTIONS_SEARCH_PATH: () => MENTIONS_SEARCH_PATH,
  MENTIONS_SEARCH_TIMEOUT_MS: () => MENTIONS_SEARCH_TIMEOUT_MS,
  MENTION_ID_MAX: () => MENTION_ID_MAX,
  MENTION_TEXT_MAX: () => MENTION_TEXT_MAX,
  MENTION_TITLE_MAX: () => MENTION_TITLE_MAX,
  NOTIFICATIONS_GUEST_ID_MAX: () => NOTIFICATIONS_GUEST_ID_MAX,
  NOTIFICATIONS_OUTBOUND_PATH: () => NOTIFICATIONS_OUTBOUND_PATH,
  NOTIFICATIONS_OUTBOUND_TIMEOUT_MS: () => NOTIFICATIONS_OUTBOUND_TIMEOUT_MS,
  NOTIFICATIONS_PROVIDER_AUTH_TIMEOUT_MS: () => NOTIFICATIONS_PROVIDER_AUTH_TIMEOUT_MS,
  NOTIFICATIONS_PROVIDER_ERROR_MESSAGE_MAX: () => NOTIFICATIONS_PROVIDER_ERROR_MESSAGE_MAX,
  NOTIFICATIONS_PROVIDER_IDLE_MS: () => NOTIFICATIONS_PROVIDER_IDLE_MS,
  NOTIFICATIONS_PROVIDER_METHODS: () => NOTIFICATIONS_PROVIDER_METHODS,
  NOTIFICATIONS_PROVIDER_NOTIFY_TIMEOUT_MS: () => NOTIFICATIONS_PROVIDER_NOTIFY_TIMEOUT_MS,
  NOTIFICATIONS_PROVIDER_PATH: () => NOTIFICATIONS_PROVIDER_PATH,
  NOTIFICATIONS_PROVIDER_RESPONSE_MAX: () => NOTIFICATIONS_PROVIDER_RESPONSE_MAX,
  NOTIFICATIONS_PROVIDER_WIRE_VERSION: () => NOTIFICATIONS_PROVIDER_WIRE_VERSION,
  NotificationsOutboundError: () => NotificationsOutboundError,
  OPENCHAMBER_ENGINE_PATTERN: () => OPENCHAMBER_ENGINE_PATTERN,
  OPENCHAMBER_HOST_CALLBACK_URL: () => OPENCHAMBER_HOST_CALLBACK_URL,
  OPENCHAMBER_HOST_CALLBACK_URL_ENV: () => OPENCHAMBER_HOST_CALLBACK_URL_ENV,
  OPENCHAMBER_SDK_API_VERSION: () => OPENCHAMBER_SDK_API_VERSION,
  OPENCHAMBER_SDK_CHANNEL: () => OPENCHAMBER_SDK_CHANNEL,
  OPENCHAMBER_SDK_MANIFEST_API_VERSIONS: () => OPENCHAMBER_SDK_MANIFEST_API_VERSIONS,
  OPENCHAMBER_SERVICE_DATA_DIR: () => OPENCHAMBER_SERVICE_DATA_DIR,
  OPENCODE_PROVIDER_ID: () => OPENCODE_PROVIDER_ID,
  QUOTA_GUEST_ID_MAX: () => QUOTA_GUEST_ID_MAX,
  QUOTA_PROVIDERS_MAX: () => QUOTA_PROVIDERS_MAX,
  QUOTA_PROVIDER_ERROR_MESSAGE_MAX: () => QUOTA_PROVIDER_ERROR_MESSAGE_MAX,
  QUOTA_PROVIDER_IDLE_MS: () => QUOTA_PROVIDER_IDLE_MS,
  QUOTA_PROVIDER_LABEL_MAX: () => QUOTA_PROVIDER_LABEL_MAX,
  QUOTA_PROVIDER_METHODS: () => QUOTA_PROVIDER_METHODS,
  QUOTA_PROVIDER_MODELS_MAX: () => QUOTA_PROVIDER_MODELS_MAX,
  QUOTA_PROVIDER_NAME_MAX: () => QUOTA_PROVIDER_NAME_MAX,
  QUOTA_PROVIDER_PATH: () => QUOTA_PROVIDER_PATH,
  QUOTA_PROVIDER_RESPONSE_MAX: () => QUOTA_PROVIDER_RESPONSE_MAX,
  QUOTA_PROVIDER_TIMEOUT_MS: () => QUOTA_PROVIDER_TIMEOUT_MS,
  QUOTA_PROVIDER_WINDOWS_MAX: () => QUOTA_PROVIDER_WINDOWS_MAX,
  QUOTA_PROVIDER_WIRE_VERSION: () => QUOTA_PROVIDER_WIRE_VERSION,
  SERVICE_ANSWER_MESSAGE_MAX: () => SERVICE_ANSWER_MESSAGE_MAX,
  SERVICE_EVENT_DATA_MAX: () => SERVICE_EVENT_DATA_MAX,
  SERVICE_EVENT_RATE_MAX: () => SERVICE_EVENT_RATE_MAX,
  SERVICE_EVENT_TOPIC_MAX: () => SERVICE_EVENT_TOPIC_MAX,
  SERVICE_HOST_METHODS: () => SERVICE_HOST_METHODS,
  SERVICE_HOST_PATH: () => SERVICE_HOST_PATH,
  SERVICE_HOST_TIMEOUT_MS: () => SERVICE_HOST_TIMEOUT_MS,
  SERVICE_INSTRUCTIONS_MAX: () => SERVICE_INSTRUCTIONS_MAX,
  SERVICE_MARKS_MAX: () => SERVICE_MARKS_MAX,
  SERVICE_MARK_RATE_MAX: () => SERVICE_MARK_RATE_MAX,
  SERVICE_MARK_TEXT_MAX: () => SERVICE_MARK_TEXT_MAX,
  SERVICE_MARK_URL_MAX: () => SERVICE_MARK_URL_MAX,
  SERVICE_PROMPT_MAX: () => SERVICE_PROMPT_MAX,
  SERVICE_SCHEDULE_CRON_MAX: () => SERVICE_SCHEDULE_CRON_MAX,
  SERVICE_SCHEDULE_IDLE_MS: () => SERVICE_SCHEDULE_IDLE_MS,
  SERVICE_SCHEDULE_MAX: () => SERVICE_SCHEDULE_MAX,
  SERVICE_SCHEDULE_PATH: () => SERVICE_SCHEDULE_PATH,
  SERVICE_SCHEDULE_TIMEOUT_MS: () => SERVICE_SCHEDULE_TIMEOUT_MS,
  SERVICE_SCHEDULE_TIMEZONE_MAX: () => SERVICE_SCHEDULE_TIMEZONE_MAX,
  SERVICE_SCHEDULE_WIRE_VERSION: () => SERVICE_SCHEDULE_WIRE_VERSION,
  SERVICE_STATUS_MESSAGE_MAX: () => SERVICE_STATUS_MESSAGE_MAX,
  SERVICE_STATUS_VALUES: () => SERVICE_STATUS_VALUES,
  SESSION_EVENTS_IDLE_MS: () => SESSION_EVENTS_IDLE_MS,
  SESSION_EVENTS_PATH: () => SESSION_EVENTS_PATH,
  SESSION_EVENTS_WIRE_VERSION: () => SESSION_EVENTS_WIRE_VERSION,
  SESSION_EVENT_ERROR_MAX: () => SESSION_EVENT_ERROR_MAX,
  SESSION_EVENT_PENDING_MAX: () => SESSION_EVENT_PENDING_MAX,
  SESSION_EVENT_REPLY_MAX: () => SESSION_EVENT_REPLY_MAX,
  SESSION_EVENT_TIMEOUT_MS: () => SESSION_EVENT_TIMEOUT_MS,
  SESSION_LIFECYCLE_PHASES: () => SESSION_LIFECYCLE_PHASES,
  SOURCE_CONTROL_DEFAULT_INSTANCES_MAX: () => SOURCE_CONTROL_DEFAULT_INSTANCES_MAX,
  SOURCE_CONTROL_GUEST_ID_MAX: () => SOURCE_CONTROL_GUEST_ID_MAX,
  SOURCE_CONTROL_OUTBOUND_BODY_MAX: () => SOURCE_CONTROL_OUTBOUND_BODY_MAX,
  SOURCE_CONTROL_OUTBOUND_METHODS: () => SOURCE_CONTROL_OUTBOUND_METHODS,
  SOURCE_CONTROL_OUTBOUND_PATH: () => SOURCE_CONTROL_OUTBOUND_PATH,
  SOURCE_CONTROL_OUTBOUND_REQUEST_HEADERS: () => SOURCE_CONTROL_OUTBOUND_REQUEST_HEADERS,
  SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADERS: () => SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADERS,
  SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADER_PREFIX: () => SOURCE_CONTROL_OUTBOUND_RESPONSE_HEADER_PREFIX,
  SOURCE_CONTROL_OUTBOUND_RESPONSE_MAX: () => SOURCE_CONTROL_OUTBOUND_RESPONSE_MAX,
  SOURCE_CONTROL_OUTBOUND_TIMEOUT_MS: () => SOURCE_CONTROL_OUTBOUND_TIMEOUT_MS,
  SOURCE_CONTROL_PROVIDER_AUTH_TIMEOUT_MS: () => SOURCE_CONTROL_PROVIDER_AUTH_TIMEOUT_MS,
  SOURCE_CONTROL_PROVIDER_ERROR_MESSAGE_MAX: () => SOURCE_CONTROL_PROVIDER_ERROR_MESSAGE_MAX,
  SOURCE_CONTROL_PROVIDER_IDLE_MS: () => SOURCE_CONTROL_PROVIDER_IDLE_MS,
  SOURCE_CONTROL_PROVIDER_METHODS: () => SOURCE_CONTROL_PROVIDER_METHODS,
  SOURCE_CONTROL_PROVIDER_MUTATION_TIMEOUT_MS: () => SOURCE_CONTROL_PROVIDER_MUTATION_TIMEOUT_MS,
  SOURCE_CONTROL_PROVIDER_PATH: () => SOURCE_CONTROL_PROVIDER_PATH,
  SOURCE_CONTROL_PROVIDER_READ_TIMEOUT_MS: () => SOURCE_CONTROL_PROVIDER_READ_TIMEOUT_MS,
  SOURCE_CONTROL_PROVIDER_RESPONSE_MAX: () => SOURCE_CONTROL_PROVIDER_RESPONSE_MAX,
  SOURCE_CONTROL_PROVIDER_STATUS_TIMEOUT_MS: () => SOURCE_CONTROL_PROVIDER_STATUS_TIMEOUT_MS,
  SOURCE_CONTROL_PROVIDER_TARGET_MAX: () => SOURCE_CONTROL_PROVIDER_TARGET_MAX,
  SOURCE_CONTROL_PROVIDER_WIRE_VERSION: () => SOURCE_CONTROL_PROVIDER_WIRE_VERSION,
  SOURCE_CONTROL_URL_TEMPLATES_MAX: () => SOURCE_CONTROL_URL_TEMPLATES_MAX,
  SOURCE_CONTROL_URL_TEMPLATE_MAX: () => SOURCE_CONTROL_URL_TEMPLATE_MAX,
  SOURCE_CONTROL_URL_TOKENS: () => SOURCE_CONTROL_URL_TOKENS,
  START_SESSION_SENT: () => START_SESSION_SENT,
  SURFACE_AGENT_ACTIVE_HEADER: () => SURFACE_AGENT_ACTIVE_HEADER,
  SURFACE_AGENT_HOLD_MS: () => SURFACE_AGENT_HOLD_MS,
  SURFACE_CLIPBOARD_PATH: () => SURFACE_CLIPBOARD_PATH,
  SURFACE_CONTROLLERS: () => SURFACE_CONTROLLERS,
  SURFACE_CONTROL_PATH: () => SURFACE_CONTROL_PATH,
  SURFACE_DIMENSION_MAX: () => SURFACE_DIMENSION_MAX,
  SURFACE_FRAME_MAX_BYTES: () => SURFACE_FRAME_MAX_BYTES,
  SURFACE_FRAME_MIMES: () => SURFACE_FRAME_MIMES,
  SURFACE_FRAME_PATH: () => SURFACE_FRAME_PATH,
  SURFACE_FRAME_SEQ_HEADER: () => SURFACE_FRAME_SEQ_HEADER,
  SURFACE_FRAME_WAIT_MS: () => SURFACE_FRAME_WAIT_MS,
  SURFACE_HEIGHT_HEADER: () => SURFACE_HEIGHT_HEADER,
  SURFACE_INPUT_BATCH_MAX: () => SURFACE_INPUT_BATCH_MAX,
  SURFACE_INPUT_PATH: () => SURFACE_INPUT_PATH,
  SURFACE_RESIZE_PATH: () => SURFACE_RESIZE_PATH,
  SURFACE_SEQ_HEADER: () => SURFACE_SEQ_HEADER,
  SURFACE_TEXT_MAX: () => SURFACE_TEXT_MAX,
  SURFACE_TITLE_HEADER: () => SURFACE_TITLE_HEADER,
  SURFACE_TITLE_MAX: () => SURFACE_TITLE_MAX,
  SURFACE_VIEWER_CONTROLS_HEADER: () => SURFACE_VIEWER_CONTROLS_HEADER,
  SURFACE_VIEWER_HEADER: () => SURFACE_VIEWER_HEADER,
  SURFACE_WIDTH_HEADER: () => SURFACE_WIDTH_HEADER,
  ServiceHostError: () => ServiceHostError,
  SourceControlForgeError: () => SourceControlForgeError,
  TRACKER_BASE_STATE_FILTERS: () => TRACKER_BASE_STATE_FILTERS,
  TRACKER_GUEST_ID_MAX: () => TRACKER_GUEST_ID_MAX,
  TRACKER_IDENTIFIER_KINDS: () => TRACKER_IDENTIFIER_KINDS,
  TRACKER_OUTBOUND_PATH: () => TRACKER_OUTBOUND_PATH,
  TRACKER_OUTBOUND_TIMEOUT_MS: () => TRACKER_OUTBOUND_TIMEOUT_MS,
  TRACKER_PROVIDER_AUTH_TIMEOUT_MS: () => TRACKER_PROVIDER_AUTH_TIMEOUT_MS,
  TRACKER_PROVIDER_CONTAINERS_MAX: () => TRACKER_PROVIDER_CONTAINERS_MAX,
  TRACKER_PROVIDER_ERROR_MESSAGE_MAX: () => TRACKER_PROVIDER_ERROR_MESSAGE_MAX,
  TRACKER_PROVIDER_IDLE_MS: () => TRACKER_PROVIDER_IDLE_MS,
  TRACKER_PROVIDER_LIST_MAX: () => TRACKER_PROVIDER_LIST_MAX,
  TRACKER_PROVIDER_LIVE_SUMMARIES_MAX: () => TRACKER_PROVIDER_LIVE_SUMMARIES_MAX,
  TRACKER_PROVIDER_METHODS: () => TRACKER_PROVIDER_METHODS,
  TRACKER_PROVIDER_PATH: () => TRACKER_PROVIDER_PATH,
  TRACKER_PROVIDER_READ_TIMEOUT_MS: () => TRACKER_PROVIDER_READ_TIMEOUT_MS,
  TRACKER_PROVIDER_RESPONSE_MAX: () => TRACKER_PROVIDER_RESPONSE_MAX,
  TRACKER_PROVIDER_WIRE_VERSION: () => TRACKER_PROVIDER_WIRE_VERSION,
  TRACKER_PROVIDER_WRITE_METHODS: () => TRACKER_PROVIDER_WRITE_METHODS,
  TRACKER_PROVIDER_WRITE_TIMEOUT_MS: () => TRACKER_PROVIDER_WRITE_TIMEOUT_MS,
  TRACKER_STATE_FILTERS_MAX: () => TRACKER_STATE_FILTERS_MAX,
  TRACKER_URL_TEMPLATES_MAX: () => TRACKER_URL_TEMPLATES_MAX,
  TRACKER_URL_TEMPLATE_MAX: () => TRACKER_URL_TEMPLATE_MAX,
  TRACKER_URL_TOKENS: () => TRACKER_URL_TOKENS,
  TrackerOutboundError: () => TrackerOutboundError,
  WAITS_CHECK_BATCH_MAX: () => WAITS_CHECK_BATCH_MAX,
  WAITS_CHECK_PATH: () => WAITS_CHECK_PATH,
  WAITS_START_PATH: () => WAITS_START_PATH,
  WAITS_WIRE_VERSION: () => WAITS_WIRE_VERSION,
  WAIT_CHECK_INTERVAL_DEFAULT: () => WAIT_CHECK_INTERVAL_DEFAULT,
  WAIT_CHECK_INTERVAL_MAX: () => WAIT_CHECK_INTERVAL_MAX,
  WAIT_CHECK_INTERVAL_MIN: () => WAIT_CHECK_INTERVAL_MIN,
  WAIT_ERROR_MAX: () => WAIT_ERROR_MAX,
  WAIT_LABEL_MAX: () => WAIT_LABEL_MAX,
  WAIT_REQUEST_TIMEOUT_MS: () => WAIT_REQUEST_TIMEOUT_MS,
  WAIT_STATE_MAX: () => WAIT_STATE_MAX,
  WAIT_SUMMARY_MAX: () => WAIT_SUMMARY_MAX,
  buildLinkUrl: () => buildLinkUrl,
  clampAttachRequest: () => clampAttachRequest,
  clampBadgeCount: () => clampBadgeCount,
  clampFrameHeight: () => clampFrameHeight,
  clampPromptRequest: () => clampPromptRequest,
  clampStartSessionRequest: () => clampStartSessionRequest,
  clampStatusSectionHeight: () => clampStatusSectionHeight,
  compareOpenChamberVersions: () => compareOpenChamberVersions,
  connectHost: () => connectHost,
  createFileSaveTracker: () => createFileSaveTracker,
  createNotificationsOutbound: () => createNotificationsOutbound,
  createServiceHost: () => createServiceHost,
  createSourceControlForge: () => createSourceControlForge,
  createTrackerOutbound: () => createTrackerOutbound,
  fileEditorPayloadSize: () => fileEditorPayloadSize,
  guestActionsNeedConversation: () => guestActionsNeedConversation,
  guestFileScope: () => guestFileScope,
  guestFramePolicy: () => guestFramePolicy,
  guestToolLinkSettingIds: () => guestToolLinkSettingIds,
  guestToolPlaceholderPattern: () => guestToolPlaceholderPattern,
  hasGuestCapability: () => hasGuestCapability,
  hasGuestPage: () => hasGuestPage,
  hostMeetsOpenChamberEngine: () => hostMeetsOpenChamberEngine,
  isAttachData: () => isAttachData,
  isBrowserControlAction: () => isBrowserControlAction,
  isBuildableLinkTemplate: () => isBuildableLinkTemplate,
  isFileEditorPattern: () => isFileEditorPattern,
  isFileListResult: () => isFileListResult,
  isFileReadResult: () => isFileReadResult,
  isFileStatResult: () => isFileStatResult,
  isFileWriteResult: () => isFileWriteResult,
  isGenerateResult: () => isGenerateResult,
  isGuestApproved: () => isGuestApproved,
  isGuestAttachItem: () => isGuestAttachItem,
  isGuestCommitSha: () => isGuestCommitSha,
  isGuestFilePath: () => isGuestFilePath,
  isGuestFilesystemPattern: () => isGuestFilesystemPattern,
  isGuestLinkItem: () => isGuestLinkItem,
  isGuestMessageItem: () => isGuestMessageItem,
  isGuestPackageSvgIcon: () => isGuestPackageSvgIcon,
  isGuestPopoverRequest: () => isGuestPopoverRequest,
  isGuestProviderLogoPath: () => isGuestProviderLogoPath,
  isGuestRequestPath: () => isGuestRequestPath,
  isGuestRequestResult: () => isGuestRequestResult,
  isGuestSessionEventType: () => isGuestSessionEventType,
  isGuestSessionItem: () => isGuestSessionItem,
  isHostRequestErrorCode: () => isHostRequestErrorCode,
  isJsonValue: () => isJsonValue,
  isNotificationsProviderMethod: () => isNotificationsProviderMethod,
  isOpenCodeProviderId: () => isOpenCodeProviderId,
  isPromptResult: () => isPromptResult,
  isQuotaProviderMethod: () => isQuotaProviderMethod,
  isServiceScheduleCron: () => isServiceScheduleCron,
  isServiceStatusResult: () => isServiceStatusResult,
  isSourceControlProviderMethod: () => isSourceControlProviderMethod,
  isStartSessionResult: () => isStartSessionResult,
  isTrackerProviderMethod: () => isTrackerProviderMethod,
  isTrackerProviderWriteMethod: () => isTrackerProviderWriteMethod,
  isTrackerUrlTemplate: () => isTrackerUrlTemplate,
  matchesFileEditorPattern: () => matchesFileEditorPattern,
  notificationProviderIdOf: () => notificationProviderIdOf,
  notificationsProviderTimeoutMs: () => notificationsProviderTimeoutMs,
  openChamberEngineMinimum: () => openChamberEngineMinimum,
  parseOpenChamberVersion: () => parseOpenChamberVersion,
  quotaProviderIdOf: () => quotaProviderIdOf,
  readBrowserProviderRequest: () => readBrowserProviderRequest,
  readHostMessage: () => readHostMessage,
  readNotificationsProviderRequest: () => readNotificationsProviderRequest,
  readQuotaProviderRequest: () => readQuotaProviderRequest,
  readServiceScheduleRequest: () => readServiceScheduleRequest,
  readSessionEventRequest: () => readSessionEventRequest,
  readSourceControlProviderRequest: () => readSourceControlProviderRequest,
  readSurfaceControlNotice: () => readSurfaceControlNotice,
  readSurfaceInputBatch: () => readSurfaceInputBatch,
  readSurfaceResizeRequest: () => readSurfaceResizeRequest,
  readTrackerProviderRequest: () => readTrackerProviderRequest,
  readWaitCheckRequest: () => readWaitCheckRequest,
  readWaitStartRequest: () => readWaitStartRequest,
  requestedGuestCapabilities: () => requestedGuestCapabilities,
  resolveAttachEntry: () => resolveAttachEntry,
  resolveAttachMode: () => resolveAttachMode,
  resolveHostRequestErrorCode: () => resolveHostRequestErrorCode,
  resolveIntegrationApi: () => resolveIntegrationApi,
  resolveIntegrationAuth: () => resolveIntegrationAuth,
  resolvePageEntry: () => resolvePageEntry,
  resolvePageMobile: () => resolvePageMobile,
  resolveStatusSectionEntry: () => resolveStatusSectionEntry,
  resolveStatusSectionSource: () => resolveStatusSectionSource,
  resolveWaitInterval: () => resolveWaitInterval,
  serviceProvides: () => serviceProvides,
  sourceControlProviderIdOf: () => sourceControlProviderIdOf,
  sourceControlProviderTimeoutMs: () => sourceControlProviderTimeoutMs,
  toPublicIntegration: () => toPublicIntegration,
  toPublicNotifications: () => toPublicNotifications,
  toPublicQuota: () => toPublicQuota,
  toPublicService: () => toPublicService,
  toPublicSessionEvents: () => toPublicSessionEvents,
  toPublicSourceControl: () => toPublicSourceControl,
  toPublicTracker: () => toPublicTracker,
  toPublicWaits: () => toPublicWaits,
  trackerProviderIdOf: () => trackerProviderIdOf,
  trackerProviderTimeoutMs: () => trackerProviderTimeoutMs
});
var init_dist = __esm({
  "node_modules/@openchamber/sdk/dist/index.js"() {
    init_api_version();
    init_scrollbar_style();
    init_frame_policy();
    init_workspace();
    init_shells();
    init_microphone();
    init_status_controls();
    init_status_view();
    init_host_version();
    init_manifest();
    init_session_events();
    init_service_host();
    init_waits();
    init_file_editor();
    init_host();
    init_popover();
    init_contract();
    init_contract();
    init_service_providers();
    init_service_surface();
  }
});

// service/src/main.js
var import_node_http = __toESM(require("node:http"), 1);

// service/src/config.js
var import_promises = require("node:fs/promises");
var import_node_path = require("node:path");
function configPath(env) {
  const dir = env.OPENCHAMBER_SERVICE_DATA_DIR || (0, import_node_path.join)(process.cwd(), ".plane-data");
  return (0, import_node_path.join)(dir, "config.json");
}
async function loadConfig(env) {
  try {
    const raw = await (0, import_promises.readFile)(configPath(env), "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
async function saveConfig(env, cfg) {
  const file = configPath(env);
  await (0, import_promises.mkdir)((0, import_node_path.dirname)(file), { recursive: true });
  await (0, import_promises.writeFile)(file, JSON.stringify(cfg, null, 2) + "\n", { mode: 384 });
  await (0, import_promises.chmod)(file, 384);
  return cfg;
}
function maskConfig(cfg) {
  if (!cfg) return { configured: false, baseUrl: "", workspace: "", apiVersion: "v2", hasKey: false };
  const baseUrl = String(cfg.baseUrl || "");
  const workspace = String(cfg.workspace || "");
  const hasKey = Boolean(cfg.apiKey);
  return {
    configured: Boolean(baseUrl && hasKey && workspace),
    baseUrl,
    workspace,
    apiVersion: String(cfg.apiVersion || "v2"),
    hasKey
  };
}

// service/src/plane.js
var PlaneError = class extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "PlaneError";
    this.code = code;
    this.status = status;
  }
};
function normalizeConfig(raw) {
  const cfg = raw || {};
  const baseUrl = String(cfg.baseUrl || "").trim().replace(/\/+$/, "");
  const apiKey = String(cfg.apiKey || "").trim();
  const workspace = String(cfg.workspace || "").trim();
  const apiVersion = String(cfg.apiVersion || "").trim().toLowerCase() === "v1" ? "v1" : "v2";
  const missing = [];
  if (!baseUrl) missing.push("baseUrl");
  if (!apiKey) missing.push("apiKey");
  if (!workspace) missing.push("workspace");
  if (baseUrl && !/^https?:\/\//i.test(baseUrl)) {
    throw new PlaneError("BAD_CONFIG", "\u5730\u5740\u8981\u4EE5 http:// \u6216 https:// \u5F00\u5934");
  }
  if (baseUrl && /\/api(\/v\d)?$/i.test(baseUrl)) {
    throw new PlaneError("BAD_CONFIG", "\u5730\u5740\u4E0D\u8981\u5E26 /api \u6216 /api/v1\uFF0C\u586B\u5230\u7AEF\u53E3\u4E3A\u6B62\uFF08\u4F8B\u5982 http://192.168.1.188:8080\uFF09");
  }
  return { baseUrl, apiKey, workspace, apiVersion, missing };
}
function apiBase(cfg) {
  return `${cfg.baseUrl}${cfg.apiVersion === "v1" ? "/api/v1" : "/api/v2"}`;
}
function workItemsSegment(cfg) {
  return cfg.apiVersion === "v1" ? "issues" : "work-items";
}
function errorForStatus(status, detail) {
  if (status === 401 || status === 403) return new PlaneError("AUTH_FAILED", "API Key \u65E0\u6548\u6216\u6CA1\u6709\u6743\u9650\uFF08401/403\uFF09", status);
  if (status === 404) return new PlaneError("NOT_FOUND", "\u7AEF\u70B9\u6216\u8D44\u6E90\u4E0D\u5B58\u5728\uFF08404\uFF09\uFF0C\u5730\u5740\u6216 API \u7248\u672C\u53EF\u80FD\u4E0D\u5BF9", 404);
  if (status === 429) return new PlaneError("RATE_LIMITED", "\u88AB Plane \u9650\u6D41\uFF08429\uFF09", 429);
  if (status >= 500) return new PlaneError("NETWORK", `Plane \u8FD4\u56DE ${status}`, status);
  return new PlaneError("NOT_FOUND", `Plane \u8FD4\u56DE ${status}${detail ? "\uFF1A" + detail.slice(0, 160) : ""}`, status);
}
async function request(cfg, path, { method = "GET", body, fetchImpl = fetch, retry = true } = {}) {
  const url = `${apiBase(cfg)}${path}`;
  const once = async () => {
    let res;
    try {
      res = await fetchImpl(url, {
        method,
        headers: {
          "X-Api-Key": cfg.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: body ? JSON.stringify(body) : void 0
      });
    } catch (e) {
      throw new PlaneError("NETWORK", `\u8FDE\u4E0D\u4E0A Plane\uFF08${cfg.baseUrl}\uFF09\uFF1A${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw errorForStatus(res.status, detail);
    }
    try {
      return await res.json();
    } catch {
      throw new PlaneError("NETWORK", "Plane \u8FD4\u56DE\u7684\u4E0D\u662F JSON");
    }
  };
  try {
    return await once();
  } catch (e) {
    const retryable = e instanceof PlaneError && (e.code === "NETWORK" || e.code === "RATE_LIMITED");
    if (!retry || !retryable) throw e;
    await new Promise((r) => setTimeout(r, 200));
    return await once();
  }
}
async function listProjects(cfg, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${encodeURIComponent(cfg.workspace)}/projects/`, { fetchImpl });
  const rows = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return rows.map((r) => ({
    id: String(r.uuid ?? r.id ?? ""),
    name: String(r.name ?? ""),
    identifier: String(r.identifier ?? "")
  }));
}
function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}
function mapItem(raw) {
  const labels = Array.isArray(raw?.labels) ? raw.labels : [];
  const assignees = Array.isArray(raw?.assignees) ? raw.assignees : [];
  return {
    id: String(raw?.uuid ?? raw?.id ?? ""),
    identifier: String(raw?.identifier ?? raw?.sequence_id ?? ""),
    name: String(raw?.name ?? ""),
    stateId: String(raw?.state ?? ""),
    priority: raw?.priority != null ? String(raw.priority) : null,
    assignees: assignees.map((a) => ({
      id: String(a?.uuid ?? a?.id ?? ""),
      name: String(a?.display_name ?? a?.name ?? "")
    })),
    labels: labels.map((l) => typeof l === "string" ? l : String(l?.id ?? "")).filter(Boolean)
  };
}
var seg = (v) => encodeURIComponent(v);
async function listStates(cfg, projectId, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/states/`, { fetchImpl });
  return unwrap(data).map((r) => ({
    id: String(r.uuid ?? r.id ?? ""),
    name: String(r.name ?? ""),
    color: r.color ? String(r.color) : null,
    order: Number(r.sequence ?? 0)
  })).sort((a, b) => a.order - b.order);
}
async function listWorkItems(cfg, projectId, stateId, fetchImpl = fetch) {
  const qs = stateId ? `?state=${seg(stateId)}` : "";
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${qs}`,
    { fetchImpl }
  );
  return unwrap(data).map(mapItem);
}
async function patchState(cfg, projectId, workItemId, stateId, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { method: "PATCH", body: { state: stateId }, fetchImpl }
  );
  return mapItem(data);
}
function htmlToText(html) {
  if (!html) return "";
  return String(html).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n").replace(/<li[^>]*>/gi, "- ").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
}
async function getWorkItem(cfg, projectId, workItemId, fetchImpl = fetch) {
  const raw = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { fetchImpl }
  );
  return { item: mapItem(raw), description: htmlToText(raw?.description_html ?? raw?.description ?? "") };
}
async function listLabels(cfg, projectId, fetchImpl = fetch) {
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/labels/`, { fetchImpl });
  return unwrap(data).map((r) => ({ id: String(r.uuid ?? r.id ?? ""), name: String(r.name ?? "") }));
}
async function ensureLabel(cfg, projectId, name, fetchImpl = fetch) {
  const found = (await listLabels(cfg, projectId, fetchImpl)).find(
    (l) => l.name.toLowerCase() === String(name).toLowerCase()
  );
  if (found) return found;
  const data = await request(cfg, `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/labels/`, {
    method: "POST",
    body: { name, color: "#a78bfa" },
    fetchImpl
  });
  return { id: String(data?.uuid ?? data?.id ?? ""), name: String(data?.name ?? name) };
}
async function patchWorkItem(cfg, projectId, workItemId, patch, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/`,
    { method: "PATCH", body: patch, fetchImpl }
  );
  return mapItem(data);
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
function textToCommentHtml(text, { sessionId } = {}) {
  const body = String(text || "").trim().split(/\n{2,}/).map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`).join("");
  const head = sessionId ? `<p><em>\uFF08\u6765\u81EA OpenChamber \u4F1A\u8BDD <code>${escapeHtml(sessionId)}</code>\uFF09</em></p>` : "";
  return head + body;
}
async function addComment(cfg, projectId, workItemId, text, { sessionId } = {}, fetchImpl = fetch) {
  const data = await request(
    cfg,
    `/workspaces/${seg(cfg.workspace)}/projects/${seg(projectId)}/${workItemsSegment(cfg)}/${seg(workItemId)}/comments/`,
    { method: "POST", body: { comment_html: textToCommentHtml(text, { sessionId }) }, fetchImpl }
  );
  return {
    id: String(data?.uuid ?? data?.id ?? ""),
    createdAt: data?.created_at ? String(data.created_at) : (/* @__PURE__ */ new Date()).toISOString()
  };
}

// service/src/session.js
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");
var import_node_path2 = require("node:path");
var exec = (0, import_node_util.promisify)(import_node_child_process.execFile);
async function createHost(env) {
  const { createServiceHost: createServiceHost2 } = await Promise.resolve().then(() => (init_dist(), dist_exports));
  return createServiceHost2({ env });
}
async function createWorktree({ directory, name, baseBranch }) {
  if (!directory) throw Object.assign(new Error("\u8981\u5EFA worktree \u5C31\u5F97\u77E5\u9053\u4ED3\u5E93\u76EE\u5F55"), { code: "BAD_CONFIG" });
  const safe = String(name || "").trim().replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safe) throw Object.assign(new Error("worktree \u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"), { code: "BAD_CONFIG" });
  const target = (0, import_node_path2.join)(directory, ".worktrees", safe);
  const branch = `oc/${safe}`;
  const args = ["worktree", "add", "-B", branch, target];
  if (baseBranch) args.push(baseBranch);
  try {
    await exec("git", args, { cwd: directory, timeout: 6e4 });
  } catch (e) {
    const detail = (e.stderr || e.message || "").toString().split("\n")[0];
    throw Object.assign(new Error(`\u5EFA worktree \u5931\u8D25\uFF1A${detail}`), { code: "WORKTREE_FAILED" });
  }
  return { directory: target, branch };
}
async function startSession(env, input) {
  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw Object.assign(new Error("prompt \u4E0D\u80FD\u4E3A\u7A7A"), { code: "BAD_CONFIG" });
  let directory = input.directory || void 0;
  let worktree = null;
  if (input.worktree && (input.worktree.name || input.worktree.create)) {
    worktree = await createWorktree({
      directory: input.directory,
      name: input.worktree.name || input.workItemIdentifier || "task",
      baseBranch: input.worktree.baseBranch || void 0
    });
    directory = worktree.directory;
  }
  const host = await createHost(env);
  const started = await host.sessions.start({
    prompt,
    ...directory ? { directory } : { projectId: input.projectId },
    ...input.title ? { title: input.title } : {},
    ...input.model ? { model: input.model } : {},
    ...input.variant && input.variant !== "default" ? { variant: input.variant } : {},
    ...input.agent ? { agent: input.agent } : {}
  });
  return { sessionId: started.sessionId, directory: started.directory ?? directory ?? null, worktree };
}

// service/src/main.js
var PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
var TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || "";
if (!PORT || !TOKEN) {
  console.error("[plane] \u7F3A\u5C11 OPENCHAMBER_SERVICE_PORT / OPENCHAMBER_SERVICE_TOKEN\uFF0C\u65E0\u6CD5\u542F\u52A8");
  process.exit(1);
}
var STATUS_FOR_CODE = {
  CONFIG_MISSING: 400,
  BAD_CONFIG: 400,
  AUTH_FAILED: 401,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  NETWORK: 502
};
function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function sendError(res, err) {
  const code = err instanceof PlaneError ? err.code : "INTERNAL";
  const message = err instanceof Error ? err.message : String(err);
  const status = STATUS_FOR_CODE[code] ?? 500;
  if (code === "INTERNAL") console.error("[plane] \u5185\u90E8\u9519\u8BEF:", err);
  sendJson(res, status, { ok: false, error: { code, message } });
}
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) throw new PlaneError("BAD_CONFIG", "\u8BF7\u6C42\u4F53\u592A\u5927");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new PlaneError("BAD_CONFIG", "\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5 JSON");
  }
}
function requireConfig(saved) {
  const cfg = normalizeConfig(saved || {});
  if (cfg.missing.length) {
    const err = new PlaneError("CONFIG_MISSING", `\u8FD8\u7F3A\uFF1A${cfg.missing.join("\u3001")}`);
    err.missing = cfg.missing;
    throw err;
  }
  return cfg;
}
var server = import_node_http.default.createServer(async (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    sendJson(res, 401, { ok: false, error: { code: "UNAUTHORIZED", message: "\u7F3A\u5C11\u6216\u9519\u8BEF\u7684 service token" } });
    return;
  }
  const path = (req.url || "").split("?")[0];
  try {
    if (req.method === "GET" && path === "/health") {
      sendJson(res, 200, { ok: true, service: "plane", version: "0.5.0" });
      return;
    }
    if (req.method === "GET" && path === "/config") {
      sendJson(res, 200, { ok: true, config: maskConfig(await loadConfig(process.env)) });
      return;
    }
    if (req.method === "POST" && path === "/config") {
      const body = await readBody(req);
      const cfg = normalizeConfig(body);
      await saveConfig(process.env, {
        baseUrl: cfg.baseUrl,
        apiKey: cfg.apiKey,
        workspace: cfg.workspace,
        apiVersion: cfg.apiVersion
      });
      sendJson(res, 200, { ok: true, config: maskConfig(await loadConfig(process.env)) });
      return;
    }
    if (req.method === "POST" && path === "/projects") {
      const cfg = requireConfig(await loadConfig(process.env));
      const projects = await listProjects(cfg);
      sendJson(res, 200, { ok: true, projects });
      return;
    }
    if (req.method === "POST" && path === "/states") {
      const body = await readBody(req);
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "\u7F3A\u5C11 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const states = await listStates(cfg, body.projectId);
      sendJson(res, 200, { ok: true, states });
      return;
    }
    if (req.method === "POST" && path === "/work-items") {
      const body = await readBody(req);
      if (!body.projectId) throw new PlaneError("BAD_CONFIG", "\u7F3A\u5C11 projectId");
      const cfg = requireConfig(await loadConfig(process.env));
      const items = await listWorkItems(cfg, body.projectId, body.stateId);
      sendJson(res, 200, { ok: true, items });
      return;
    }
    if (req.method === "POST" && path === "/work-item") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId) throw new PlaneError("BAD_CONFIG", "work-item \u9700\u8981 projectId / workItemId");
      const cfg = requireConfig(await loadConfig(process.env));
      const got = await getWorkItem(cfg, body.projectId, body.workItemId);
      sendJson(res, 200, { ok: true, ...got });
      return;
    }
    if (req.method === "POST" && path === "/patch-state") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !body.stateId) {
        throw new PlaneError("BAD_CONFIG", "patch-state \u9700\u8981 projectId / workItemId / stateId");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const item = await patchState(cfg, body.projectId, body.workItemId, body.stateId);
      sendJson(res, 200, { ok: true, item });
      return;
    }
    if (req.method === "POST" && path === "/comment") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !String(body.body || "").trim()) {
        throw new PlaneError("BAD_CONFIG", "comment \u9700\u8981 projectId / workItemId / body");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const comment = await addComment(cfg, body.projectId, body.workItemId, body.body, { sessionId: body.sessionId });
      sendJson(res, 200, { ok: true, comment });
      return;
    }
    if (req.method === "POST" && path === "/session-start") {
      const body = await readBody(req);
      const out = await startSession(process.env, body);
      sendJson(res, 200, { ok: true, ...out });
      return;
    }
    if (req.method === "POST" && path === "/bind-session") {
      const body = await readBody(req);
      if (!body.projectId || !body.workItemId || !body.sessionId) {
        throw new PlaneError("BAD_CONFIG", "bind-session \u9700\u8981 projectId / workItemId / sessionId");
      }
      const cfg = requireConfig(await loadConfig(process.env));
      const label = await ensureLabel(cfg, body.projectId, `oc-${body.sessionId}`);
      const current = await getWorkItem(cfg, body.projectId, body.workItemId);
      const labels = Array.from(/* @__PURE__ */ new Set([...current.item.labels || [], label.id]));
      const patch = { labels };
      if (body.stateId) patch.state = body.stateId;
      const item = await patchWorkItem(cfg, body.projectId, body.workItemId, patch);
      sendJson(res, 200, { ok: true, item, label });
      return;
    }
    sendJson(res, 404, { ok: false, error: { code: "NOT_FOUND", message: `\u6CA1\u6709\u8FD9\u4E2A\u8DEF\u7531\uFF1A${req.method} ${path}` } });
  } catch (e) {
    if (e instanceof PlaneError && e.missing) {
      sendJson(res, 400, { ok: false, error: { code: e.code, message: e.message, missing: e.missing } });
      return;
    }
    sendError(res, e);
  }
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
