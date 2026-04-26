# Edge Functions — Stripe Conventions

All Stripe-using edge functions in this project share a single pinned version
and API version to keep builds reproducible. Do **not** mix esm.sh imports or
bump versions in a single function — change them everywhere or builds will
drift and CI (`.github/workflows/ci.yml`) will fail.

## Pinned versions

| Concern              | Import                       | `apiVersion`    |
| -------------------- | ---------------------------- | --------------- |
| Charges / invoices / customers | `import Stripe from "npm:stripe@14.21.0"` | `"2023-10-16"` |
| Webhooks (`stripe-webhook`)    | `import Stripe from "npm:stripe@14.21.0"` | `"2023-10-16"` |

Both currently use the same version. The table is split because Stripe
occasionally requires the webhook function to track a newer SDK for new
event types — if that happens, update **only** `stripe-webhook` and document
the divergence here.

## Required `deno.json`

Each Stripe-using function must have a `deno.json` next to its `index.ts`
with:

```json
{ "nodeModulesDir": "auto" }
```

Without this the npm specifier (`npm:stripe@14.21.0`) fails to resolve at
build time with:

> Could not find a matching package for 'npm:stripe@14.21.0' in the
> node_modules directory.

## Functions covered

- `charge-vendors-monthly`
- `create-manual-invoice`
- `create-setup-intent`
- `create-stripe-customer`
- `pay-invoice-now`
- `save-payment-method`
- `stripe-webhook`

## Where to update `apiVersion`

The `apiVersion` is passed to `new Stripe(stripeKey, { apiVersion: "..." })`
inside each function's `index.ts`. Search before changing:

```bash
rg -n "apiVersion" supabase/functions/
```

Update every match in the table above in the same commit, then run:

```bash
for fn in charge-vendors-monthly create-manual-invoice create-setup-intent \
          create-stripe-customer pay-invoice-now save-payment-method \
          stripe-webhook; do
  (cd "supabase/functions/$fn" && deno check index.ts) || exit 1
done
```

CI runs the same loop on every PR.

## When bumping the Stripe SDK version

1. Update the `npm:stripe@<version>` specifier in **every** function listed
   above.
2. Update the matching `apiVersion` to the version that ships with the new
   SDK (see Stripe's changelog).
3. Update the version table at the top of this file.
4. Run the `deno check` loop locally and verify CI passes.