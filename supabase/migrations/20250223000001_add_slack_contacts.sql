-- Add type and webhook_url columns to contacts for Slack alerting
ALTER TABLE contacts
  ADD COLUMN type text NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'slack')),
  ADD COLUMN webhook_url text,
  ADD COLUMN label text;

-- Make email nullable (Slack contacts won't have one)
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;

-- Drop existing unique constraint on email
ALTER TABLE contacts DROP CONSTRAINT contacts_email_key;

-- Ensure email contacts have email, Slack contacts have webhook_url
ALTER TABLE contacts ADD CONSTRAINT contacts_value_required
  CHECK (
    (type = 'email' AND email IS NOT NULL) OR
    (type = 'slack' AND webhook_url IS NOT NULL)
  );

-- Unique constraints to prevent duplicate contacts
CREATE UNIQUE INDEX contacts_email_unique ON contacts (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX contacts_webhook_url_unique ON contacts (webhook_url) WHERE webhook_url IS NOT NULL;
