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
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
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
        // Get today's date for query
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

        // Get nutrition targets
        const { data: targetData, error: targetError } = await supabase
          .from('nutrition_targets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (targetError && targetError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
          console.error('Error fetching nutrition targets:', targetError);
        }

        // Get daily nutrition summary using RPC function
        const { data, error: summaryError } = await supabase
          .rpc<NutritionSummaryResponse>('get_daily_nutrition_summary', {
            user_id_param: userId,
            date_param: formattedDate
          });

        if (summaryError) {
          console.error('Error fetching nutrition summary:', summaryError);
        }

        const summaryData = data && data.length > 0 ? data[0] : null;

        // Set default target values if none found
        const targetValues: NutritionTargetResponse = targetData as NutritionTargetResponse || {
          id: 'default',
          user_id: userId,
          daily_calories: 2000,
          daily_protein: 150,
          daily_carbs: 200,
          daily_fat: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Set current values based on summary or default to 0
        const currentValues = summaryData || {
          date: formattedDate,
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0
        };

        // Calculate percentages of targets met
        const percentages = {
          calories: Math.min(100, Math.round((currentValues.total_calories / targetValues.daily_calories) * 100)),
          protein: Math.min(100, Math.round((currentValues.total_protein / targetValues.daily_protein) * 100)),
          carbs: Math.min(100, Math.round((currentValues.total_carbs / targetValues.daily_carbs) * 100)),
          fat: Math.min(100, Math.round((currentValues.total_fat / targetValues.daily_fat) * 100))
        };

        // Update state with all fetched data
        setNutritionSummary({
          current: {
            calories: currentValues.total_calories,
            protein: currentValues.total_protein,
            carbs: currentValues.total_carbs,
            fat: currentValues.total_fat
          },
          target: {
            id: targetValues.id,
            calories: targetValues.daily_calories,
            protein: targetValues.daily_protein,
            carbs: targetValues.daily_carbs,
            fat: targetValues.daily_fat
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
      // Insert new nutrition log
      const { error } = await supabase
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