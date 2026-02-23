CREATE POLICY "Authenticated delete invitations" ON invitations FOR DELETE USING (auth.role() = 'authenticated');
