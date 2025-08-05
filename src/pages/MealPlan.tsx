
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
  Utensils
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
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import NearbyStores from "@/components/meal/NearbyStores";
import NutritionLogger from "@/components/nutrition/NutritionLogger";
import NutritionTargetsModal from "@/components/nutrition/NutritionTargetsModal";
import { useAuth } from "@/hooks/useAuth";
import { useNutrition } from "@/hooks/useNutrition";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRecommendedItems } from "@/services/storeService";
import { supabase } from "@/integrations/supabase/client";

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
  const { profile } = useAuth();
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
  
  // New meal dialog state
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showNutritionTargets, setShowNutritionTargets] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: "",
    description: "",
    mealType: "breakfast",
    calories: "0",
    protein: "0",
    carbs: "0",
    fat: "0",
    recipe: ""
  });
  
  // Searchbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const fetchMealPlans = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      
      try {
        // Fetch user meal plans
        const { data: planData, error: planError } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: true });
          
        if (planError) throw planError;
        setMealPlans(planData || []);
        
        if (planData && planData.length > 0) {
          // Select first plan by default
          setSelectedPlan(planData[0].id);
          
          // Fetch meals for first plan
          const { data: mealData, error: mealError } = await supabase
            .from('meals')
            .select('*')
            .eq('meal_plan_id', planData[0].id)
            .order('meal_type', { ascending: true });
            
          if (mealError) throw mealError;
          setMeals(mealData || []);
          setFilteredMeals(mealData || []);
          
          // Get grocery recommendations
          const items = await getRecommendedItems(planData[0].id);
          setGroceryItems(items);
        }
      } catch (error) {
        console.error("Error fetching meal plans:", error);
        toast.error("Failed to load your meal plans");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMealPlans();
  }, [profile]);
  
  // Function to fetch meals for a selected plan
  const fetchMealsForPlan = async (planId: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('meal_plan_id', planId)
        .order('meal_type', { ascending: true });
        
      if (error) throw error;
      setMeals(data || []);
      setFilteredMeals(data || []);
      
      // Get grocery recommendations
      const items = await getRecommendedItems(planId);
      setGroceryItems(items);
    } catch (error) {
      console.error("Error fetching meals:", error);
      toast.error("Failed to load meals for this plan");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to create a new meal plan
  const createMealPlan = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert([
          {
            user_id: profile.id,
            name: newPlan.name,
            description: newPlan.description || null,
            daily_calorie_target: parseInt(newPlan.calories),
            daily_protein_target: parseFloat(newPlan.protein),
            daily_carbs_target: parseFloat(newPlan.carbs),
            daily_fat_target: parseFloat(newPlan.fat),
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success("Meal plan created successfully!");
      setMealPlans([...mealPlans, ...(data || [])]);
      setShowAddPlan(false);
      setNewPlan({
        name: "",
        description: "",
        calories: "2000",
        protein: "150",
        carbs: "200",
        fat: "70",
        dayOfWeek: ""
      });
      
      // Select the new plan
      if (data && data.length > 0) {
        setSelectedPlan(data[0].id);
        fetchMealsForPlan(data[0].id);
      }
    } catch (error) {
      console.error("Error creating meal plan:", error);
      toast.error("Failed to create meal plan");
    }
  };
  
  // Function to create a new meal
  const createMeal = async () => {
    if (!selectedPlan) return;
    
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert([
          {
            meal_plan_id: selectedPlan,
            name: newMeal.name,
            description: newMeal.description || null,
            meal_type: newMeal.mealType,
            calories: parseInt(newMeal.calories),
            protein: parseFloat(newMeal.protein),
            carbs: parseFloat(newMeal.carbs),
            fat: parseFloat(newMeal.fat),
            recipe: newMeal.recipe || null
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success("Meal added successfully!");
      setMeals([...meals, ...(data || [])]);
      setFilteredMeals([...meals, ...(data || [])]);
      setShowAddMeal(false);
      setNewMeal({
        name: "",
        description: "",
        mealType: "breakfast",
        calories: "0",
        protein: "0",
        carbs: "0",
        fat: "0",
        recipe: ""
      });
    } catch (error) {
      console.error("Error adding meal:", error);
      toast.error("Failed to add meal");
    }
  };
  
  // Function to delete a meal plan
  const deleteMealPlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', planId);
        
      if (error) throw error;
      
      toast.success("Meal plan deleted successfully!");
      setMealPlans(mealPlans.filter(plan => plan.id !== planId));
      
      if (selectedPlan === planId) {
        // Select another plan if available
        if (mealPlans.length > 1) {
          const newSelectedPlan = mealPlans.find(plan => plan.id !== planId);
          if (newSelectedPlan) {
            setSelectedPlan(newSelectedPlan.id);
            fetchMealsForPlan(newSelectedPlan.id);
          } else {
            setSelectedPlan(null);
            setMeals([]);
            setFilteredMeals([]);
          }
        } else {
          setSelectedPlan(null);
          setMeals([]);
          setFilteredMeals([]);
        }
      }
    } catch (error) {
      console.error("Error deleting meal plan:", error);
      toast.error("Failed to delete meal plan");
    }
  };
  
  // Function to delete a meal
  const deleteMeal = async (mealId: string) => {
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);
        
      if (error) throw error;
      
      toast.success("Meal deleted successfully!");
      const updatedMeals = meals.filter(meal => meal.id !== mealId);
      setMeals(updatedMeals);
      setFilteredMeals(updatedMeals.filter(meal => 
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (meal.description && meal.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ));
    } catch (error) {
      console.error("Error deleting meal:", error);
      toast.error("Failed to delete meal");
    }
  };
  
  // Function to toggle grocery item check
  const toggleGroceryItem = (index: number) => {
    const updatedItems = [...groceryItems];
    updatedItems[index].checked = !updatedItems[index].checked;
    setGroceryItems(updatedItems);
  };
  
  // Function to handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredMeals(meals);
      return;
    }
    
    const filtered = meals.filter(meal => 
      meal.name.toLowerCase().includes(query.toLowerCase()) ||
      (meal.description && meal.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredMeals(filtered);
  };
  
  // Get day name from number
  const getDayName = (dayNumber: number | null | undefined) => {
    if (dayNumber === null || dayNumber === undefined) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber];
  };
  
  // Calculate macro percentages
  const calculateMacroPercentage = (macro: number, calories: number) => {
    if (calories === 0) return 0;
    
    let caloriesFromMacro = 0;
    switch (macro) {
      case 0: // protein
        caloriesFromMacro = meals.reduce((sum, meal) => sum + meal.protein * 4, 0);
        break;
      case 1: // carbs
        caloriesFromMacro = meals.reduce((sum, meal) => sum + meal.carbs * 4, 0);
        break;
      case 2: // fat
        caloriesFromMacro = meals.reduce((sum, meal) => sum + meal.fat * 9, 0);
        break;
    }
    
    return Math.round((caloriesFromMacro / calories) * 100);
  };
  
  // Group meals by type
  const getMealsByType = (mealType: string) => {
    return filteredMeals.filter(meal => meal.meal_type === mealType);
  };

  const currentPlan = mealPlans.find(plan => plan.id === selectedPlan);
  
  // Calculate total calories and macros for current meals
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  return (
    <DashboardLayout title="Meal Planning">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Smart Meal Planning
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
          Plan your meals, track nutrients, and find ingredients at nearby stores.
        </p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>🎯 Set targets</span>
              <span>•</span>
              <span>📊 Track macros</span>
              <span>•</span>
              <span>🛒 Find stores</span>
            </div>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="meal-plans"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Meal Plans
            </TabsTrigger>
            <TabsTrigger 
              value="nutrition"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <Target className="h-4 w-4 mr-2" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger 
              value="groceries"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Grocery List
            </TabsTrigger>
            <TabsTrigger 
              value="stores"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <Map className="h-4 w-4 mr-2" />
              Nearby Stores
            </TabsTrigger>
          </TabsList>
          
          {/* Meal Plans Tab */}
          <TabsContent value="meal-plans">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold flex items-center text-gray-900 dark:text-white">
                <Calendar className="mr-2 h-5 w-5" />
                Your Meal Plans
          </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {mealPlans.length === 0 
                    ? "Create your first meal plan to start tracking nutrition"
                    : `${mealPlans.length} plan${mealPlans.length !== 1 ? 's' : ''} created`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {mealPlans.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
                )}
                <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
                  <DialogTrigger asChild>
                    <Button className="bg-fitness-primary hover:bg-fitness-primary/90 shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {mealPlans.length === 0 ? 'Create First Plan' : 'New Plan'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Meal Plan</DialogTitle>
                      <DialogDescription>
                        Create a custom meal plan with your target macros.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan Name</Label>
                        <Input
                          id="plan-name"
                          placeholder="e.g., Weight Loss Plan"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        />
            </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-description">Description (optional)</Label>
                        <Input
                          id="plan-description"
                          placeholder="Describe your meal plan..."
                          value={newPlan.description}
                          onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                        />
            </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-day">Day of Week (optional)</Label>
                        <Select
                          value={newPlan.dayOfWeek}
                          onValueChange={(value) => setNewPlan({...newPlan, dayOfWeek: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any day</SelectItem>
                            <SelectItem value="0">Monday</SelectItem>
                            <SelectItem value="1">Tuesday</SelectItem>
                            <SelectItem value="2">Wednesday</SelectItem>
                            <SelectItem value="3">Thursday</SelectItem>
                            <SelectItem value="4">Friday</SelectItem>
                            <SelectItem value="5">Saturday</SelectItem>
                            <SelectItem value="6">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
            </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-calories">Target Calories</Label>
                        <Input
                          id="plan-calories"
                          type="number"
                          value={newPlan.calories}
                          onChange={(e) => setNewPlan({...newPlan, calories: e.target.value})}
                        />
            </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="plan-protein">Protein (g)</Label>
                          <Input
                            id="plan-protein"
                            type="number"
                            value={newPlan.protein}
                            onChange={(e) => setNewPlan({...newPlan, protein: e.target.value})}
                          />
          </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-carbs">Carbs (g)</Label>
                          <Input
                            id="plan-carbs"
                            type="number"
                            value={newPlan.carbs}
                            onChange={(e) => setNewPlan({...newPlan, carbs: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-fat">Fat (g)</Label>
                          <Input
                            id="plan-fat"
                            type="number"
                            value={newPlan.fat}
                            onChange={(e) => setNewPlan({...newPlan, fat: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddPlan(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createMealPlan} disabled={!newPlan.name}>
                        Create Plan
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
          </div>
        </div>
        
            {showSearch && (
            <div className="mb-4">
                <Input 
                  placeholder="Search meals..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                />
              </div>
            )}
            
            <div className="grid grid-cols-12 gap-6">
              {/* Main Content Area */}
                {mealPlans.length === 0 ? (
              // Empty State - No Meal Plans
              <div className="col-span-12">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="relative">
                      <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-6" />
                      <div className="absolute -top-2 -right-2 bg-fitness-primary text-white rounded-full p-2">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Start Your Meal Planning Journey
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      Create your first meal plan to track nutrition, manage macros, and achieve your fitness goals with personalized meal recommendations.
                    </p>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        🎯 Set calorie targets • 📊 Track macros • 🍽️ Plan meals
                      </div>
                    </div>
                  </div>
                </div>
            </div>
                ) : (
              // Meal Plans Layout
              <div className="col-span-12 lg:col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white">Your Meal Plans</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {mealPlans.length} plan{mealPlans.length !== 1 ? 's' : ''}
                    </p>
                    </div>
                  <div className="p-2 max-h-96 overflow-y-auto">
                      {mealPlans.map((plan) => (
                        <div
                          key={plan.id}
                        className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                            selectedPlan === plan.id
                            ? 'bg-fitness-primary bg-opacity-10 border border-fitness-primary text-fitness-primary'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                          }`}
                          onClick={() => {
                            setSelectedPlan(plan.id);
                            fetchMealsForPlan(plan.id);
                          }}
                        >
                          <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {plan.name}
                            </div>
                              {plan.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {plan.description}
                                </div>
                              )}
                            <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <Target className="h-3 w-3 mr-1" />
                              <span>{plan.daily_calorie_target} kcal target</span>
                              </div>
                            </div>
                            <button
                            className="text-red-500 hover:text-red-600 text-sm ml-2 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMealPlan(plan.id);
                              }}
                            title="Delete plan"
                            >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            )}
              
              {/* Meal Details */}
              <div className="col-span-12 lg:col-span-9">
                {selectedPlan ? (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {currentPlan?.name}
                            </h3>
                            {currentPlan?.description && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {currentPlan.description}
                              </p>
                            )}
                            <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <Target className="h-4 w-4 mr-1" />
                              <span>{currentPlan?.daily_calorie_target} kcal target</span>
                            </div>
                          </div>
                          <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
                            <DialogTrigger asChild>
                              <Button className="bg-fitness-primary hover:bg-fitness-primary/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Meal
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Meal</DialogTitle>
                                <DialogDescription>
                                  Add a new meal to your plan.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="meal-name">Meal Name</Label>
                                  <Input
                                    id="meal-name"
                                    placeholder="e.g., Chicken Salad"
                                    value={newMeal.name}
                                    onChange={(e) => setNewMeal({...newMeal, name: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="meal-description">Description (optional)</Label>
                                  <Input
                                    id="meal-description"
                                    placeholder="Describe your meal..."
                                    value={newMeal.description}
                                    onChange={(e) => setNewMeal({...newMeal, description: e.target.value})}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="meal-type">Meal Type</Label>
                                  <Select
                                    value={newMeal.mealType}
                                    onValueChange={(value) => setNewMeal({...newMeal, mealType: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select meal type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="breakfast">Breakfast</SelectItem>
                                      <SelectItem value="lunch">Lunch</SelectItem>
                                      <SelectItem value="dinner">Dinner</SelectItem>
                                      <SelectItem value="snack">Snack</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="meal-calories">Calories</Label>
                                  <Input
                                    id="meal-calories"
                                    type="number"
                                    value={newMeal.calories}
                                    onChange={(e) => setNewMeal({...newMeal, calories: e.target.value})}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="meal-protein">Protein (g)</Label>
                                    <Input
                                      id="meal-protein"
                                      type="number"
                                      value={newMeal.protein}
                                      onChange={(e) => setNewMeal({...newMeal, protein: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="meal-carbs">Carbs (g)</Label>
                                    <Input
                                      id="meal-carbs"
                                      type="number"
                                      value={newMeal.carbs}
                                      onChange={(e) => setNewMeal({...newMeal, carbs: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="meal-fat">Fat (g)</Label>
                                    <Input
                                      id="meal-fat"
                                      type="number"
                                      value={newMeal.fat}
                                      onChange={(e) => setNewMeal({...newMeal, fat: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="meal-recipe">Recipe (optional)</Label>
                                  <textarea
                                    id="meal-recipe"
                                    rows={3}
                                    className="w-full p-2 border rounded-md resize-none"
                                    placeholder="Add recipe instructions..."
                                    value={newMeal.recipe}
                                    onChange={(e) => setNewMeal({...newMeal, recipe: e.target.value})}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAddMeal(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={createMeal} disabled={!newMeal.name}>
                                  Add Meal
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {/* Nutrition Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-4">
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
                            <div className="font-semibold text-xl">{totalCalories} kcal</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              of {currentPlan?.daily_calorie_target} kcal target
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Protein</div>
                            <div className="font-semibold text-xl">{Math.round(totalProtein)}g</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {calculateMacroPercentage(0, totalCalories)}% of calories
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Carbs</div>
                            <div className="font-semibold text-xl">{Math.round(totalCarbs)}g</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {calculateMacroPercentage(1, totalCalories)}% of calories
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                            <div className="text-sm text-gray-500 dark:text-gray-400">Fat</div>
                            <div className="font-semibold text-xl">{Math.round(totalFat)}g</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {calculateMacroPercentage(2, totalCalories)}% of calories
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Meal List */}
                    <div>
                      {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                        const mealsOfType = getMealsByType(mealType);
                        if (mealsOfType.length === 0 && searchQuery) return null;
                        
                        return (
                          <div key={mealType} className="mb-6">
                            <h4 className="text-lg font-medium mb-3 capitalize">
                              {mealType}
                            </h4>
                            {mealsOfType.length === 0 ? (
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                                <p className="text-gray-500">
                                  No {mealType} meals added yet.
                                </p>
                                <Button
                                  variant="outline"
                                  className="mt-3"
                                  onClick={() => {
                                    setNewMeal({...newMeal, mealType});
                                    setShowAddMeal(true);
                                  }}
                                >
                                  Add {mealType}
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {mealsOfType.map((meal) => (
                                  <div
                                    key={meal.id}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h5 className="font-medium">{meal.name}</h5>
                                        {meal.description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {meal.description}
                                          </p>
                                        )}
                                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                                            <Utensils className="h-3 w-3 mr-1" />
                                            <span>{meal.calories} kcal</span>
                                          </div>
                                          <span>·</span>
                                          <span>{meal.protein}g protein</span>
                                          <span>·</span>
                                          <span>{meal.carbs}g carbs</span>
                                          <span>·</span>
                                          <span>{meal.fat}g fat</span>
                                        </div>
                                      </div>
                                      <button
                                        className="text-red-500 hover:text-red-600 text-sm"
                                        onClick={() => deleteMeal(meal.id)}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                    
                                    {meal.recipe && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="text-xs font-medium mb-1">Recipe</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {meal.recipe}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="col-span-12 lg:col-span-9">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-10 text-center">
                    <Utensils className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                        {mealPlans.length > 0 ? "No Meal Plan Selected" : "Ready to Start Planning?"}
                      </h3>
                    <p className="mt-2 text-gray-500 max-w-md mx-auto">
                      {mealPlans.length > 0 
                        ? "Select a meal plan from the sidebar to view and manage meals."
                          : "Click 'Create First Plan' in the header to get started with your nutrition planning."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Nutrition Tab */}
          <TabsContent value="nutrition">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <Utensils className="mr-2 h-5 w-5" />
                  Nutrition Tracking
                </h3>
                      <Button 
                  variant="outline"
                  onClick={() => setShowNutritionTargets(true)}
                  className="flex items-center gap-2"
                      >
                  <Target className="h-4 w-4" />
                  View Targets
                      </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-md font-medium mb-4">Log Your Meals</h4>
                  <NutritionLogger onLogComplete={() => {
                    // The useNutrition hook will automatically refresh when new data is logged
                    console.log('Nutrition logged successfully');
                  }} />
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-4">Nutrition Overview</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Track your daily nutrition intake and see how it compares to your targets.
                    </p>
                    {nutritionSummary.isLoading ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">Loading nutrition data...</p>
                      </div>
                    ) : nutritionSummary.target ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Daily Target Calories:</span>
                          <span className="font-medium">{nutritionSummary.target.calories}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Daily Target Protein:</span>
                          <span className="font-medium">{nutritionSummary.target.protein}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Daily Target Carbs:</span>
                          <span className="font-medium">{nutritionSummary.target.carbs}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Daily Target Fat:</span>
                          <span className="font-medium">{nutritionSummary.target.fat}g</span>
                        </div>
                        
                        {/* Progress indicators */}
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Calories: {nutritionSummary.current.calories} / {nutritionSummary.target.calories}</span>
                            <span>{nutritionSummary.percentage.calories}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(100, nutritionSummary.percentage.calories)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No nutrition targets set. Update your profile to set targets.</p>
                  </div>
                )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Groceries Tab */}
          <TabsContent value="groceries">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Grocery List
                </h3>
              </div>
              
              {groceryItems.length === 0 ? (
                <div className="text-center py-10">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No Grocery Items</h3>
                  <p className="mt-2 text-gray-500 max-w-md mx-auto">
                    Your grocery list will be generated based on your meal plan.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Group items by category */}
                    {['Protein', 'Grains', 'Vegetables', 'Fruits', 'Dairy', 'Oils', 'Supplements'].map((category) => {
                      const categoryItems = groceryItems.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <h4 className="font-medium mb-3">{category}</h4>
                          <div className="space-y-2">
                            {categoryItems.map((item, index) => (
                              <div 
                                key={index}
                                className="flex items-center"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 focus:ring-fitness-primary"
                                  checked={item.checked || false}
                                  onChange={() => toggleGroceryItem(
                                    groceryItems.findIndex(i => i.name === item.name)
                                  )}
                                />
                                <span className={`ml-3 ${item.checked ? 'line-through text-gray-400' : ''}`}>
                                  {item.name}
                                </span>
                </div>
              ))}
            </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <Button onClick={() => setActiveTab("stores")}>
                      <Map className="h-4 w-4 mr-2" />
                      Find Stores Nearby
            </Button>
          </div>
        </div>
              )}
            </div>
          </TabsContent>
          
          {/* Stores Tab */}
          <TabsContent value="stores">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center">
                  <Map className="mr-2 h-5 w-5" />
                  Find Nearby Grocery Stores
          </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Locate stores near you that carry the ingredients you need.
                </p>
              </div>
              
              <div className="p-6">
                {locationLoading ? (
                  <div className="text-center py-10">
                    <p>Finding your location...</p>
                  </div>
                ) : latitude && longitude ? (
                  <NearbyStores 
                    latitude={latitude}
                    longitude={longitude}
                    radiusInKm={5}
                    ingredients={groceryItems.map(item => item.name)}
                  />
                ) : (
                  <div className="text-center py-10">
                    <p>
                      Location access is required to find nearby stores.
                      Please enable location services in your browser.
                    </p>
              </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Nutrition Targets Modal */}
      <NutritionTargetsModal
        isOpen={showNutritionTargets}
        onClose={() => setShowNutritionTargets(false)}
        onTargetsUpdated={() => {
          // Refresh nutrition data if needed
          console.log('Nutrition targets updated');
        }}
      />
    </DashboardLayout>
  );
};

export default MealPlan;
