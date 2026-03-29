
-- Delete all test data from related tables first (foreign key dependencies)
DELETE FROM quote_requests;
DELETE FROM vendor_payment_details;
DELETE FROM vendor_accounts;
DELETE FROM invoices;
DELETE FROM quiz_submissions;
-- Delete all test providers
DELETE FROM providers;
