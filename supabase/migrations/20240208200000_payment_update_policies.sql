-- Allow brands to update payments (upload proof, mark as paid)
CREATE POLICY "Brand members can update payments for their tasks"
ON "public"."payments"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN campaigns ON tasks.campaign_id = campaigns.id
    WHERE tasks.id = payments.task_id
    AND is_brand_member(campaigns.brand_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tasks
    JOIN campaigns ON tasks.campaign_id = campaigns.id
    WHERE tasks.id = payments.task_id
    AND is_brand_member(campaigns.brand_id)
  )
);

-- Allow creators to update their own payments (upload invoice)
CREATE POLICY "Creators can update their own payments"
ON "public"."payments"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tasks
    WHERE tasks.id = payments.task_id
    AND tasks.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tasks
    WHERE tasks.id = payments.task_id
    AND tasks.creator_id = auth.uid()
  )
);
