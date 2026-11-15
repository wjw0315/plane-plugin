import assert from "node:assert/strict";
import {
  listStates,
  listWorkItems,
  patchState,
  listLabels,
  ensureLabel,
  createWorkItem,
  getWorkItem,
  resolveStateForPhase,
  resolveSessionAgentId,
  PlaneApiError,
} from "../server/plane-api";
import type { PlaneConfig } from "../shared/plane-settings";

const CONFIG: PlaneConfig = {
  baseUrl: "https://plane.example.com",
  apiKey: "test-key-123",
  workspace: "acme",
  apiVersion: "v2",
  webhookEnabled: false,
  webhookSecret: "",
  webhookPort: 8788,
};

interface FetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

let calls: FetchCall[] = [];
let mockResponse:
  | { status: number; body: unknown }
  | ((call: FetchCall) => { status: number; body: unknown })
  | null = null;

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
  const call: FetchCall = {
    url: String(url),
    method: init.method ?? "GET",
    headers: (init.headers ?? {}) as Record<string, string>,
    body: init.body ? String(init.body) : null,
  };
  calls.push(call);
  if (!mockResponse) throw new Error("No mock response configured");
  const resp = typeof mockResponse === "function" ? mockResponse(call) : mockResponse;
  return new Response(
    resp.body ? JSON.stringify(resp.body) : "",
    { status: resp.status, headers: { "Content-Type": "application/json" } },
  );
}) as typeof fetch;

function reset() {
  calls = [];
  mockResponse = null;
}

