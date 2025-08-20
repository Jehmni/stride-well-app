
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
  Zap,
  Flame,
  Apple,
  Carrot,
  Fish,
  Beef
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
import NutritionLogger from "@/components/nutrition/NutritionLogger";
import NutritionTargetsModal from "@/components/nutrition/NutritionTargetsModal";
// Modularized meal components
import MealCard from '@/components/meal/MealCard';
import StoreCard from '@/components/meal/StoreCard';
import MealPlansTab from '@/components/meal/MealPlansTab';
import AIPlansTab from '@/components/meal/AIPlansTab';
import ShoppingTab from '@/components/meal/ShoppingTab';
import NutritionTab from '@/components/meal/NutritionTab';
import StoresTab from '@/components/meal/StoresTab';
import useMealPlans from '@/hooks/useMealPlans';
import useAIMeals from '@/hooks/useAIMeals';
import useMeals from '@/hooks/useMeals';
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
  const { meals, fetchMealsForPlan: fetchMealsForPlanHook, createMeal: createMealHook, deleteMeal: deleteMealHook, setMeals } = useMeals(selectedPlan);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Hook-backed data and actions
  const {
    mealPlans: hookMealPlans,
    isLoading: hookIsLoading,
    fetchMealPlans: fetchMealPlansHook,
    createMealPlan: createMealPlanHook,
    deleteMealPlan: deleteMealPlanHook
  } = useMealPlans(profile?.id);

  // useAIMeals is destructured later (with aiUserProfile and loadUserFitnessProfile)

  // Sync mealPlans loading state into local UI state
  React.useEffect(() => setMealPlans(hookMealPlans as any || []), [hookMealPlans]);
  React.useEffect(() => setIsLoading(!!hookIsLoading), [hookIsLoading]);
  
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

  // AI Meal Plan states moved into hook
  const {
    aiMealPlans: hookAiMealPlans,
    generatedAIMealPlan: hookGeneratedAIMealPlan,
    isGeneratingAI: hookIsGeneratingAI,
    shoppingList: hookShoppingList,
    isGeneratingShoppingList: hookIsGeneratingShoppingList,
    fetchAIMealPlans: fetchAIMealPlansHook,
    generateAIMealPlan: generateAIMealPlanHook,
    generateShoppingList: generateShoppingListHook,
    setGeneratedAIMealPlan: setGeneratedAIMealPlanHook,
    aiUserProfile,
    setAiUserProfile,
    loadUserFitnessProfile
  } = useAIMeals(user?.id || profile?.id);

  useEffect(() => {
    if (profile?.id) {
      // delegate to hooks
      fetchMealPlansHook();
      // ensure hook loads/stores the AI profile and plans
      loadUserFitnessProfile();
    }
  }, [profile?.id]);

  // AI state and profile are managed by useAIMeals hook

  // Dialog control for AI generator UI
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const fetchMealPlans = async () => {
  // implemented in useMealPlans hook
  await fetchMealPlansHook();
  };

  const fetchAIMealPlans = async () => {
  // implemented in useAIMeals hook
  await fetchAIMealPlansHook();
  };

  // meals are managed by useMeals hook (fetchMealsForPlanHook)

  const createMealPlan = async () => {
    if (!profile?.id) return;
    const created = await createMealPlanHook(profile.id, {
      name: newPlan.name,
      description: newPlan.description,
      calories: parseInt(newPlan.calories),
      protein: parseInt(newPlan.protein),
      carbs: parseInt(newPlan.carbs),
      fat: parseInt(newPlan.fat)
    });

    if (created) {
      setShowAddPlan(false);
      setNewPlan({ name: '', description: '', calories: '2000', protein: '150', carbs: '200', fat: '70', dayOfWeek: 'any' });
    }
  };

  const handleCreateMeal = async () => {
    if (!selectedPlan) return;
    await createMealHook(selectedPlan);
  };

  const deleteMealPlan = async (planId: string) => {
    await deleteMealPlanHook(planId);
    if (selectedPlan === planId) {
      setSelectedPlan(null);
      setMeals([]);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    await deleteMealHook(mealId, selectedPlan || undefined);
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
    if (!user?.id || !aiUserProfile) return;
    const plan = await generateAIMealPlanHook(aiUserProfile);
    if (plan) setShowAIGenerator(false);
  };

  const generateShoppingList = async (mealPlanId: string) => {
  if (!mealPlanId) return;
  await generateShoppingListHook(mealPlanId);
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
            <MealPlansTab
              isLoading={isLoading}
              mealPlans={mealPlans}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              fetchMealsForPlan={fetchMealsForPlanHook}
              createMeal={handleCreateMeal}
              deleteMealPlan={deleteMealPlan}
            />

            {/* Selected Plan Details kept here to avoid moving DB interaction right now */}
            {selectedPlan && (
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Plan Details</h3>
                  <Button onClick={handleCreateMeal} size="sm">
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
                                onClick={() => handleDeleteMeal(meal.id)}
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
            <AIPlansTab
              aiMealPlans={hookAiMealPlans}
              setGeneratedAIMealPlan={setGeneratedAIMealPlanHook}
              generateShoppingList={generateShoppingList}
              isGeneratingShoppingList={hookIsGeneratingShoppingList}
              generatedAIMealPlan={hookGeneratedAIMealPlan}
            />

            {/* Generated AI Meal Plan Display kept in parent for now (uses MealCard) */}
            {hookGeneratedAIMealPlan && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Your AI-Generated Meal Plan</CardTitle>
                      <CardDescription>
                        {hookGeneratedAIMealPlan.daily_calories} calories/day  {hookGeneratedAIMealPlan.fitness_goal.replace('_', ' ')}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedAIMealPlanHook(null)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {hookGeneratedAIMealPlan.meals.map((day, index) => (
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
            <ShoppingTab shoppingList={shoppingList} />
          </TabsContent>

          {/* Nutrition Tab */}
          <TabsContent value="nutrition" className="space-y-6">
            <NutritionTab />
          </TabsContent>

          {/* Nearby Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Nearby Stores</h2>
              <p className="text-gray-600">Find grocery stores near you and check ingredient availability.</p>
            </div>
            <StoresTab latitude={latitude} longitude={longitude} locationLoading={locationLoading} groceryItems={groceryItems.map(i => i.name)} />
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
