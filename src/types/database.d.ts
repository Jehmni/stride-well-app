
import { Database } from '../integrations/supabase/types';

// Note: Instead of extending the Database type here (which causes TypeScript errors),
// we now use wrapper functions in src/integrations/supabase/functions.ts
// This provides proper type safety for all RPC function calls.
