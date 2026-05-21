import { assertEquals, assertObjectMatch } from "jsr:@std/assert";
import {
  buildRolloverCredit,
  computeCreditApplication,
  type PendingCredit,
} from "./credits.ts";

const credit = (overrides: Partial<PendingCredit> & { id: string; amount: number }): PendingCredit => ({
  reason: null,
  quote_request_id: null,
  created_by: null,
  ...overrides,
});

Deno.test("computeCreditApplication: full credit fits within invoice", () => {
  const res = computeCreditApplication(
    [credit({ id: "c1", amount: 50, reason: "Bad lead", quote_request_id: "q1", created_by: "u1" })],
    8500, // $85
  );
  assertEquals(res.total_applied_cents, 5000);
  assertEquals(res.applied.length, 1);
  assertObjectMatch(res.applied[0], {
    id: "c1",
    original_cents: 5000,
    applied_cents: 5000,
    remainder_cents: 0,
    reason: "Bad lead",
    quote_request_id: "q1",
    created_by: "u1",
  });
});

Deno.test("computeCreditApplication: partially used credit reports remainder + preserves linkage", () => {
  const res = computeCreditApplication(
    [credit({ id: "c1", amount: 85, reason: "Wrong number", quote_request_id: "q1", created_by: "admin1" })],
    3000, // $30 invoice total
  );
  assertEquals(res.total_applied_cents, 3000);
  assertEquals(res.applied.length, 1);
  assertObjectMatch(res.applied[0], {
    id: "c1",
    original_cents: 8500,
    applied_cents: 3000,
    remainder_cents: 5500,
    reason: "Wrong number",
    quote_request_id: "q1",
    created_by: "admin1",
  });
});

Deno.test("computeCreditApplication: caps at invoice total across multiple credits (FIFO)", () => {
  const res = computeCreditApplication(
    [
      credit({ id: "c1", amount: 40, reason: "r1", quote_request_id: "q1" }),
      credit({ id: "c2", amount: 85, reason: "r2", quote_request_id: "q2" }),
      credit({ id: "c3", amount: 50, reason: "r3", quote_request_id: "q3" }),
    ],
    10000, // $100 invoice
  );
  // c1: 40 full, c2: 60 partial (25 remainder), c3: not touched
  assertEquals(res.total_applied_cents, 10000);
  assertEquals(res.applied.length, 2);
  assertEquals(res.applied[0].applied_cents, 4000);
  assertEquals(res.applied[0].remainder_cents, 0);
  assertEquals(res.applied[1].id, "c2");
  assertEquals(res.applied[1].applied_cents, 6000);
  assertEquals(res.applied[1].remainder_cents, 2500);
  assertEquals(res.applied[1].reason, "r2");
  assertEquals(res.applied[1].quote_request_id, "q2");
});

Deno.test("computeCreditApplication: invoice total zero applies nothing", () => {
  const res = computeCreditApplication(
    [credit({ id: "c1", amount: 50 })],
    0,
  );
  assertEquals(res.total_applied_cents, 0);
  assertEquals(res.applied.length, 0);
});

Deno.test("computeCreditApplication: skips zero-dollar credits", () => {
  const res = computeCreditApplication(
    [
      credit({ id: "c0", amount: 0 }),
      credit({ id: "c1", amount: 25 }),
    ],
    5000,
  );
  assertEquals(res.total_applied_cents, 2500);
  assertEquals(res.applied.length, 1);
  assertEquals(res.applied[0].id, "c1");
});

Deno.test("buildRolloverCredit: returns null when fully consumed", () => {
  const rollover = buildRolloverCredit("prov-1", {
    id: "c1",
    original_cents: 5000,
    applied_cents: 5000,
    remainder_cents: 0,
    reason: "Bad lead",
    quote_request_id: "q1",
    created_by: "admin1",
  });
  assertEquals(rollover, null);
});

Deno.test("buildRolloverCredit: preserves reason, quote_request_id, created_by", () => {
  const rollover = buildRolloverCredit("prov-1", {
    id: "c1",
    original_cents: 8500,
    applied_cents: 3000,
    remainder_cents: 5500,
    reason: "Wrong number",
    quote_request_id: "q1",
    created_by: "admin1",
  });
  assertEquals(rollover, {
    provider_id: "prov-1",
    quote_request_id: "q1",
    amount: 55,
    reason: "Wrong number (rollover from prior invoice)",
    status: "pending",
    created_by: "admin1",
  });
});

Deno.test("buildRolloverCredit: falls back to default reason when original is null", () => {
  const rollover = buildRolloverCredit("prov-1", {
    id: "c1",
    original_cents: 8500,
    applied_cents: 3000,
    remainder_cents: 5500,
    reason: null,
    quote_request_id: null,
    created_by: null,
  });
  assertEquals(rollover, {
    provider_id: "prov-1",
    quote_request_id: null,
    amount: 55,
    reason: "Rollover from prior invoice",
    status: "pending",
    created_by: null,
  });
});

// End-to-end rollover flow: simulate two consecutive invoice runs.
Deno.test("rollover flow: remainder credit applies to next month's invoice", () => {
  // Month 1: $30 invoice, single $85 credit → $30 applied, $55 rollover
  const month1 = computeCreditApplication(
    [credit({ id: "c1", amount: 85, reason: "Bad lead", quote_request_id: "q1", created_by: "admin1" })],
    3000,
  );
  assertEquals(month1.total_applied_cents, 3000);
  const rollover = buildRolloverCredit("prov-1", month1.applied[0]);
  assertEquals(rollover?.amount, 55);
  assertEquals(rollover?.quote_request_id, "q1");

  // Month 2: $200 invoice picks up the rollover credit
  const month2 = computeCreditApplication(
    [credit({
      id: "c1-rollover",
      amount: rollover!.amount,
      reason: rollover!.reason,
      quote_request_id: rollover!.quote_request_id,
      created_by: rollover!.created_by,
    })],
    20000,
  );
  assertEquals(month2.total_applied_cents, 5500);
  assertEquals(month2.applied[0].remainder_cents, 0);
  assertEquals(month2.applied[0].quote_request_id, "q1");
  assertEquals(month2.applied[0].reason, "Bad lead (rollover from prior invoice)");
});