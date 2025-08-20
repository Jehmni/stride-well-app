import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Meal {
  id: string;
  meal_plan_id: string;
  name: string;
  description?: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const useMeals = (initialPlanId?: string | null) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMealsForPlan = useCallback(async (planId?: string | null) => {
    const pid = planId || initialPlanId;
    if (!pid) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('meal_plan_id', pid)
        .order('meal_type', { ascending: true });

      if (error) throw error;
      setMeals(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching meals:', error);
      toast.error('Failed to load meals');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [initialPlanId]);

  const createMeal = useCallback(async (planId: string) => {
    if (!planId) return null;
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          meal_plan_id: planId,
          name: 'New Meal',
          meal_type: 'breakfast',
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Meal added successfully!');
      await fetchMealsForPlan(planId);
      return data;
    } catch (error) {
      console.error('Error creating meal:', error);
      toast.error('Failed to create meal');
      return null;
    }
  }, [fetchMealsForPlan]);

  const deleteMeal = useCallback(async (mealId: string, planId?: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;
      toast.success('Meal deleted successfully!');
      if (planId) await fetchMealsForPlan(planId);
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to delete meal');
      return false;
    }
  }, [fetchMealsForPlan]);

  useEffect(() => {
    if (initialPlanId) fetchMealsForPlan(initialPlanId);
  }, [initialPlanId, fetchMealsForPlan]);

  return {
    meals,
    isLoading,
    fetchMealsForPlan,
    createMeal,
    deleteMeal,
    setMeals
  };
};

export default useMeals;
