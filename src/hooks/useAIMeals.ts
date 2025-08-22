import { useState, useCallback, useEffect } from 'react';
import { mealPlanService, UserFitnessProfile, MealPlan as AIMealPlan } from '@/services/meal_plan_service';
import { storeLocatorService } from '@/services/store_locator_service';
import { toast } from 'sonner';

export const useAIMeals = (userId?: string | null) => {
  const [aiMealPlans, setAiMealPlans] = useState<AIMealPlan[]>([]);
  const [generatedAIMealPlan, setGeneratedAIMealPlan] = useState<AIMealPlan | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [shoppingList, setShoppingList] = useState<any | null>(null);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);
  const [aiUserProfile, setAiUserProfile] = useState<UserFitnessProfile | null>(null);

  const fetchAIMealPlans = useCallback(async () => {
    if (!userId) return;
    try {
      const plans = await mealPlanService.getUserMealPlans(userId);
      setAiMealPlans(plans);
    } catch (error) {
      console.error('Error fetching AI meal plans:', error);
    }
  }, [userId]);

  const loadUserFitnessProfile = useCallback(async () => {
    if (!userId) return null;
    try {
      const profile = await mealPlanService.getUserFitnessProfile(userId);
      if (profile) {
        setAiUserProfile(profile);
        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error loading AI user profile:', error);
      return null;
    }
  }, [userId]);

  const generateAIMealPlan = useCallback(async (profile: UserFitnessProfile) => {
    if (!userId) {
      toast.error('You must be logged in to generate a plan');
      return null;
    }

    setIsGeneratingAI(true);
    try {
      try {
        await mealPlanService.updateUserFitnessProfile(userId, profile);
      } catch (profileError) {
        console.warn('Failed to update user profile, continuing with meal plan generation:', profileError);
      }

      const mealPlan = await mealPlanService.generateMealPlan(profile);
      setGeneratedAIMealPlan(mealPlan);
      setAiMealPlans(prev => [mealPlan, ...prev]);
      toast.success('AI meal plan generated successfully!');
      return mealPlan;
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      const message = (error as any)?.message || '';
      if (typeof message === 'string' && (message.includes('VITE_AI_PROXY_URL') || message.includes('VITE_AI_PROXY_KEY') || message.includes('Missing AI proxy'))) {
        toast.error('AI is not configured. Please set VITE_AI_PROXY_URL and VITE_AI_PROXY_KEY.');
      } else if (typeof message === 'string' && message.includes('AI proxy failed')) {
        toast.error('AI service error. Please try again in a moment.');
      } else {
        toast.error('Failed to generate AI meal plan. Please try again.');
      }
      return null;
    } finally {
      setIsGeneratingAI(false);
    }
  }, [userId]);

  const generateShoppingList = useCallback(async (mealPlanId: string) => {
    if (!mealPlanId) return null;
    setIsGeneratingShoppingList(true);
    try {
      const shoppingData = await storeLocatorService.generateShoppingList(mealPlanId);
      setShoppingList(shoppingData);
      toast.success('Shopping list generated successfully!');
      return shoppingData;
    } catch (error) {
      console.error('Error generating shopping list:', error);
      toast.error('Failed to generate shopping list. Please try again.');
      return null;
    } finally {
      setIsGeneratingShoppingList(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAIMealPlans();
      loadUserFitnessProfile();
    }
  }, [userId, fetchAIMealPlans, loadUserFitnessProfile]);

  return {
    aiMealPlans,
    generatedAIMealPlan,
    isGeneratingAI,
    shoppingList,
    isGeneratingShoppingList,
    fetchAIMealPlans,
    generateAIMealPlan,
    generateShoppingList,
    setGeneratedAIMealPlan,
  aiUserProfile,
  setAiUserProfile,
  loadUserFitnessProfile
  };
};

export default useAIMeals;
