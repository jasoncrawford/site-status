-- settings: simple key-value store for app configuration
CREATE TABLE settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read, authenticated write
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Authenticated insert settings" ON settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Seed the canary default
INSERT INTO settings (key, value) VALUES ('canary_status_code', '200');
