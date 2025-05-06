
import { Database } from '../integrations/supabase/types';

// Note: Instead of extending the Database type here (which causes TypeScript errors),
// we now use wrapper functions in src/integrations/supabase/functions.ts
// This provides proper type safety for all RPC function calls.

// Add exercise_logs to the Database type
declare module '../integrations/supabase/types' {
  interface Database {
    public: {
      Tables: {
        exercise_logs: {
          Row: {
            id: string;
            workout_log_id: string;
            exercise_id: string;
            sets_completed: number;
            reps_completed: number | null;
            weight_used: number | null;
            notes: string | null;
            completed_at: string;
          };
          Insert: {
            id?: string;
            workout_log_id: string;
            exercise_id: string;
            sets_completed: number;
            reps_completed?: number | null;
            weight_used?: number | null;
            notes?: string | null;
            completed_at?: string;
          };
          Update: {
            id?: string;
            workout_log_id?: string;
            exercise_id?: string;
            sets_completed?: number;
            reps_completed?: number | null;
            weight_used?: number | null;
            notes?: string | null;
            completed_at?: string;
          };
          Relationships: [
            {
              foreignKeyName: "exercise_logs_workout_log_id_fkey";
              columns: ["workout_log_id"];
              isOneToOne: false;
              referencedRelation: "workout_logs";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "exercise_logs_exercise_id_fkey";
              columns: ["exercise_id"];
              isOneToOne: false;
              referencedRelation: "exercises";
              referencedColumns: ["id"];
            }
          ];
        };
      };
    };
  }
}
