import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
} from "../server/plane-webhook";

const SECRET = "plane_wh_testsecret";

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
}

// --- verifyWebhookSignature ---
{
  const body = JSON.stringify({ event: "workitem.updated", entity_id: "wi-1" });
  const sig = sign(body);
  assert.equal(verifyWebhookSignature(SECRET, body, sig), true);
  console.log("✓ verifyWebhookSignature: valid signature accepted");
}

{
  const body = JSON.stringify({ event: "workitem.updated" });
  const wrongSecret = createHmac("sha256", "plane_wh_wrong")
    .update(body, "utf8")
    .digest("hex");
  assert.equal(verifyWebhookSignature(SECRET, body, wrongSecret), false);
  console.log("✓ verifyWebhookSignature: wrong secret rejected");
}

{
  const body = "{}";
  assert.equal(verifyWebhookSignature("", body, sign(body)), false);
  assert.equal(verifyWebhookSignature(SECRET, body, ""), false);
  console.log("✓ verifyWebhookSignature: empty secret or signature rejected");
}

{
  // 篡改 body 后签名失效
  const body = JSON.stringify({ event: "workitem.updated", entity_id: "wi-1" });
  const tampered = JSON.stringify({ event: "workitem.updated", entity_id: "wi-2" });
  assert.equal(verifyWebhookSignature(SECRET, tampered, sign(body)), false);
  console.log("✓ verifyWebhookSignature: tampered body rejected");
}

// --- parseWebhookPayload ---
{
  const body = JSON.stringify({
    version: "v2",
    event: "workitem.updated",
    entity_id: "wi-9",
    workspace_id: "ws-1",
    data: { id: "wi-9", state: "st-2", labels: ["lbl-1"] },
    previous_attributes: { state: "st-1" },
  });
  const event = parseWebhookPayload(body);
  assert.ok(event);
  assert.equal(event!.event, "workitem.updated");
  assert.equal(event!.entityId, "wi-9");
  assert.equal(event!.workspaceId, "ws-1");
  assert.equal(event!.data.state, "st-2");
  console.log("✓ parseWebhookPayload: v2 payload parsed");
}

{
  assert.equal(parseWebhookPayload("not json"), null);
  assert.equal(parseWebhookPayload(JSON.stringify({ nope: true })), null);
  assert.equal(
    parseWebhookPayload(JSON.stringify({ event: "x", entity_id: "" })),
    null,
  );
  console.log("✓ parseWebhookPayload: invalid payloads return null");
}

console.log("\nAll webhook tests passed.");
