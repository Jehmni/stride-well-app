# Database Update Required

When running this application in a production environment, please make sure to run the latest migration file:

```
supabase/migrations/20250505000000_add_equipment_required.sql
```

This migration adds a missing `equipment_required` column to the exercises table that is referenced in the TypeScript interfaces but was missing from the original schema.

## Running the Migration

You can run this migration using the Supabase CLI:

```bash
npx supabase migration up
```

Or directly in your Supabase project by running the SQL:

```sql
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS equipment_required TEXT;

CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises(equipment_required);
```

## Alternative Workaround

If you're unable to run the migration immediately, the application will continue to work as there is a fix in place in `ExerciseDashboard.tsx` that adds a default null value for `equipment_required` when it's missing from the database results.
