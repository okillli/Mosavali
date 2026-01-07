-- Fix: Replace unique constraint on name only with unique on (farm_id, name)
-- This allows different farms to have work types with the same name

ALTER TABLE work_types DROP CONSTRAINT IF EXISTS work_types_name_key;
ALTER TABLE work_types ADD CONSTRAINT work_types_farm_name_unique UNIQUE (farm_id, name);
