```sql
/*
  Add media_items column to assets table

  This migration adds a new `media_items` JSONB column to the `assets` table.
  This column will store an array of objects, each representing a media file
  (photo, video, or PDF) associated with the asset, along with its type, URL,
  and calculated token cost.
*/

ALTER TABLE assets
ADD COLUMN media_items JSONB;

-- Optional: If you want to migrate existing single media_url entries to the new format,
-- you can add a data migration step here. For now, new assets will use media_items.
-- Existing assets will continue to use media_url until updated.

-- Consider updating RLS policies for assets if needed to reflect the new column.
-- For now, existing policies should still apply to the row as a whole.

```