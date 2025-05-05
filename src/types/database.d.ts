
import { Database } from '../integrations/supabase/types';

// Extend the Database type to include our RPC functions
declare module '../integrations/supabase/types' {
  interface Database {
    public: {
      Functions: {
        get_exercise_progress_history: {
          Args: {
            user_id_param: string;
            exercise_id_param: string;
            limit_param: number;
          };
          Returns: {
            id: string;
            workout_log_id: string;
            completed_at: string;
            sets_completed: number;
            reps_completed: number | null;
            weight_used: number | null;
            notes: string | null;
          }[];
        };
        log_exercise_completion: {
          Args: {
            workout_log_id_param: string;
            exercise_id_param: string;
            sets_completed_param: number;
            reps_completed_param: number | null;
            weight_used_param: number | null;
            notes_param: string | null;
          };
          Returns: string; // UUID of the inserted exercise log
        };
        get_user_exercise_counts: {
          Args: {
            user_id_param: string;
          };
          Returns: {
            exercise_id: string;
            name: string;
            muscle_group: string;
            count: number;
          }[];
        };
        get_top_exercises: {
          Args: {
            user_id_param: string;
            limit_param: number;
          };
          Returns: {
            exercise_id: string;
            name: string;
            muscle_group: string;
            count: number;
          }[];
        };
      } & Database['public']['Functions'];
    } & Database['public'];
  }
}
