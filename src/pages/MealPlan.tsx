
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  List,
  Map,
  Plus,
  Search,
  ShoppingBag,
  Target,
  Utensils,
  Sparkles,
  Store,
  Loader2,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NearbyStores from "@/components/meal/NearbyStores";
import NutritionLogger from "@/components/nutrition/NutritionLogger";
import NutritionTargetsModal from "@/components/nutrition/NutritionTargetsModal";
import { useAuth } from "@/hooks/useAuth";
import { useNutrition } from "@/hooks/useNutrition";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRecommendedItems } from "@/services/storeService";
import { supabase } from "@/integrations/supabase/client";
// Import the new AI meal plan services
import { mealPlanService, UserFitnessProfile, MealPlan as AIMealPlan } from "@/services/meal_plan_service";
import { storeLocatorService, Store as StoreData } from "@/services/store_locator_service";

interface Meal {
  id: string;
  meal_plan_id: string;
  name: string;
  description?: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: string;
}

interface MealPlan {
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

interface GroceryItem {
  name: string;
  category: string;
  checked?: boolean;
  stores: string[];
}

const MealPlan: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { latitude, longitude, loading: locationLoading } = useGeolocation();
  const [nutritionSummary] = useNutrition(profile?.id);
  
  const [activeTab, setActiveTab] = useState("meal-plans");
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // New plan dialog state
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    calories: "2000",
    protein: "150",
    carbs: "200",
    fat: "70",
    dayOfWeek: "any"
  });

  // AI Meal Plan states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiUserProfile, setAiUserProfile] = useState<UserFitnessProfile>({
    age: profile?.age || 30,
    weight: profile?.weight || 70,
    height: profile?.height || 175,
    activity_level: 'moderately_active', // Default since profile doesn't have this field
    fitness_goal: (profile?.fitness_goal as any) || 'maintenance',
    dietary_preferences: [], // Default since profile doesn't have this field
    allergies: [], // Default since profile doesn't have this field
    budget_per_week: 100
  });
  const [generatedAIMealPlan, setGeneratedAIMealPlan] = useState<AIMealPlan | null>(null);
  const [aiMealPlans, setAiMealPlans] = useState<AIMealPlan[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [isGeneratingShoppingList, setIsGeneratingShoppingList] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchMealPlans();
      fetchAIMealPlans();
      loadUserFitnessProfile();
    }
  }, [profile?.id]);

  // Load user's existing fitness profile for AI meal planning
  const loadUserFitnessProfile = async () => {
    if (!user?.id) return;

    try {
      const userProfile = await mealPlanService.getUserFitnessProfile(user.id);
      if (userProfile) {
        setAiUserProfile(userProfile);
      } else {
        // If no profile exists, create a default one based on the current profile
        const defaultProfile: UserFitnessProfile = {
          age: profile?.age || 30,
          weight: profile?.weight || 70,
          height: profile?.height || 175,
          activity_level: 'moderately_active', // Default since profile doesn't have this field
          fitness_goal: (profile?.fitness_goal as any) || 'maintenance',
          dietary_preferences: [], // Default since profile doesn't have this field
          allergies: [], // Default since profile doesn't have this field
          budget_per_week: 100
        };
        setAiUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error("Error loading user fitness profile:", error);
      // Set default profile on error
      const defaultProfile: UserFitnessProfile = {
        age: profile?.age || 30,
        weight: profile?.weight || 70,
        height: profile?.height || 175,
        activity_level: 'moderately_active', // Default since profile doesn't have this field
        fitness_goal: (profile?.fitness_goal as any) || 'maintenance',
        dietary_preferences: [], // Default since profile doesn't have this field
        allergies: [], // Default since profile doesn't have this field
        budget_per_week: 100
      };
      setAiUserProfile(defaultProfile);
    }
  };

  const fetchMealPlans = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Transform the data to match the MealPlan interface
      const transformedData = (data || []).map((plan: any) => ({
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
      }));
      setMealPlans(transformedData);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      toast.error("Failed to load meal plans");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIMealPlans = async () => {
    if (!user?.id) return;

    try {
      const plans = await mealPlanService.getUserMealPlans(user.id);
      setAiMealPlans(plans);
    } catch (error) {
      console.error("Error fetching AI meal plans:", error);
    }
  };

  const fetchMealsForPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("meal_plan_id", planId)
        .order("meal_type", { ascending: true });

      if (error) throw error;
      setMeals(data || []);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to load meals");
    }
  };

  const createMealPlan = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: profile.id,
          name: newPlan.name,
          description: newPlan.description,
          daily_calorie_target: parseInt(newPlan.calories),
          daily_protein_target: parseInt(newPlan.protein),
          daily_carbs_target: parseInt(newPlan.carbs),
          daily_fat_target: parseInt(newPlan.fat),
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Meal plan created successfully!");
      setShowAddPlan(false);
      setNewPlan({
        name: "",
        description: "",
        calories: "2000",
        protein: "150",
        carbs: "200",
        fat: "70",
        dayOfWeek: "any"
      });
      fetchMealPlans();
    } catch (error) {
      console.error("Error creating meal plan:", error);
      toast.error("Failed to create meal plan");
    }
  };

  const createMeal = async () => {
    if (!selectedPlan) return;

    try {
      const { data, error } = await supabase
        .from("meals")
        .insert({
          meal_plan_id: selectedPlan,
          name: "New Meal",
          meal_type: "breakfast",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Meal added successfully!");
      fetchMealsForPlan(selectedPlan);
    } catch (error) {
      console.error("Error creating meal:", error);
      toast.error("Failed to create meal");
    }
  };

  const deleteMealPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast.success("Meal plan deleted successfully!");
      fetchMealPlans();
      if (selectedPlan === planId) {
        setSelectedPlan(null);
        setMeals([]);
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast.error("Failed to delete meal plan");
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from("meals")
        .delete()
        .eq("id", mealId);

      if (error) throw error;

      toast.success("Meal deleted successfully!");
      fetchMealsForPlan(selectedPlan!);
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Failed to delete meal");
    }
  };

  const toggleGroceryItem = (index: number) => {
    setGroceryItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setShowSearch(true);
      // Implement search logic here
    } else {
      setShowSearch(false);
    }
  };

  const getDayName = (dayNumber: number | null | undefined) => {
    if (dayNumber === null || dayNumber === undefined) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber] || "Any day";
  };

  const calculateMacroPercentage = (macro: number, calories: number) => {
    const macroCalories = macro * 4; // 4 calories per gram for protein and carbs
    return Math.round((macroCalories / calories) * 100);
  };

  const getMealsByType = (mealType: string) => {
    return meals.filter(meal => meal.meal_type === mealType);
  };

  // AI Meal Plan functions
  const generateAIMealPlan = async () => {
    if (!user?.id) return;

    setIsGeneratingAI(true);
    try {
      // Try to update user profile with current AI profile data
      try {
        await mealPlanService.updateUserFitnessProfile(user.id, aiUserProfile);
      } catch (profileError) {
        console.warn("Failed to update user profile, continuing with meal plan generation:", profileError);
        // Continue with meal plan generation even if profile update fails
      }
      
      // Generate the meal plan
      const mealPlan = await mealPlanService.generateMealPlan(aiUserProfile);
      setGeneratedAIMealPlan(mealPlan);
      setAiMealPlans(prev => [mealPlan, ...prev]);
      toast.success("AI meal plan generated successfully!");
      setShowAIGenerator(false);
    } catch (error) {
      console.error("Error generating AI meal plan:", error);
      toast.error("Failed to generate AI meal plan. Please try again.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateShoppingList = async (mealPlanId: string) => {
    if (!mealPlanId) return;

    setIsGeneratingShoppingList(true);
    try {
      const shoppingData = await storeLocatorService.generateShoppingList(mealPlanId);
      setShoppingList(shoppingData);
      toast.success("Shopping list generated successfully!");
    } catch (error) {
      console.error("Error generating shopping list:", error);
      toast.error("Failed to generate shopping list. Please try again.");
    } finally {
      setIsGeneratingShoppingList(false);
    }
  };

  const handleAIProfileChange = (field: keyof UserFitnessProfile, value: any) => {
    setAiUserProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleDietaryPreferenceChange = (preference: string, checked: boolean) => {
    setAiUserProfile(prev => ({
      ...prev,
      dietary_preferences: checked
        ? [...prev.dietary_preferences, preference]
        : prev.dietary_preferences.filter(p => p !== preference)
    }));
  };

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'keto', 'paleo', 'mediterranean', 'low-carb'
  ];

  return (
    <DashboardLayout title="Meal Planning">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Meal Planning</h1>
              <p className="text-green-100">
                Plan your meals, track nutrients, and find ingredients at nearby stores.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddPlan(true)}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
              <Button
                onClick={() => setShowAIGenerator(true)}
                className="bg-white text-green-600 hover:bg-green-50"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Meal Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="meal-plans" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Meal Plans
            </TabsTrigger>
            <TabsTrigger value="ai-plans" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Plans
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Shopping
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger value="stores" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Nearby Stores
            </TabsTrigger>
          </TabsList>

          {/* Traditional Meal Plans Tab */}
          <TabsContent value="meal-plans" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : mealPlans.length === 0 ? (
              <div className="text-center py-12">
                <Utensils className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Meal Plans Yet</h3>
                <p className="text-gray-500 mb-6">
                  Create your first meal plan to start tracking your nutrition.
                </p>
                <Button onClick={() => setShowAddPlan(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Plan
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {mealPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-6 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      fetchMealsForPlan(plan.id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-gray-600 mb-3">{plan.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>{plan.daily_calorie_target} cal/day</span>
                          <span>P: {plan.daily_protein_target}g</span>
                          <span>C: {plan.daily_carbs_target}g</span>
                          <span>F: {plan.daily_fat_target}g</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMealPlan(plan.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Plan Details */}
            {selectedPlan && (
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Plan Details</h3>
                  <Button onClick={createMeal} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Meal
                  </Button>
                </div>
                <div className="grid gap-4">
                  {["breakfast", "lunch", "dinner", "snack"].map((mealType) => (
                    <div key={mealType} className="border rounded p-4">
                      <h4 className="font-medium mb-2 capitalize">{mealType}</h4>
                      {getMealsByType(mealType).length === 0 ? (
                        <p className="text-gray-500 text-sm">No meals added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {getMealsByType(mealType).map((meal) => (
                            <div
                              key={meal.id}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <p className="font-medium">{meal.name}</p>
                                <p className="text-sm text-gray-600">
                                  {meal.calories} cal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMeal(meal.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* AI Meal Plans Tab */}
          <TabsContent value="ai-plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">AI-Generated Meal Plans</h2>
                <p className="text-gray-600">
                  Get personalized meal plans created by AI based on your fitness goals and preferences.
                </p>
              </div>
              <Button onClick={() => setShowAIGenerator(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New Plan
              </Button>
            </div>

            {aiMealPlans.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No AI Meal Plans Yet</h3>
                <p className="text-gray-500 mb-6">
                  Generate your first AI-powered meal plan tailored to your goals.
                </p>
                <Button onClick={() => setShowAIGenerator(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate AI Meal Plan
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {aiMealPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="mb-2">
                            Week of {new Date(plan.week_start_date).toLocaleDateString()}
                          </CardTitle>
                          <CardDescription className="mb-2">
                            {plan.daily_calories} calories/day • {plan.fitness_goal.replace('_', ' ')}
                          </CardDescription>
                          <div className="flex gap-2">
                            {plan.dietary_preferences.map((pref) => (
                              <Badge key={pref} variant="secondary" className="text-xs">
                                {pref}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGeneratedAIMealPlan(plan)}
                          >
                            View Plan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateShoppingList(plan.id)}
                            disabled={isGeneratingShoppingList}
                          >
                            {isGeneratingShoppingList ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShoppingBag className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Generated AI Meal Plan Display */}
            {generatedAIMealPlan && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Your AI-Generated Meal Plan</CardTitle>
                      <CardDescription>
                        {generatedAIMealPlan.daily_calories} calories/day • {generatedAIMealPlan.fitness_goal.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedAIMealPlan(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {generatedAIMealPlan.meals.map((day, index) => (
                      <div key={index} className="border rounded p-4">
                        <h4 className="font-semibold mb-3">{day.day}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <MealCard meal={day.breakfast} mealType="Breakfast" />
                          <MealCard meal={day.lunch} mealType="Lunch" />
                          <MealCard meal={day.dinner} mealType="Dinner" />
                          <div className="space-y-2">
                            <h5 className="font-medium text-green-600">Snacks</h5>
                            {day.snacks.map((snack, idx) => (
                              <div key={idx} className="p-2 bg-green-50 rounded">
                                <p className="text-sm font-medium">{snack.name}</p>
                                <p className="text-xs text-gray-600">{snack.calories} cal</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Shopping List Tab */}
          <TabsContent value="shopping" className="space-y-6">
            {shoppingList ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Grocery List
                      </CardTitle>
                      <CardDescription>
                        Estimated total: ${shoppingList.estimatedCost}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {shoppingList.groceryItems.map((item: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2 p-2 rounded border">
                            <Checkbox />
                            <span className="flex-1">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Map className="mr-2 h-5 w-5" />
                        Nearby Stores
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {shoppingList.storesWithInventory.slice(0, 3).map((store: StoreData) => (
                        <StoreCard key={store.id} store={store} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No Shopping List Yet</h3>
                <p className="text-gray-500 mb-6">
                  Generate a shopping list from an AI meal plan to see nearby stores and ingredient availability.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-6">
            <div className="grid gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
                  <p className="text-gray-600">
                    Log your daily nutrition and track your progress.
                  </p>
                </div>
                <NutritionTargetsModal 
                  isOpen={false}
                  onClose={() => {}}
                  onTargetsUpdated={() => {}}
                />
              </div>
              
              <div className="grid gap-6">
                <NutritionLogger />
              </div>
            </div>
          </TabsContent>

          {/* Nearby Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Nearby Stores</h2>
              <p className="text-gray-600">
                Find grocery stores near you and check ingredient availability.
              </p>
            </div>
            {latitude && longitude && !locationLoading ? (
              <NearbyStores 
                latitude={latitude}
                longitude={longitude}
                radiusInKm={5}
                ingredients={groceryItems.map(item => item.name)}
              />
            ) : locationLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Getting your location...</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Map className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Location Required</h3>
                <p className="text-gray-500 mb-6">
                  Please enable location access to find nearby stores.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Traditional Meal Plan Dialog */}
        <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Meal Plan</DialogTitle>
              <DialogDescription>
                Set up a new meal plan with your nutrition targets.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="e.g., Weekly Meal Plan"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="calories">Daily Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={newPlan.calories}
                    onChange={(e) => setNewPlan({ ...newPlan, calories: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={newPlan.protein}
                    onChange={(e) => setNewPlan({ ...newPlan, protein: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={newPlan.carbs}
                    onChange={(e) => setNewPlan({ ...newPlan, carbs: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={newPlan.fat}
                    onChange={(e) => setNewPlan({ ...newPlan, fat: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPlan(false)}>
                Cancel
              </Button>
              <Button onClick={createMealPlan}>Create Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Meal Plan Generator Dialog */}
        <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Meal Plan Generator
              </DialogTitle>
              <DialogDescription>
                Configure your profile to generate a personalized AI meal plan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ai-age">Age</Label>
                  <Input
                    id="ai-age"
                    type="number"
                    value={aiUserProfile.age}
                    onChange={(e) => handleAIProfileChange('age', parseInt(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ai-weight">Weight (kg)</Label>
                  <Input
                    id="ai-weight"
                    type="number"
                    value={aiUserProfile.weight}
                    onChange={(e) => handleAIProfileChange('weight', parseFloat(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ai-height">Height (cm)</Label>
                  <Input
                    id="ai-height"
                    type="number"
                    value={aiUserProfile.height}
                    onChange={(e) => handleAIProfileChange('height', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Activity Level</Label>
                  <Select
                    value={aiUserProfile.activity_level}
                    onValueChange={(value) => handleAIProfileChange('activity_level', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="lightly_active">Lightly Active</SelectItem>
                      <SelectItem value="moderately_active">Moderately Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Fitness Goal</Label>
                  <Select
                    value={aiUserProfile.fitness_goal}
                    onValueChange={(value) => handleAIProfileChange('fitness_goal', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Weekly Budget ($)</Label>
                <Input
                  type="number"
                  value={aiUserProfile.budget_per_week}
                  onChange={(e) => handleAIProfileChange('budget_per_week', parseFloat(e.target.value))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Dietary Preferences</Label>
                <div className="grid grid-cols-2 gap-2">
                  {dietaryOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ai-${option}`}
                        checked={aiUserProfile.dietary_preferences.includes(option)}
                        onCheckedChange={(checked) => handleDietaryPreferenceChange(option, checked as boolean)}
                      />
                      <Label htmlFor={`ai-${option}`} className="text-sm capitalize">
                        {option.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateAIMealPlan} 
                disabled={isGeneratingAI}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Meal Plan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// Meal Card component for AI meal plans
interface MealCardProps {
  meal: any;
  mealType: string;
}

const MealCard: React.FC<MealCardProps> = ({ meal, mealType }) => {
  const mealTypeColors = {
    'Breakfast': 'bg-yellow-50 text-yellow-600 border-yellow-200',
    'Lunch': 'bg-blue-50 text-blue-600 border-blue-200',
    'Dinner': 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${mealTypeColors[mealType as keyof typeof mealTypeColors]}`}>
      <h4 className="font-semibold mb-2">{mealType}</h4>
      <h5 className="font-medium text-sm mb-1">{meal.name}</h5>
      <p className="text-xs text-gray-600 mb-2">{meal.description}</p>
      <div className="flex justify-between text-xs">
        <span>{meal.calories} cal</span>
        <span className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {meal.prep_time}min
        </span>
      </div>
      <div className="mt-2 text-xs">
        <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
          P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
        </span>
      </div>
    </div>
  );
};

// Store Card component for shopping list
interface StoreCardProps {
  store: StoreData;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const inStockCount = store.inventory.filter(item => item.in_stock).length;
  const totalItems = store.inventory.length;

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold">{store.name}</h4>
          <p className="text-xs text-gray-600">{store.address}</p>
        </div>
        <Badge variant={inStockCount === totalItems ? 'default' : 'secondary'}>
          {Math.round(store.distance)}m away
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center text-green-600">
          <Check className="w-4 h-4 mr-1" />
          {inStockCount}/{totalItems} items
        </span>
        <span className="text-gray-500">{store.phone}</span>
      </div>
    </div>
  );
};

export default MealPlan;
