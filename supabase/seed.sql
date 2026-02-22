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
-- Sample sites (4 sites to demonstrate each status)
-- ============================================================================

INSERT INTO sites (id, name, url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Healthy Site',          'https://example.com'),
  ('22222222-2222-2222-2222-222222222222', 'Flaky Site',            'https://flaky.example.com'),
  ('33333333-3333-3333-3333-333333333333', 'Broken Site',           'https://broken.example.com'),
  ('44444444-4444-4444-4444-444444444444', 'Down Site (Incident)',  'https://down.example.com');

-- ============================================================================
-- Synthetic checks (last hour) to demonstrate all three site statuses
-- ============================================================================

-- Site 1: "Healthy Site" — all passing → status: Up (green)
INSERT INTO checks (id, site_id, status, status_code, error, checked_at) VALUES
  ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '50 minutes'),
  ('aaaa0001-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '45 minutes'),
  ('aaaa0001-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '40 minutes'),
  ('aaaa0001-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '35 minutes'),
  ('aaaa0001-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '30 minutes'),
  ('aaaa0001-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '25 minutes'),
  ('aaaa0001-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '20 minutes'),
  ('aaaa0001-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '15 minutes'),
  ('aaaa0001-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '10 minutes'),
  ('aaaa0001-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'success', 200, NULL, now() - interval '5 minutes');

-- Site 2: "Flaky Site" — mostly passing with one 503 → status: Transient Failures (amber)
INSERT INTO checks (id, site_id, status, status_code, error, checked_at) VALUES
  ('aaaa0002-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '50 minutes'),
  ('aaaa0002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '45 minutes'),
  ('aaaa0002-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '40 minutes'),
  ('aaaa0002-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '35 minutes'),
  ('aaaa0002-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '30 minutes'),
  ('aaaa0002-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'failure', 503, 'HTTP 503', now() - interval '25 minutes'),
  ('aaaa0002-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '20 minutes'),
  ('aaaa0002-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '15 minutes'),
  ('aaaa0002-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '10 minutes'),
  ('aaaa0002-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'success', 200, NULL, now() - interval '5 minutes');

-- Site 3: "Broken Site" — has a hard failure (HTTP 500) → status: Failures (red)
INSERT INTO checks (id, site_id, status, status_code, error, checked_at) VALUES
  ('aaaa0003-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '50 minutes'),
  ('aaaa0003-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '45 minutes'),
  ('aaaa0003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '40 minutes'),
  ('aaaa0003-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '35 minutes'),
  ('aaaa0003-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '30 minutes'),
  ('aaaa0003-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '25 minutes'),
  ('aaaa0003-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '20 minutes'),
  ('aaaa0003-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', 'failure', 500, 'HTTP 500', now() - interval '15 minutes'),
  ('aaaa0003-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '10 minutes'),
  ('aaaa0003-0000-0000-0000-000000000010', '33333333-3333-3333-3333-333333333333', 'success', 200, NULL, now() - interval '5 minutes');

-- Site 4: "Down Site (Incident)" — 3 soft failures triggered an incident, still failing
INSERT INTO checks (id, site_id, status, status_code, error, checked_at) VALUES
  ('aaaa0004-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'success', 200, NULL, now() - interval '50 minutes'),
  ('aaaa0004-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'success', 200, NULL, now() - interval '45 minutes'),
  ('aaaa0004-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', 'success', 200, NULL, now() - interval '40 minutes'),
  ('aaaa0004-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'success', 200, NULL, now() - interval '35 minutes'),
  ('aaaa0004-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'failure', 503, 'HTTP 503', now() - interval '30 minutes'),
  ('aaaa0004-0000-0000-0000-000000000006', '44444444-4444-4444-4444-444444444444', 'failure', 502, 'HTTP 502', now() - interval '25 minutes'),
  ('aaaa0004-0000-0000-0000-000000000007', '44444444-4444-4444-4444-444444444444', 'failure', 503, 'HTTP 503', now() - interval '20 minutes'),
  ('aaaa0004-0000-0000-0000-000000000008', '44444444-4444-4444-4444-444444444444', 'failure', 503, 'HTTP 503', now() - interval '15 minutes'),
  ('aaaa0004-0000-0000-0000-000000000009', '44444444-4444-4444-4444-444444444444', 'failure', 503, 'HTTP 503', now() - interval '10 minutes'),
  ('aaaa0004-0000-0000-0000-000000000010', '44444444-4444-4444-4444-444444444444', 'failure', 503, 'HTTP 503', now() - interval '5 minutes');

-- Open incident for Site 4 (triggered by the 3rd soft failure)
INSERT INTO incidents (id, site_id, check_id, status, opened_at) VALUES
  ('bbbb0001-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'aaaa0004-0000-0000-0000-000000000007', 'open', now() - interval '20 minutes');

-- ============================================================================
-- Test contact
-- ============================================================================

INSERT INTO contacts (email) VALUES
  ('test@example.com');
