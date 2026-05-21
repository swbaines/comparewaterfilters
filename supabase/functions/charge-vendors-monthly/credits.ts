// Pure helpers for applying provider refund credits to a monthly invoice.
// Extracted so the rollover behavior can be unit-tested without Stripe / Supabase.

export interface PendingCredit {
  id: string;
  amount: number; // dollars
  reason: string | null;
  quote_request_id: string | null;
  created_by: string | null;
}

export interface AppliedCreditPlan {
  id: string;
  original_cents: number;
  applied_cents: number;
  remainder_cents: number;
  reason: string | null;
  quote_request_id: string | null;
  created_by: string | null;
}

export interface CreditApplicationResult {
  total_applied_cents: number;
  applied: AppliedCreditPlan[];
}

/**
 * Apply pending credits to an invoice total in FIFO order, capped at `invoiceTotalCents`.
 * Returns a plan that callers can execute against Stripe + the database.
 *
 * Each applied entry retains the linkage fields (`reason`, `quote_request_id`,
 * `created_by`) so the caller can create a rollover credit for any unused
 * remainder without losing context.
 */
export function computeCreditApplication(
  credits: PendingCredit[],
  invoiceTotalCents: number,
): CreditApplicationResult {
  let totalAppliedCents = 0;
  const applied: AppliedCreditPlan[] = [];

  for (const c of credits) {
    const remaining = invoiceTotalCents - totalAppliedCents;
    if (remaining <= 0) break;

    const credCents = Math.round(Number(c.amount) * 100);
    if (credCents <= 0) continue;

    const applyCents = Math.min(credCents, remaining);
    totalAppliedCents += applyCents;

    applied.push({
      id: c.id,
      original_cents: credCents,
      applied_cents: applyCents,
      remainder_cents: credCents - applyCents,
      reason: c.reason,
      quote_request_id: c.quote_request_id,
      created_by: c.created_by,
    });
  }

  return { total_applied_cents: totalAppliedCents, applied };
}

/**
 * Build the row that should be inserted into `provider_credits` as a rollover
 * for a credit that was only partially consumed.
 */
export function buildRolloverCredit(
  providerId: string,
  plan: AppliedCreditPlan,
): {
  provider_id: string;
  quote_request_id: string | null;
  amount: number;
  reason: string;
  status: "pending";
  created_by: string | null;
} | null {
  if (plan.remainder_cents <= 0) return null;
  return {
    provider_id: providerId,
    quote_request_id: plan.quote_request_id,
    amount: plan.remainder_cents / 100,
    reason: plan.reason
      ? `${plan.reason} (rollover from prior invoice)`
      : "Rollover from prior invoice",
    status: "pending",
    created_by: plan.created_by,
  };
}