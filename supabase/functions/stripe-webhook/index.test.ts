// Tests for stripe-webhook event parsing & routing.
//
// Strategy:
//  - Spin up a local HTTP stub that impersonates Supabase REST so the handler's
//    `createClient(...).from("invoices").update(...)` calls hit our stub and we
//    can assert which rows were targeted.
//  - Use the real Stripe SDK to compute valid signatures for synthetic events,
//    so `constructEventAsync` succeeds without contacting Stripe.
//  - Import the handler module dynamically AFTER env vars are set so
//    `Deno.serve` registers with our test fetch entrypoint.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const WEBHOOK_SECRET = "whsec_test_secret";
const STRIPE_KEY = "sk_test_dummy";

// ---------- Supabase stub ----------

type StubCall = {
  method: string;
  url: string;
  body: string;
};

async function startSupabaseStub(): Promise<{ url: string; calls: StubCall[]; stop: () => Promise<void> }> {
  const calls: StubCall[] = [];
  const handler = async (req: Request): Promise<Response> => {
    const body = await req.text();
    calls.push({ method: req.method, url: req.url, body });
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  let stopped = false;

  (async () => {
    for await (const conn of listener) {
      (async () => {
        try {
          // @ts-ignore - Deno.serveHttp is still available
          const httpConn = Deno.serveHttp(conn);
          for await (const requestEvent of httpConn) {
            const res = await handler(requestEvent.request);
            await requestEvent.respondWith(res);
          }
        } catch {
          // connection closed
        }
      })();
    }
  })().catch(() => {});

  return {
    url: `http://127.0.0.1:${port}`,
    calls,
    stop: async () => {
      if (stopped) return;
      stopped = true;
      try { listener.close(); } catch { /* already closed */ }
    },
  };
}

// ---------- Helpers ----------

// Construct a Stripe-compatible signature header using WebCrypto.
// Stripe's bundled `generateTestHeaderString` uses a sync API not available
// under Deno's SubtleCrypto, so we sign manually with HMAC-SHA256.
async function buildStripeSignature(payload: string, secret: string, timestamp: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `t=${timestamp},v1=${hex}`;
}

async function signedRequest(handler: (req: Request) => Response | Promise<Response>, event: unknown) {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await buildStripeSignature(payload, WEBHOOK_SECRET, timestamp);
  return await handler(
    new Request("http://localhost/stripe-webhook", {
      method: "POST",
      headers: {
        "stripe-signature": signature,
        "Content-Type": "application/json",
      },
      body: payload,
    }),
  );
}

// Capture the registered handler instead of binding a real port.
let registeredHandler: ((req: Request) => Response | Promise<Response>) | null = null;
const originalServe = Deno.serve;
// @ts-ignore - override for testing
Deno.serve = ((handler: (req: Request) => Response | Promise<Response>) => {
  registeredHandler = handler;
  return {
    finished: Promise.resolve(),
    shutdown: async () => {},
    ref: () => {},
    unref: () => {},
    addr: { transport: "tcp", hostname: "127.0.0.1", port: 0 },
  } as unknown as ReturnType<typeof Deno.serve>;
}) as typeof Deno.serve;

// ---------- Boot ----------

const stub = await startSupabaseStub();
Deno.env.set("STRIPE_SECRET_KEY", STRIPE_KEY);
Deno.env.set("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
Deno.env.set("SUPABASE_URL", stub.url);
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service_role_dummy");

await import("./index.ts");
// Restore Deno.serve so other code is unaffected.
// @ts-ignore - restore
Deno.serve = originalServe;

if (!registeredHandler) throw new Error("Handler did not register with Deno.serve");
const handler: (req: Request) => Response | Promise<Response> = registeredHandler;

function clearCalls() {
  stub.calls.length = 0;
}

// ---------- Tests ----------

Deno.test({ name: "rejects requests with no stripe-signature header", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const res = await handler(
    new Request("http://localhost/stripe-webhook", {
      method: "POST",
      body: "{}",
    }),
  );
  await res.text();
  assertEquals(res.status, 400);
});

Deno.test({ name: "rejects requests with an invalid signature", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const res = await handler(
    new Request("http://localhost/stripe-webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "t=1,v1=deadbeef",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: "evt_x", type: "invoice.paid" }),
    }),
  );
  await res.text();
  assertEquals(res.status, 400);
});

Deno.test({ name: "CORS preflight returns 200", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const res = await handler(
    new Request("http://localhost/stripe-webhook", { method: "OPTIONS" }),
  );
  await res.text();
  assertEquals(res.status, 200);
});

Deno.test({ name: "invoice.paid with metadata.invoice_id updates by internal id", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_invoice_paid",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "invoice.paid",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: "in_test_123",
        object: "invoice",
        metadata: { invoice_id: "internal-uuid-1" },
      },
    },
  };
  const res = await signedRequest(handler, event);
  const text = await res.text();
  assertEquals(res.status, 200);
  assertEquals(JSON.parse(text), { received: true });

  const updates = stub.calls.filter((c) => c.method === "PATCH");
  assertEquals(updates.length, 1);
  // Filter is by internal id, NOT stripe_invoice_id
  if (!updates[0].url.includes("id=eq.internal-uuid-1")) {
    throw new Error(`Expected filter by internal id, got: ${updates[0].url}`);
  }
  const body = JSON.parse(updates[0].body);
  assertEquals(body.status, "paid");
  if (!body.paid_at) throw new Error("paid_at missing from update");
});

