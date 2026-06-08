-- Migration 026: Add user preference columns to profiles
-- These support the Settings page (timezone, language, currency, date_format,
-- organization, and four notification toggles).

alter table profiles
  add column if not exists organization          text        default '',
  add column if not exists timezone              text        default 'UTC',
  add column if not exists language              text        default 'English',
  add column if not exists currency              text        default 'USD',
  add column if not exists date_format           text        default 'DD MMM YYYY',
  add column if not exists notify_registrations  boolean     default true,
  add column if not exists notify_daily_summary  boolean     default true,
  add column if not exists notify_card_shares    boolean     default false,
  add column if not exists notify_product_updates boolean    default true;
