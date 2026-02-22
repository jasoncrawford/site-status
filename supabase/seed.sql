-- Seed data for Supabase branch databases (preview deploys)
-- This file runs automatically when a branch DB is created via Supabase Branching.

-- ============================================================================
-- Test auth user: test@example.com / test00
-- ============================================================================

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
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  extensions.crypt('test00', extensions.gen_salt('bf')),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "test@example.com"}',
  'email',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  now(),
  now(),
  now()
);

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
