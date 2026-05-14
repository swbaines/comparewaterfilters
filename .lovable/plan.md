## Vendor Onboarding Restructure — Move Terms to Registration

### Database changes (migration)

Add to `vendor_accounts`:
- `pricing_acknowledged_at timestamptz`
- `terms_accepted_at timestamptz`
- `installation_compliance_acknowledged_at timestamptz`
- `marketing_consent_at timestamptz`
- `legacy_terms boolean default false`

Backfill: any existing `vendor_accounts` row → set `legacy_terms = true` (these vendors will see the one-time re-acceptance popup).

Allow vendors to update these four timestamp columns + `legacy_terms` on their own account (existing "Vendors can update own account" policy already covers it; add a trigger to prevent vendors from un-setting timestamps once set).

Note: `providers.terms_accepted_at` is kept as-is for backwards compatibility but no longer drives onboarding gating. Setting it at registration time becomes optional metadata.

### 1. VendorRegisterPage.tsx

Add four required checkboxes (A–D) as the final step before Submit, each capturing its own tick timestamp in local state:
- A: Lead pricing ($85 owner / $25 rental, monthly invoicing on the 1st, 14-day terms)
- B: Terms & Conditions + Privacy Policy (links to `/terms` and `/privacy`, target=_blank)
- C: Installation compliance (licensed plumbers / state regs)
- D: Marketing & operational emails consent

Submit button disabled until all four are checked. On submit:
1. Create the `providers` row as today (with `terms_accepted_at = now()` for legacy compatibility).
2. After provider creation succeeds, write the four timestamps to the `vendor_accounts` row created by the auto-link trigger. Since the trigger only fires on approval, store the timestamps in a holding place: insert into a new `pending_vendor_terms` table keyed by `submitted_by user_id + provider_id`, then on approval the trigger copies them into `vendor_accounts`.

   Simpler alternative chosen: extend `auto_link_vendor_on_approval` trigger to also accept the four timestamps from a per-user staging row, OR just store the four timestamps directly on `providers` (since we already have `terms_accepted_at` there).

   **Decision**: Add the four timestamp columns to `providers` as well, populate at registration, and have `auto_link_vendor_on_approval` copy them to `vendor_accounts` on approval. This avoids a new table.

### 2. AdminProvidersPage.tsx

Update the Terms column logic: if `providers.terms_accepted_at` is set → show "Accepted" (green). Since registration now requires it, all new providers will be Accepted immediately.

### 3. Vendor dashboard (VendorDashboardPage.tsx + VendorTermsAcceptance.tsx)

Remove the `VendorTermsAcceptance` gate. The dashboard now only gates on payment method (Stripe).
Delete the standalone `VendorTermsAcceptance.tsx` component.

For legacy vendors (`vendor_accounts.legacy_terms = true`), show a non-blocking dialog on dashboard mount with the same four checkboxes. Dismissable. Submitting writes the four timestamps and sets `legacy_terms = false`.

### 4. Reminder email logic (send-vendor-setup-reminders)

Drop the `termsAccepted` check. A vendor only needs `billingReady` (payment method + DD authorisation) to be considered "set up". The reminder fires only when billing is missing.

### 5. Email template (vendor-setup-reminder.tsx)

Rewrite subject and body to focus only on payment method:
- Subject: `Add your payment method to start receiving leads — Compare Water Filters`
- Body: greeting + "approved, please add payment method" + CTA button to `/vendor/billing`.

Remove the `needsTerms` / `needsBilling` branching.

### 6. Files touched

- `supabase/migrations/<new>.sql` — add columns + backfill + extend trigger
- `src/pages/VendorRegisterPage.tsx` — add 4 checkboxes, gate submit, write timestamps
- `src/pages/AdminProvidersPage.tsx` — Terms column shows Accepted
- `src/pages/VendorDashboardPage.tsx` — remove terms gate, add legacy popup
- `src/components/VendorTermsAcceptance.tsx` — delete (or repurpose as `LegacyTermsDialog`)
- `src/components/vendor/LegacyTermsDialog.tsx` — new
- `supabase/functions/send-vendor-setup-reminders/index.ts` — drop terms check
- `supabase/functions/_shared/transactional-email-templates/vendor-setup-reminder.tsx` — new copy

### Out of scope

No changes to Stripe/billing flow. No changes to admin approval flow other than the Terms column display.
