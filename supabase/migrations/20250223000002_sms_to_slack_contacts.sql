-- Fix branch DBs that applied the old SMS migration.
-- Renames phone -> webhook_url and updates type constraint from 'sms' to 'slack'.
-- Safe to run even if the column is already named webhook_url (production path).

-- Drop old constraints (names may vary)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_value_required;

-- Drop old indexes that may reference phone
DROP INDEX IF EXISTS contacts_phone_unique;

-- Rename phone to webhook_url if phone column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'phone'
  ) THEN
    ALTER TABLE contacts RENAME COLUMN phone TO webhook_url;
  END IF;
END $$;

-- Re-add constraints with correct values
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_type_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_type_check
  CHECK (type IN ('email', 'slack'));

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_value_required;
ALTER TABLE contacts ADD CONSTRAINT contacts_value_required
  CHECK (
    (type = 'email' AND email IS NOT NULL) OR
    (type = 'slack' AND webhook_url IS NOT NULL)
  );

-- Re-create unique index (idempotent via IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS contacts_webhook_url_unique
  ON contacts (webhook_url) WHERE webhook_url IS NOT NULL;