Deno.test({ name: "invoice.payment_succeeded without metadata falls back to stripe_invoice_id", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_invoice_succ",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "invoice.payment_succeeded",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: { id: "in_test_456", object: "invoice", metadata: {} },
    },
  };
  const res = await signedRequest(handler, event);
  await res.text();
  assertEquals(res.status, 200);

  const updates = stub.calls.filter((c) => c.method === "PATCH");
  assertEquals(updates.length, 1);
  if (!updates[0].url.includes("stripe_invoice_id=eq.in_test_456")) {
    throw new Error(`Expected fallback filter by stripe_invoice_id, got: ${updates[0].url}`);
  }
});

Deno.test({ name: "payment_intent.succeeded with invoice_id updates invoice", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_pi_succ",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "payment_intent.succeeded",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: "pi_test_789",
        object: "payment_intent",
        metadata: { invoice_id: "internal-uuid-2" },
      },
    },
  };
  const res = await signedRequest(handler, event);
  await res.text();
  assertEquals(res.status, 200);

  const updates = stub.calls.filter((c) => c.method === "PATCH");
  assertEquals(updates.length, 1);
  const body = JSON.parse(updates[0].body);
  assertEquals(body.status, "paid");
  assertEquals(body.stripe_invoice_id, "pi_test_789");
  if (!updates[0].url.includes("id=eq.internal-uuid-2")) {
    throw new Error(`Expected filter by internal id, got: ${updates[0].url}`);
  }
  // Idempotency guard: status must not already be paid
  if (!updates[0].url.includes("status=neq.paid")) {
    throw new Error(`Expected status=neq.paid guard, got: ${updates[0].url}`);
  }
});

Deno.test({ name: "payment_intent.succeeded without invoice_id metadata is a no-op", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_pi_no_meta",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "payment_intent.succeeded",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: { id: "pi_no_meta", object: "payment_intent", metadata: {} },
    },
  };
  const res = await signedRequest(handler, event);
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(stub.calls.filter((c) => c.method === "PATCH").length, 0);
});

Deno.test({ name: "invoice.payment_failed marks invoice overdue", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_invoice_failed",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "invoice.payment_failed",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: "in_failed_1",
        object: "invoice",
        metadata: { invoice_id: "internal-uuid-3" },
      },
    },
  };
  const res = await signedRequest(handler, event);
  await res.text();
  assertEquals(res.status, 200);

  const updates = stub.calls.filter((c) => c.method === "PATCH");
  assertEquals(updates.length, 1);
  const body = JSON.parse(updates[0].body);
  assertEquals(body.status, "overdue");
});

Deno.test({ name: "unhandled event type returns 200 without DB writes", sanitizeOps: false, sanitizeResources: false }, async () => {
  clearCalls();
  const event = {
    id: "evt_unknown",
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    type: "customer.created",
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: { object: { id: "cus_xyz", object: "customer" } },
  };
  const res = await signedRequest(handler, event);
  await res.text();
  assertEquals(res.status, 200);
  assertEquals(stub.calls.filter((c) => c.method === "PATCH").length, 0);
});

// Cleanup: ensure the stub server shuts down so the test runner exits cleanly.
globalThis.addEventListener("unload", () => {
  stub.stop();
});