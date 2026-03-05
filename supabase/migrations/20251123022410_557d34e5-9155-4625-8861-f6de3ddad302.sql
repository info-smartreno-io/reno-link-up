-- Allow anonymous users to submit estimate requests (public form)
CREATE POLICY "Allow public estimate request submissions"
ON estimate_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow authenticated users to view their own estimate requests
CREATE POLICY "Users can view their own estimate requests"
ON estimate_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own estimate requests
CREATE POLICY "Users can update their own estimate requests"
ON estimate_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);