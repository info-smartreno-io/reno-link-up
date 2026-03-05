-- Step 1: Create contractor record for All-In-One Home Solutions
INSERT INTO contractors (id, name, email, is_active)
VALUES (
  '6bcd6cd5-5314-4bfa-aeaa-e185f855c1f4',
  'All-In-One Home Solutions',
  'contractor@allinonehomesolutions.com',
  true
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  email = EXCLUDED.email;

-- Step 2: Link API key to contractor account
UPDATE api_keys 
SET contractor_id = '6bcd6cd5-5314-4bfa-aeaa-e185f855c1f4'
WHERE organization_name = 'All-In-One Home Solutions';

-- Step 3: Backfill existing leads from this API key to the contractor
UPDATE leads 
SET user_id = '6bcd6cd5-5314-4bfa-aeaa-e185f855c1f4'
WHERE source = 'All-In-One Home Solutions' 
  AND user_id IS NULL;

-- Step 4: Add RLS policy allowing contractors to view leads from their linked API keys
CREATE POLICY "Contractors can view leads from their API keys"
ON leads FOR SELECT
USING (
  source_api_key_id IN (
    SELECT id FROM api_keys WHERE contractor_id = auth.uid()
  )
);

-- Step 5: Add RLS policy allowing contractors to update leads from their API keys
CREATE POLICY "Contractors can update leads from their API keys"
ON leads FOR UPDATE
USING (
  source_api_key_id IN (
    SELECT id FROM api_keys WHERE contractor_id = auth.uid()
  )
);