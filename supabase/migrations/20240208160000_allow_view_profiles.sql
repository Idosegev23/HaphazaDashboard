-- Allow brands and creators to view user profiles (needed for displaying names/emails)
-- Currently only admins and the user themselves can view their profile

CREATE POLICY "Authenticated users can view profiles"
ON "public"."users_profiles"
FOR SELECT
TO authenticated
USING (true);
