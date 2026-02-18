-- Enable RLS on all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Public read for sites, checks, incidents
CREATE POLICY "Public read sites" ON sites FOR SELECT USING (true);
CREATE POLICY "Public read checks" ON checks FOR SELECT USING (true);
CREATE POLICY "Public read incidents" ON incidents FOR SELECT USING (true);

-- Authenticated-only read for contacts
CREATE POLICY "Authenticated read contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated-only write for all tables
CREATE POLICY "Authenticated insert sites" ON sites FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update sites" ON sites FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete sites" ON sites FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert checks" ON checks FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert incidents" ON incidents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update incidents" ON incidents FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated insert contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated read invitations" ON invitations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated insert invitations" ON invitations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update invitations" ON invitations FOR UPDATE USING (auth.role() = 'authenticated');
