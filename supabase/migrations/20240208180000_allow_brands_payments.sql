-- Allow brands to create payments for their tasks (when approving content)
CREATE POLICY "Brand members can create payments for their tasks"
ON "public"."payments"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN campaigns ON tasks.campaign_id = campaigns.id
    WHERE tasks.id = payments.task_id
    AND is_brand_member(campaigns.brand_id)
  )
);

-- Allow brands to view payments for their tasks
CREATE POLICY "Brand members can view payments for their tasks"
ON "public"."payments"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN campaigns ON tasks.campaign_id = campaigns.id
    WHERE tasks.id = payments.task_id
    AND is_brand_member(campaigns.brand_id)
  )
);
