-- Seed data for Supabase branch databases (preview deploys)
-- This file runs automatically when a branch DB is created via Supabase Branching.

-- ============================================================================
-- Test auth user: test@example.com / test00
-- ============================================================================

DO $$
DECLARE
  test_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  test_email TEXT := 'test@example.com';
  test_encrypted_pw TEXT := crypt('test00', gen_salt('bf'));
BEGIN

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    test_email,
    test_encrypted_pw,
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now()
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    test_user_id,
    format('{"sub": "%s", "email": "%s"}', test_user_id, test_email)::jsonb,
    'email',
    test_user_id,
    now(),
    now(),
    now()
  );

END $$;

-- ============================================================================
-- Sample sites
-- ============================================================================

INSERT INTO sites (id, name, url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Example Site', 'https://example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Anthropic', 'https://www.anthropic.com');

-- ============================================================================
-- Test contact
-- ============================================================================

INSERT INTO contacts (email) VALUES
  ('test@example.com');
