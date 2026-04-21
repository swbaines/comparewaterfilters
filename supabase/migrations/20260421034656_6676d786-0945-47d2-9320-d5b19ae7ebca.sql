UPDATE public.provider_stripe_details
SET stripe_payment_method_id = COALESCE(stripe_payment_method_id, 'pm_test_seeded'),
    direct_debit_authorised_at = COALESCE(direct_debit_authorised_at, now()),
    direct_debit_authorised_ip = COALESCE(direct_debit_authorised_ip, '127.0.0.1'),
    direct_debit_authorised_user_agent = COALESCE(direct_debit_authorised_user_agent, 'e2e-test'),
    updated_at = now()
WHERE provider_id = 'ddfd6687-41fe-4466-9e8a-49ef642117d4';