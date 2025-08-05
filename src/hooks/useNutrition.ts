import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionTarget extends NutritionData {
  id: string;
}

interface NutritionSummary {
  current: NutritionData;
  target: NutritionTarget | null;
  percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isLoading: boolean;
  error: string | null;
}

// Define type for RPC function response
interface NutritionSummaryResponse {
  date: string;
  total_calories: number; // This will be BIGINT from DB but converted to number
  total_protein: number; // This will be NUMERIC from DB but converted to number
  total_carbs: number; // This will be NUMERIC from DB but converted to number
  total_fat: number; // This will be NUMERIC from DB but converted to number
}

// Define type for Nutrition Target DB response
interface NutritionTargetResponse {
  id: string;
  user_id: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  created_at: string;
  updated_at: string;
}

export const useNutrition = (userId: string | undefined): [
  NutritionSummary,
  (data: Omit<NutritionData & { meal_name?: string; meal_type?: string }, 'id'>) => Promise<void>
] => {
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary>({
    current: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    target: null,
    percentage: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchNutritionData = async () => {
      if (!userId) {
        setNutritionSummary(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setNutritionSummary(prev => ({ ...prev, isLoading: true, error: null }));

        const formattedDate = new Date().toISOString().split('T')[0];

        // Ensure user has a nutrition target (creates default if none exists)
        await (supabase as any).rpc('ensure_nutrition_target', {
          user_id_param: userId
        });

        // Get nutrition targets (using type assertion to bypass TypeScript issues)
        const { data: targetData, error: targetError } = await (supabase as any)
          .from('nutrition_targets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (targetError && targetError.code !== 'PGRST116') {
          console.error('Error fetching nutrition targets:', targetError);
        }

        // Get daily nutrition summary using our new RPC function
        const { data: summaryData, error: summaryError } = await (supabase as any)
          .rpc('get_nutrition_summary', {
            user_id_param: userId,
            date_param: formattedDate
          });

        if (summaryError) {
          console.error('Error fetching nutrition summary:', summaryError);
          // Continue with default values if RPC fails
        }

        // Set default target values if none found
        const targetValues = (targetData as any) || {
          id: 'default',
          user_id: userId,
          daily_calories: 2000,
          daily_protein_g: 150,
          daily_carbs_g: 200,
          daily_fat_g: 60,
          daily_fiber_g: 25,
          daily_water_ml: 2000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Set current values based on summary or default to 0
        const currentValues = (summaryData as any) && (summaryData as any).length > 0 ? (summaryData as any)[0] : {
          date: formattedDate,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0
        };

        // Convert bigint/numeric values to numbers and handle nulls
        const safeCurrentValues = {
          total_calories: Number(currentValues.total_calories) || 0,
          total_protein: Number(currentValues.total_protein) || 0,
          total_carbs: Number(currentValues.total_carbs) || 0,
          total_fat: Number(currentValues.total_fat) || 0
        };

        // Calculate percentages of targets met
        const percentages = {
          calories: Math.min(100, Math.round((safeCurrentValues.total_calories / targetValues.daily_calories) * 100)),
          protein: Math.min(100, Math.round((safeCurrentValues.total_protein / targetValues.daily_protein_g) * 100)),
          carbs: Math.min(100, Math.round((safeCurrentValues.total_carbs / targetValues.daily_carbs_g) * 100)),
          fat: Math.min(100, Math.round((safeCurrentValues.total_fat / targetValues.daily_fat_g) * 100))
        };

        // Update state with all fetched data
        setNutritionSummary({
          current: {
            calories: safeCurrentValues.total_calories,
            protein: safeCurrentValues.total_protein,
            carbs: safeCurrentValues.total_carbs,
            fat: safeCurrentValues.total_fat
          },
          target: {
            id: targetValues.id,
            calories: targetValues.daily_calories,
            protein: targetValues.daily_protein_g,
            carbs: targetValues.daily_carbs_g,
            fat: targetValues.daily_fat_g
          },
          percentage: percentages,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error in fetchNutritionData:', error);
        setNutritionSummary(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load nutrition data'
        }));
      }
    };

    fetchNutritionData();
  }, [userId]);

  // Function to log a new meal/nutrition item
  const logNutrition = async (data: Omit<NutritionData & { meal_name?: string; meal_type?: string }, 'id'>) => {
    if (!userId) return;

    try {
      // Insert new nutrition log using the actual nutrition_logs table
      const { error } = await (supabase as any)
        .from('nutrition_logs')
        .insert({
          user_id: userId,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          meal_name: data.meal_name,
          meal_type: data.meal_type
        });

      if (error) throw error;

      // Update the current summary with the new values
      setNutritionSummary(prev => {
        const updatedCurrent = {
          calories: prev.current.calories + data.calories,
          protein: prev.current.protein + data.protein,
          carbs: prev.current.carbs + data.carbs,
          fat: prev.current.fat + data.fat
        };

        const targetValues = prev.target || {
          id: 'default',
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 60
        };

        // Recalculate percentages
        const percentages = {
          calories: Math.min(100, Math.round((updatedCurrent.calories / targetValues.calories) * 100)),
          protein: Math.min(100, Math.round((updatedCurrent.protein / targetValues.protein) * 100)),
          carbs: Math.min(100, Math.round((updatedCurrent.carbs / targetValues.carbs) * 100)),
          fat: Math.min(100, Math.round((updatedCurrent.fat / targetValues.fat) * 100))
        };

        return {
          ...prev,
          current: updatedCurrent,
          percentage: percentages
        };
      });
    } catch (error) {
      console.error('Error logging nutrition:', error);
      throw error;
    }
  };

  return [nutritionSummary, logNutrition];
}; 