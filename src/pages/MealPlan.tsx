
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
import { useAuth } from "@/hooks/useAuth";
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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  day_of_week?: number;
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
    dayOfWeek: ""
  });
  
  // New meal dialog state
  const [showAddMeal, setShowAddMeal] = useState(false);
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
          .order('day_of_week', { ascending: true });
          
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
            calories: parseInt(newPlan.calories),
            protein: parseFloat(newPlan.protein),
            carbs: parseFloat(newPlan.carbs),
            fat: parseFloat(newPlan.fat),
            day_of_week: newPlan.dayOfWeek ? parseInt(newPlan.dayOfWeek) : null
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
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Plan your meals, track nutrients, and find ingredients at nearby stores.
        </p>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="meal-plans">Meal Plans</TabsTrigger>
            <TabsTrigger value="groceries">Grocery List</TabsTrigger>
            <TabsTrigger value="stores">Nearby Stores</TabsTrigger>
          </TabsList>
          
          {/* Meal Plans Tab */}
          <TabsContent value="meal-plans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Your Meal Plans
              </h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Dialog open={showAddPlan} onOpenChange={setShowAddPlan}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Plan
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
                            <SelectItem value="">Any day</SelectItem>
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
              {/* Meal Plan Sidebar */}
              <div className="col-span-12 lg:col-span-3">
                {mealPlans.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">No Meal Plans</h3>
                    <p className="mt-2 text-gray-500 max-w-xs mx-auto">
                      Create your first meal plan to start tracking your nutrition.
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setShowAddPlan(true)}
                    >
                      Create Your First Plan
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b">
                      <h4 className="font-medium">Your Meal Plans</h4>
                    </div>
                    <div className="p-2">
                      {mealPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`p-3 rounded-md mb-1 cursor-pointer ${
                            selectedPlan === plan.id
                              ? 'bg-fitness-primary bg-opacity-10 text-fitness-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedPlan(plan.id);
                            fetchMealsForPlan(plan.id);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{plan.name}</div>
                              {plan.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {plan.description}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getDayName(plan.day_of_week)} · {plan.calories} kcal
                              </div>
                            </div>
                            <button
                              className="text-red-500 hover:text-red-600 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMealPlan(plan.id);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Meal Details */}
              <div className="col-span-12 lg:col-span-9">
                {selectedPlan ? (
                  <>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold">{currentPlan?.name}</h3>
                            {currentPlan?.description && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1">
                                {currentPlan.description}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-2">
                              {getDayName(currentPlan?.day_of_week)}
                            </p>
                          </div>
                          <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
                            <DialogTrigger asChild>
                              <Button>
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
                              of {currentPlan?.calories} kcal target
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
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-10 text-center">
                    <Utensils className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">No Meal Plan Selected</h3>
                    <p className="mt-2 text-gray-500 max-w-md mx-auto">
                      {mealPlans.length > 0 
                        ? "Select a meal plan from the sidebar to view and manage meals."
                        : "Create your first meal plan to get started with your nutrition planning."}
                    </p>
                    {mealPlans.length === 0 && (
                      <Button 
                        className="mt-4" 
                        onClick={() => setShowAddPlan(true)}
                      >
                        Create Your First Plan
                      </Button>
                    )}
                  </div>
                )}
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
    </DashboardLayout>
  );
};

export default MealPlan;
