import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MealPlanRecord {
  id: string;
  name: string;
  description?: string;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useMealPlans = (userId?: string | null) => {
  const [mealPlans, setMealPlans] = useState<MealPlanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMealPlans = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed = (data || []).map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        daily_calorie_target: plan.daily_calorie_target || plan.calories || 2000,
        daily_protein_target: plan.daily_protein_target || plan.protein || 150,
        daily_carbs_target: plan.daily_carbs_target || plan.carbs || 200,
        daily_fat_target: plan.daily_fat_target || plan.fat || 70,
        start_date: plan.start_date || plan.created_at,
        end_date: plan.end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: plan.is_active !== false,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      } as MealPlanRecord));

      setMealPlans(transformed);
    } catch (error) {
      console.error('Error fetching meal plans:', error);
      toast.error('Failed to load meal plans');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createMealPlan = useCallback(async (userId: string, newPlan: { name: string; description?: string; calories: number; protein: number; carbs: number; fat: number }) => {
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: newPlan.name,
          description: newPlan.description,
          daily_calorie_target: newPlan.calories,
          daily_protein_target: newPlan.protein,
          daily_carbs_target: newPlan.carbs,
          daily_fat_target: newPlan.fat,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Meal plan created successfully!');
      fetchMealPlans();
      return data;
    } catch (error) {
      console.error('Error creating meal plan:', error);
      toast.error('Failed to create meal plan');
      return null;
    }
  }, [fetchMealPlans]);

  const deleteMealPlan = useCallback(async (planId: string) => {
    try {
      const { error } = await supabase.from('meal_plans').delete().eq('id', planId);
      if (error) throw error;
      toast.success('Meal plan deleted successfully!');
      fetchMealPlans();
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      toast.error('Failed to delete meal plan');
    }
  }, [fetchMealPlans]);

  useEffect(() => {
    if (userId) fetchMealPlans();
  }, [userId, fetchMealPlans]);

  return {
    mealPlans,
    isLoading,
    fetchMealPlans,
    createMealPlan,
    deleteMealPlan
  };
};

export default useMealPlans;
