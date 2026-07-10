-- Store the price the attendee chose for PWYW tickets
-- NULL means they paid the fixed price; non-null means they chose their own amount
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS chosen_price numeric(10,2) DEFAULT NULL;