(async () => {
  // --- listStates ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: {
        results: [
          { uuid: "st-1", name: "Backlog", color: "#8b8b8b" },
          { uuid: "st-2", name: "In Progress", color: "#3b82f6" },
          { id: "st-3", name: "Done", color: null },
        ],
      },
    };

    const states = await listStates(CONFIG, "proj-42");

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://plane.example.com/api/v2/workspaces/acme/projects/proj-42/states/");
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[0].headers["X-Api-Key"], "test-key-123");
    assert.equal(states.length, 3);
    assert.equal(states[0].id, "st-1");
    assert.equal(states[0].name, "Backlog");
    assert.equal(states[0].color, "#8b8b8b");
    assert.equal(states[2].color, null);
    console.log("✓ listStates: URL, X-Api-Key, response parsing");
  }

  // --- listWorkItems (with state filter) ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: {
        results: [
          { uuid: "wi-1", identifier: "APP-1", name: "Fix login bug", state: "st-2", priority: "high" },
          { uuid: "wi-2", identifier: "APP-2", name: "Update docs", state: "st-1", priority: null },
        ],
      },
    };

    const items = await listWorkItems(CONFIG, "proj-42", "st-2");

    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.includes("state=st-2"));
    assert.equal(items.length, 2);
    assert.equal(items[0].id, "wi-1");
    assert.equal(items[0].identifier, "APP-1");
    assert.equal(items[0].stateId, "st-2");
    assert.equal(items[1].priority, null);
    console.log("✓ listWorkItems: state filter, response parsing");
  }

  // --- listWorkItems (no state filter) ---
  {
    reset();
    mockResponse = { status: 200, body: { results: [] } };

    const items = await listWorkItems(CONFIG, "proj-42");

    assert.equal(calls.length, 1);
    assert.ok(!calls[0].url.includes("state="));
    assert.equal(items.length, 0);
    console.log("✓ listWorkItems: no state filter, empty results");
  }

  // --- patchState ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: {
        uuid: "wi-1",
        identifier: "APP-1",
        name: "Fix login bug",
        state: "st-3",
        priority: "medium",
      },
    };

    const item = await patchState(CONFIG, "proj-42", "wi-1", "st-3");

    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://plane.example.com/api/v2/workspaces/acme/projects/proj-42/work-items/wi-1/");
    assert.equal(calls[0].method, "PATCH");
    assert.equal(calls[0].headers["X-Api-Key"], "test-key-123");
    assert.equal(calls[0].body, JSON.stringify({ state: "st-3" }));
    assert.equal(item.id, "wi-1");
    assert.equal(item.stateId, "st-3");
    console.log("✓ patchState: PATCH method, body contains state, response parsing");
  }

  // --- Error: 401 ---
  {
    reset();
    mockResponse = { status: 401, body: { detail: "Authentication credentials were not provided." } };

    await assert.rejects(
      () => listStates(CONFIG, "proj-42"),
      (err: unknown) => err instanceof PlaneApiError && err.statusCode === 401,
    );
    console.log("✓ error 401: PlaneApiError thrown with statusCode 401");
  }

  // --- Error: 404 ---
  {
    reset();
    mockResponse = { status: 404, body: { detail: "Not found." } };

    await assert.rejects(
      () => listWorkItems(CONFIG, "proj-42"),
      (err: unknown) => err instanceof PlaneApiError && err.statusCode === 404,
    );
    console.log("✓ error 404: PlaneApiError thrown with statusCode 404");
  }

  // --- Error: network failure ---
  {
    reset();
    mockResponse = null;

    await assert.rejects(
      () => patchState(CONFIG, "proj-42", "wi-1", "st-3"),
      (err: unknown) => err instanceof PlaneApiError && err.statusCode === 0,
    );
    console.log("✓ error network: PlaneApiError thrown with statusCode 0");
  }

  // --- listLabels ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: { results: [{ uuid: "lbl-1", name: "paseo-abc" }, { uuid: "lbl-2", name: "其他" }] },
    };

    const labels = await listLabels(CONFIG);

    assert.equal(calls.length, 1);
    const probeUrl: string = calls[0].url;
    assert.ok(probeUrl.includes("/workspaces/acme/labels/"));
    assert.equal(labels.length, 2);    assert.equal(labels[0].id, "lbl-1");
    console.log("✓ listLabels: URL and response parsing");
  }

  // --- ensureLabel: 已有标签直接复用 ---
  {
    reset();
    mockResponse = { status: 200, body: { results: [{ uuid: "lbl-1", name: "paseo-abc" }] } };

    const label = await ensureLabel(CONFIG, "paseo-abc");

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "GET");
    assert.equal(label.id, "lbl-1");
    console.log("✓ ensureLabel: existing label reused without POST");
  }

  // --- ensureLabel: 不存在则创建 ---
  {
    reset();
    mockResponse = (call) =>
      call.method === "GET"
        ? { status: 200, body: { results: [] } }
        : { status: 201, body: { uuid: "lbl-2", name: "paseo-xyz" } };

    const label = await ensureLabel(CONFIG, "paseo-xyz");

    assert.equal(calls.length, 2);
    assert.equal(calls[0].method, "GET");
    assert.equal(calls[1].method, "POST");
    assert.ok(calls[1].url.endsWith("/labels/"));
    assert.equal(calls[1].body, JSON.stringify({ name: "paseo-xyz", color: "#3b82f6" }));
    assert.equal(label.id, "lbl-2");
    console.log("✓ ensureLabel: creates missing label with POST");
  }

  // --- createWorkItem ---
  {
    reset();
    mockResponse = {
      status: 201,
      body: {
        uuid: "wi-9",
        identifier: "APP-9",
        name: "Session X",
        state: "st-1",
        priority: null,
        assignees: [],
      },
    };

    const item = await createWorkItem(CONFIG, "proj-1", "Session X", "st-1", ["lbl-1"]);

    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "POST");
    const postUrl: string = calls[0].url;
    assert.ok(postUrl.includes("/work-items/"));
    assert.equal(
      calls[0].body,
      JSON.stringify({ name: "Session X", state: "st-1", labels: ["lbl-1"] }),
    );
    assert.equal(item.id, "wi-9");
    assert.equal(item.stateId, "st-1");
    console.log("✓ createWorkItem: POST body carries name/state/labels");
  }

  // --- resolveStateForPhase ---
  {
    const states = [
      { id: "a", name: "Backlog", color: null },
      { id: "b", name: "In Progress", color: null },
      { id: "c", name: "Done", color: null },
    ];
    assert.equal(resolveStateForPhase(states, "backlog"), "a");
    assert.equal(resolveStateForPhase(states, "in_progress"), "b");
    assert.equal(resolveStateForPhase(states, "done"), "c");
    assert.equal(
      resolveStateForPhase([{ id: "x", name: "Nope", color: null }], "done"),
      null,
    );
    console.log("✓ resolveStateForPhase: alias matching and miss returns null");
  }

  // --- resolveSessionAgentId: 标签名反查会话 id ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: { results: [{ uuid: "lbl-1", name: "paseo-abc123" }, { uuid: "lbl-2", name: "其他" }] },
    };
    const agentId = await resolveSessionAgentId(CONFIG, ["lbl-1"]);
    assert.equal(agentId, "abc123");

    reset();
    mockResponse = {
      status: 200,
      body: { results: [{ uuid: "lbl-1", name: "其他" }] },
    };
    const miss = await resolveSessionAgentId(CONFIG, ["lbl-1"]);
    assert.equal(miss, null);

    reset();
    const empty = await resolveSessionAgentId(CONFIG, []);
    assert.equal(empty, null);
    console.log("✓ resolveSessionAgentId: matches paseo-<id>, miss and empty return null");
  }

  // --- getWorkItem: GET 单条含 labels ---
  {
    reset();
    mockResponse = {
      status: 200,
      body: {
        uuid: "wi-7",
        identifier: "APP-7",
        name: "S",
        state: "st-1",
        priority: null,
        assignees: [],
        labels: ["lbl-1", "lbl-2"],
      },
    };
    const item = await getWorkItem(CONFIG, "proj-1", "wi-7");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "GET");
    const itemUrl: string = calls[0].url;
    assert.ok(itemUrl.includes("/work-items/wi-7/"));
    assert.deepEqual(item.labels, ["lbl-1", "lbl-2"]);
    console.log("✓ getWorkItem: GET single work item with labels");
  }

  globalThis.fetch = originalFetch;
  console.log("\nAll tests passed.");
})();
