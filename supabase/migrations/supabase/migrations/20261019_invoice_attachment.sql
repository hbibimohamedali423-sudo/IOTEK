-- MADO technician invoices — optional file attachment
-- Run this migration in Supabase SQL Editor after 20261018_technician_invoices.sql.
-- Purely additive: existing rows and policies are untouched.
--
-- The attachment is stored in the row itself (base64 data URL) so it inherits the
-- existing row-level security: only the owning technician and managers can read it.
-- No storage bucket or storage policy is required.

alter table public.technician_invoices
  add column if not exists attachment      text,
  add column if not exists attachment_name text;
