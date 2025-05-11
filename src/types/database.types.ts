export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          api_endpoint: string
          api_key: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          model_name: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string
          api_key?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          model_name?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_key?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          model_name?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          completed_at: string | null
          exercise_id: string
          id: string
          notes: string | null
          reps_completed: number | null
          sets_completed: number
          weight_used: number | null
          workout_log_id: string
          workout_plan_id: string | null
        }
        Insert: {
          completed_at?: string | null
          exercise_id: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          sets_completed: number
          weight_used?: number | null
          workout_log_id: string
          workout_plan_id?: string | null
        }
        Update: {
          completed_at?: string | null
          exercise_id?: string
          id?: string
          notes?: string | null
          reps_completed?: number | null
          sets_completed?: number
          weight_used?: number | null
          workout_log_id?: string
          workout_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: string
          equipment_required: string | null
          exercise_type: string
          id: string
          muscle_group: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty: string
          equipment_required?: string | null
          exercise_type: string
          id?: string
          muscle_group: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: string
          equipment_required?: string | null
          exercise_type?: string
          id?: string
          muscle_group?: string
          name?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          fitness_goal: string | null
          full_name: string | null
          height: number | null
          id: string
          sex: string | null
          updated_at: string | null
          username: string | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          height?: number | null
          id: string
          sex?: string | null
          updated_at?: string | null
          username?: string | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          fitness_goal?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          sex?: string | null
          updated_at?: string | null
          username?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          duration: number | null
          exercise_id: string | null
          id: string
          notes: string | null
          order_position: number | null
          reps: number | null
          rest_time: number | null
          sets: number
          updated_at: string | null
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_position?: number | null
          reps?: number | null
          rest_time?: number | null
          sets: number
          updated_at?: string | null
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          exercise_id?: string | null
          id?: string
          notes?: string | null
          order_position?: number | null
          reps?: number | null
          rest_time?: number | null
          sets?: number
          updated_at?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_logs: {
        Row: {
          ai_workout_plan_id: string | null
          calories_burned: number | null
          completed_at: string | null
          duration: number | null
          id: string
          is_custom: boolean | null
          is_from_ai_plan: boolean | null
          notes: string | null
          rating: number | null
          user_id: string
          workout_description: string | null
          workout_id: string
          workout_name: string | null
          workout_type: string | null
        }
        Insert: {
          ai_workout_plan_id?: string | null
          calories_burned?: number | null
          completed_at?: string | null
          duration?: number | null
          id?: string
          is_custom?: boolean | null
          is_from_ai_plan?: boolean | null
          notes?: string | null
          rating?: number | null
          user_id: string
          workout_description?: string | null
          workout_id: string
          workout_name?: string | null
          workout_type?: string | null
        }
        Update: {
          ai_workout_plan_id?: string | null
          calories_burned?: number | null
          completed_at?: string | null
          duration?: number | null
          id?: string
          is_custom?: boolean | null
          is_from_ai_plan?: boolean | null
          notes?: string | null
          rating?: number | null
          user_id?: string
          workout_description?: string | null
          workout_id?: string
          workout_name?: string | null
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_ai_workout_plan_id_fkey"
            columns: ["ai_workout_plan_id"]
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_plans: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          description: string | null
          exercises: Json | null
          fitness_goal: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
          weekly_structure: Json | null
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          fitness_goal?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          weekly_structure?: Json | null
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          exercises?: Json | null
          fitness_goal?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          weekly_structure?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_progress: {
        Row: {
          completed_exercises: string[]
          id: string
          last_updated: string | null
          user_id: string
          workout_id: string
        }
        Insert: {
          completed_exercises?: string[]
          id?: string
          last_updated?: string | null
          user_id: string
          workout_id: string
        }
        Update: {
          completed_exercises?: string[]
          id?: string
          last_updated?: string | null
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          day_of_week: number | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_workout: {
        Args: {
          workout_id_param: string
          user_id_param: string
          duration_param?: number
          calories_param?: number
          notes_param?: string
          is_ai_workout_param?: boolean
          ai_workout_plan_id_param?: string
        }
        Returns: string
      }
      get_exercise_progress_history: {
        Args: {
          user_id_param: string
          exercise_id_param: string
          limit_param: number
        }
        Returns: {
          id: string
          workout_log_id: string
          completed_at: string
          sets_completed: number
          reps_completed: number | null
          weight_used: number | null
          notes: string | null
        }[]
      }
      get_top_exercises: {
        Args: {
          user_id_param: string
          limit_param: number
        }
        Returns: {
          exercise_id: string
          name: string
          muscle_group: string
          count: number
        }[]
      }
      get_user_exercise_counts: {
        Args: {
          user_id_param: string
        }
        Returns: {
          exercise_id: string
          name: string
          muscle_group: string
          count: number
        }[]
      }
      link_ai_workout_to_log: {
        Args: {
          workout_plan_id_param: string
          workout_log_id_param: string
        }
        Returns: boolean
      }
      log_exercise_completion: {
        Args: {
          workout_log_id_param: string
          exercise_id_param: string
          sets_completed_param: number
          reps_completed_param: number | null
          weight_used_param: number | null
          notes_param: string | null
        }
        Returns: string
      }
      log_workout_with_exercises: {
        Args: {
          workout_id_param: string
          user_id_param: string
          duration_param: number
          calories_param: number
          exercise_data_param: Json
          is_ai_workout_param?: boolean
          ai_workout_plan_id_param?: string
        }
        Returns: string
      }
      sync_workout_progress: {
        Args: {
          user_id_param: string
          workout_id_param: string
          completed_exercises_param: string[]
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 