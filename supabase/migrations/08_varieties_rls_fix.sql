-- Fix: Add UPDATE and DELETE policies for varieties table
-- The original RLS setup only had SELECT and INSERT policies,
-- which blocked edit and delete operations in the UI.

-- Allow authenticated users to update varieties
DROP POLICY IF EXISTS "Authenticated users can update varieties" ON varieties;
CREATE POLICY "Authenticated users can update varieties"
ON varieties FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete varieties
DROP POLICY IF EXISTS "Authenticated users can delete varieties" ON varieties;
CREATE POLICY "Authenticated users can delete varieties"
ON varieties FOR DELETE
USING (auth.role() = 'authenticated');
