-- Add position column for custom ordering
ALTER TABLE sites ADD COLUMN position integer NOT NULL DEFAULT 0;

-- Backfill existing rows with sequential positions based on alphabetical order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 AS pos
  FROM sites
)
UPDATE sites SET position = ranked.pos
FROM ranked WHERE sites.id = ranked.id;
