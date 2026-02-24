-- Add type and phone columns to contacts for SMS alerting
ALTER TABLE contacts
  ADD COLUMN type text NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'sms')),
  ADD COLUMN phone text;

-- Make email nullable (SMS contacts won't have one)
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;

-- Drop existing unique constraint on email
ALTER TABLE contacts DROP CONSTRAINT contacts_email_key;

-- Ensure email contacts have email, SMS contacts have phone
ALTER TABLE contacts ADD CONSTRAINT contacts_value_required
  CHECK (
    (type = 'email' AND email IS NOT NULL) OR
    (type = 'sms' AND phone IS NOT NULL)
  );

-- Unique constraints to prevent duplicate contacts
CREATE UNIQUE INDEX contacts_email_unique ON contacts (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX contacts_phone_unique ON contacts (phone) WHERE phone IS NOT NULL;
