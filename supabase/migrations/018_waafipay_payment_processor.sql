-- 018_waafipay_payment_processor.sql
-- Add WaafiPay as a supported payment processor

-- Drop and recreate the check constraint to include waafipay
alter table event_pages
  drop constraint if exists event_pages_payment_processor_check;

alter table event_pages
  add constraint event_pages_payment_processor_check
  check (payment_processor in ('stripe', 'flutterwave', 'waafipay', 'free'));
