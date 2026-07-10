-- Migration 029: Change generated_cards.idempotency_key from uuid to text
-- The render API sends string keys like "reg-{uuid}" and "reg-{uuid}-card"
-- which are not valid UUIDs, causing INSERT failures and missing card IDs.
ALTER TABLE generated_cards ALTER COLUMN idempotency_key TYPE text;
