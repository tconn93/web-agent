-- Migration: Add content_before and content_after columns to file_changes table
-- Run this migration against your PostgreSQL database to add the new columns

ALTER TABLE file_changes
ADD COLUMN IF NOT EXISTS content_before TEXT,
ADD COLUMN IF NOT EXISTS content_after TEXT;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'file_changes'
AND column_name IN ('content_before', 'content_after');
