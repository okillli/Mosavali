-- Migration: Add farm_id to work_types table for per-farm customization
-- This allows each farm to have their own work types

-- 1. Add farm_id column (nullable initially for existing data)
ALTER TABLE work_types ADD COLUMN IF NOT EXISTS farm_id UUID;

-- 2. Update existing work_types to assign them to all farms that use them
-- First, get the farm_ids from profiles and assign seed data to them
DO $$
DECLARE
    farm_record RECORD;
    work_type_record RECORD;
BEGIN
    -- For each existing work type without farm_id, create a copy for each farm
    FOR work_type_record IN SELECT * FROM work_types WHERE farm_id IS NULL LOOP
        FOR farm_record IN SELECT DISTINCT farm_id FROM profiles LOOP
            -- Insert a farm-specific copy
            INSERT INTO work_types (name, farm_id)
            VALUES (work_type_record.name, farm_record.farm_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- Delete the original seed work types (those without farm_id)
    DELETE FROM work_types WHERE farm_id IS NULL;
END $$;

-- 3. Make farm_id NOT NULL after migration
ALTER TABLE work_types ALTER COLUMN farm_id SET NOT NULL;

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_work_types_farm_id ON work_types(farm_id);

-- 5. Update RLS policies for work_types
DROP POLICY IF EXISTS "Anyone can read work_types" ON work_types;
DROP POLICY IF EXISTS "Users can read own farm work_types" ON work_types;
DROP POLICY IF EXISTS "Users can insert own farm work_types" ON work_types;
DROP POLICY IF EXISTS "Users can update own farm work_types" ON work_types;
DROP POLICY IF EXISTS "Users can delete own farm work_types" ON work_types;

-- Enable RLS if not already enabled
ALTER TABLE work_types ENABLE ROW LEVEL SECURITY;

-- Create farm-based policies
CREATE POLICY "Users can read own farm work_types" ON work_types
    FOR SELECT USING (
        farm_id IN (SELECT farm_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert own farm work_types" ON work_types
    FOR INSERT WITH CHECK (
        farm_id IN (SELECT farm_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update own farm work_types" ON work_types
    FOR UPDATE USING (
        farm_id IN (SELECT farm_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete own farm work_types" ON work_types
    FOR DELETE USING (
        farm_id IN (SELECT farm_id FROM profiles WHERE id = auth.uid())
    );

-- 6. Function to seed default work types for new farms (call when creating a new farm)
CREATE OR REPLACE FUNCTION seed_work_types_for_farm(p_farm_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO work_types (name, farm_id) VALUES
        ('ხვნა', p_farm_id),
        ('დათესვა', p_farm_id),
        ('კულტივაცია', p_farm_id),
        ('სასუქის შეტანა', p_farm_id),
        ('ჰერბიციდი', p_farm_id),
        ('ფუნგიციდი', p_farm_id),
        ('მორწყვა', p_farm_id),
        ('აღება (კომბაინი)', p_farm_id)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
