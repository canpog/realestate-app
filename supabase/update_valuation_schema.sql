-- Allow listing_id to be NULL for standalone analysis
ALTER TABLE price_analysis_reports ALTER COLUMN listing_id DROP NOT NULL;

-- Update RLS for NULL listing_id if needed (Agents can see their own reports regardless of listing)
-- Existing policy: auth.uid() = (SELECT auth_user_id FROM agents WHERE id = agent_id)
-- This relies on agent_id which is NOT NULL, so it is safe.
