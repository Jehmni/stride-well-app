export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_configurations: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          model_name: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          model_name?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          equipment_required: string | null
          exercise_type: string
          id: string
          muscle_group: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: string
          equipment_required?: string | null
          exercise_type: string
          id?: string
          muscle_group: string
          name: string
        }
        Update: {
          created_at?: string
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
      goals: {
        Row: {
          completed: boolean | null
          created_at: string
          current_value: number | null
          description: string | null
          goal_type: string
          id: string
          name: string
          target_date: string | null
          target_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type: string
          id?: string
          name: string
          target_date?: string | null
          target_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          goal_type?: string
          id?: string
          name?: string
          target_date?: string | null
          target_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grocery_stores: {
        Row: {
          address: string
          coordinates: Json
          created_at: string | null
          hours: Json | null
          id: string
          image_url: string | null
          items: string[]
          name: string
          phone: string | null
          rating: number | null
        }
        Insert: {
          address: string
          coordinates: Json
          created_at?: string | null
          hours?: Json | null
          id?: string
          image_url?: string | null
          items: string[]
          name: string
          phone?: string | null
          rating?: number | null
        }
        Update: {
          address?: string
          coordinates?: Json
          created_at?: string | null
          hours?: Json | null
          id?: string
          image_url?: string | null
          items?: string[]
          name?: string
          phone?: string | null
          rating?: number | null
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          day_of_week: number | null
          description: string | null
          fat: number
          id: string
          name: string
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          fat: number
          id?: string
          name: string
          protein: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          fat?: number
          id?: string
          name?: string
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          description: string | null
          fat: number
          id: string
          meal_plan_id: string
          meal_type: string
          name: string
          protein: number
          recipe: string | null
          updated_at: string
        }
        Insert: {
          calories: number
          carbs: number
          created_at?: string
          description?: string | null
          fat: number
          id?: string
          meal_plan_id: string
          meal_type: string
          name: string
          protein: number
          recipe?: string | null
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          description?: string | null
          fat?: number
          id?: string
          meal_plan_id?: string
          meal_type?: string
          name?: string
          protein?: number
          recipe?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_tracking: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          id: string
          muscle_mass: number | null
          notes: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number
          avatar_url: string | null
          created_at: string
          first_name: string | null
          fitness_goal: string
          height: number
          id: string
          last_name: string | null
          sex: string
          updated_at: string
          weight: number
        }
        Insert: {
          age: number
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          fitness_goal: string
          height: number
          id: string
          last_name?: string | null
          sex: string
          updated_at?: string
          weight: number
        }
        Update: {
          age?: number
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          fitness_goal?: string
          height?: number
          id?: string
          last_name?: string | null
          sex?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          duration: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_position: number
          reps: number | null
          rest_time: number
          sets: number
          updated_at: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_position: number
          reps?: number | null
          rest_time: number
          sets: number
          updated_at?: string
          workout_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_position?: number
          reps?: number | null
          rest_time?: number
          sets?: number
          updated_at?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          completed_at: string | null
          duration: number | null
          id: string
          is_custom: boolean | null
          notes: string | null
          rating: number | null
          user_id: string
          workout_description: string | null
          workout_id: string
          workout_name: string | null
          workout_type: string | null
          is_from_ai_plan: boolean | null
          ai_workout_plan_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string | null
          duration?: number | null
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          rating?: number | null
          user_id: string
          workout_description?: string | null
          workout_id: string
          workout_name?: string | null
          workout_type?: string | null
          is_from_ai_plan?: boolean | null
          ai_workout_plan_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string | null
          duration?: number | null
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          rating?: number | null
          user_id?: string
          workout_description?: string | null
          workout_id?: string
          workout_name?: string | null
          workout_type?: string | null
          is_from_ai_plan?: boolean | null
          ai_workout_plan_id?: string | null
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          description: string | null
          exercises: Json
          fitness_goal: string
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
          weekly_structure: Json
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          exercises: Json
          fitness_goal: string
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          weekly_structure: Json
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          exercises?: Json
          fitness_goal?: string
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          weekly_structure?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day_of_week: number | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_progress: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          completed_exercises: string[]
          last_updated: string | null
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          completed_exercises: string[]
          last_updated?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          completed_exercises?: string[]
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      workout_reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          workout_plan_id?: string | null
          scheduled_date: string
          scheduled_time: string
          is_recurring: boolean
          recurrence_pattern?: string | null
          is_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          workout_plan_id?: string | null
          scheduled_date: string
          scheduled_time: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          workout_plan_id?: string | null
          scheduled_date?: string
          scheduled_time?: string
          is_recurring?: boolean
          recurrence_pattern?: string | null
          is_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_reminders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_reminders_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      body_measurements: {
        Row: {
          id: string
          user_id: string
          chest: number | null
          waist: number | null
          hips: number | null
          arms: number | null
          thighs: number | null
          recorded_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          chest?: number | null
          waist?: number | null
          hips?: number | null
          arms?: number | null
          thighs?: number | null
          recorded_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chest?: number | null
          waist?: number | null
          hips?: number | null
          arms?: number | null
          thighs?: number | null
          recorded_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
          p_user_id: string
          p_workout_id: string
          p_duration?: number
          p_calories_burned?: number
          p_notes?: string
          p_rating?: number
          p_is_from_ai_plan?: boolean
          p_ai_workout_plan_id?: string
        }
        Returns: string
      }
      create_workout_log: {
        Args: {
          workout_id_param: string
          user_id_param: string
          notes_param?: string
        }
        Returns: string
      }
      exec_sql: {
        Args: { sql: string }
        Returns: Json[]
      }
      get_ai_workout_plans: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          title: string
          description: string
          fitness_goal: string
          created_at: string
          times_completed: number
        }[]
      }
      get_exercise_progress_history: {
        Args: {
          user_id_param: string
          exercise_id_param: string
          limit_param?: number
        }
        Returns: {
          log_id: string
          workout_log_id: string
          completed_at: string
          sets_completed: number
          reps_completed: number
          weight_used: number
          notes: string
        }[]
      }
      get_top_exercises: {
        Args: { user_id_param: string; limit_param?: number }
        Returns: {
          exercise_id: string
          name: string
          muscle_group: string
          count: number
        }[]
      }
      get_user_exercise_counts: {
        Args: { user_id_param: string }
        Returns: {
          exercise_id: string
          name: string
          muscle_group: string
          count: number
        }[]
      }
      link_ai_workout_to_log: {
        Args: {
          p_workout_log_id: string
          p_ai_workout_plan_id: string
        }
        Returns: undefined
      }
      log_exercise_completion: {
        Args: {
          workout_log_id_param: string
          exercise_id_param: string
          sets_completed_param: number
          reps_completed_param?: number
          weight_used_param?: number
          notes_param?: string
        }
        Returns: string
      }
      log_workout_with_exercises: {
        Args: {
          p_user_id: string
          p_workout_data: Json
          p_is_from_ai_plan?: boolean
          p_ai_workout_plan_id?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
