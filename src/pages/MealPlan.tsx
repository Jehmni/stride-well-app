import React, { useState, useEffect } from "react";
import { Apple, ChevronRight, Cookie, CreditCard, Loader2, Search, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe: string[];
  image: string;
};

type DailyPlan = {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
};

const MealPlan: React.FC = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mealPlan, setMealPlan] = useState<DailyPlan | null>(null);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [dailyCarbs, setDailyCarbs] = useState(0);
  const [dailyFat, setDailyFat] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate nutrition needs based on user profile
  const calculateNutrition = () => {
    if (!profile) return;
    
    // Calculate base calories based on user data
    const calculateBMR = (): number => {
      const weight = profile.weight || 70; // kg
      const height = profile.height || 170; // cm
      const age = profile.age || 30; // years
      const isMale = profile.sex === "male";
      
      // Harris-Benedict equation
      if (isMale) {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    };
    
    // Adjust calories based on fitness goal
    const calculateTDEE = (): number => {
      const bmr = calculateBMR();
      const activityMultiplier = 1.375; // Moderate activity
      let tdee = bmr * activityMultiplier;
      
      switch (profile.fitness_goal) {
        case "weight-loss":
          return Math.round(tdee * 0.85); // 15% deficit
        case "muscle-gain":
          return Math.round(tdee * 1.1); // 10% surplus
        default:
          return Math.round(tdee); // Maintenance
      }
    };
    
    const calories = calculateTDEE();
    setDailyCalories(calories);
    
    // Set macronutrient targets
    const protein = Math.round((profile.weight || 70) * (profile.fitness_goal === "muscle-gain" ? 1.8 : 1.6));
    const fat = Math.round(calories * 0.25 / 9); // 25% of calories from fat, 9 cal per gram
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4); // Remaining calories from carbs
    
    setDailyProtein(protein);
    setDailyFat(fat);
    setDailyCarbs(carbs);
  };
  
  // Fetch meal plan from database
  const fetchMealPlan = async () => {
    if (!profile) return;
    
    try {
      setIsLoading(true);
      
      // First check if the user has a saved meal plan
      const { data: savedMealPlan, error: savedError } = await supabase
        .from('user_meal_plans')
        .select('meal_plan_data')
        .eq('user_id', profile.id)
        .maybeSingle();
      
      if (savedError) throw savedError;
      
      // If user has a saved meal plan, use it
      if (savedMealPlan?.meal_plan_data) {
        setMealPlan(savedMealPlan.meal_plan_data as DailyPlan);
        setIsLoading(false);
        return;
      }
      
      // Otherwise fetch a meal plan for their fitness goal
      const { data: mealPlanData, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('fitness_goal', profile.fitness_goal)
        .single();
      
      if (mealPlanError) throw mealPlanError;
      
      if (mealPlanData) {
        setMealPlan(mealPlanData.meal_plan_data as DailyPlan);
      }
    } catch (error: any) {
      console.error("Error fetching meal plan:", error);
      toast.error("Failed to load your meal plan");
      
      // Fallback to a basic meal plan
      setMealPlan({
        breakfast: {
          id: "default-breakfast",
          name: "Balanced Breakfast",
          calories: 400,
          protein: 25,
          carbs: 40,
          fat: 15,
          recipe: [
            "2 eggs, scrambled",
            "1 slice whole wheat toast",
            "1/2 avocado",
            "1 cup spinach"
          ],
          image: "https://images.unsplash.com/photo-1533089860892-a9b9ac6cd6b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        },
        lunch: {
          id: "default-lunch",
          name: "Protein Bowl",
          calories: 550,
          protein: 35,
          carbs: 45,
          fat: 20,
          recipe: [
            "120g grilled chicken breast",
            "1/2 cup brown rice",
            "1 cup mixed vegetables",
            "1 tbsp olive oil",
            "Herbs and spices to taste"
          ],
          image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        },
        dinner: {
          id: "default-dinner",
          name: "Balanced Dinner",
          calories: 500,
          protein: 30,
          carbs: 40,
          fat: 20,
          recipe: [
            "150g baked fish",
            "1 cup roasted vegetables",
            "1/2 cup quinoa",
            "1 tsp olive oil",
            "Lemon juice and herbs"
          ],
          image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        },
        snacks: [
          {
            id: "default-snack",
            name: "Healthy Snack",
            calories: 200,
            protein: 10,
            carbs: 20,
            fat: 8,
            recipe: [
              "1 apple",
              "2 tbsp natural peanut butter"
            ],
            image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save the current meal plan as favorite
  const saveMealPlan = async () => {
    if (!profile || !mealPlan) return;
    
    try {
      const { error } = await supabase
        .from('user_meal_plans')
        .upsert({
          user_id: profile.id,
          meal_plan_data: mealPlan,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success("Meal plan saved successfully!");
    } catch (error: any) {
      console.error("Error saving meal plan:", error);
      toast.error("Failed to save meal plan");
    }
  };
  
  // Log a meal as eaten
  const logMeal = async (mealType: string, meal: Meal) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('meal_logs')
        .insert({
          user_id: profile.id,
          meal_type: mealType,
          meal_name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          logged_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success(`${meal.name} logged successfully!`);
    } catch (error: any) {
      console.error("Error logging meal:", error);
      toast.error("Failed to log meal");
    }
  };
  
  // Initialize component
  useEffect(() => {
    if (profile) {
      calculateNutrition();
      fetchMealPlan();
    }
  }, [profile]);
  
  // Handle meal plan search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const filterMeals = (meal: Meal) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      meal.name.toLowerCase().includes(term) ||
      meal.recipe.some(ingredient => ingredient.toLowerCase().includes(term))
    );
  };
  
  // Helper functions for UI
  const calculateMealTotal = (meal: Meal): number => meal.calories;
  
  const calculateDailyTotal = (): number => {
    if (!mealPlan) return 0;
    
    return (
      calculateMealTotal(mealPlan.breakfast) +
      calculateMealTotal(mealPlan.lunch) +
      calculateMealTotal(mealPlan.dinner) +
      mealPlan.snacks.reduce((total, snack) => total + calculateMealTotal(snack), 0)
    );
  };
  
  // Calculate current daily macros
  const currentMacros = () => {
    if (!mealPlan) return { protein: 0, carbs: 0, fat: 0 };
    
    const protein = 
      mealPlan.breakfast.protein + 
      mealPlan.lunch.protein + 
      mealPlan.dinner.protein + 
      mealPlan.snacks.reduce((total, snack) => total + snack.protein, 0);
      
    const carbs = 
      mealPlan.breakfast.carbs + 
      mealPlan.lunch.carbs + 
      mealPlan.dinner.carbs + 
      mealPlan.snacks.reduce((total, snack) => total + snack.carbs, 0);
      
    const fat = 
      mealPlan.breakfast.fat + 
      mealPlan.lunch.fat + 
      mealPlan.dinner.fat + 
      mealPlan.snacks.reduce((total, snack) => total + snack.fat, 0);
      
    return { protein, carbs, fat };
  };
  
  const dailyMacros = currentMacros();
  
  const renderMealCard = (meal: Meal, title: string, mealType: string) => (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img 
          src={meal.image} 
          alt={meal.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {meal.calories} kcal
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{meal.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          </div>
          <div className="flex space-x-1">
            <div className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              <span>P: {meal.protein}g</span>
            </div>
            <div className="flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
              <span>C: {meal.carbs}g</span>
            </div>
            <div className="flex items-center text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              <span>F: {meal.fat}g</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Ingredients:</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {meal.recipe.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button size="sm" variant="outline" onClick={() => logMeal(mealType, meal)}>
          Log Meal
        </Button>
      </CardFooter>
    </Card>
  );
  
  if (isLoading) {
    return (
      <DashboardLayout title="Meal Plan">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2">Loading your meal plan...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!mealPlan) {
    return (
      <DashboardLayout title="Meal Plan">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No meal plan found for your fitness goal.
          </p>
          <Button onClick={() => navigate("/profile")}>
            Update Your Fitness Goal
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Meal Plan">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Nutrition Plan</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Personalized meal recommendations based on your fitness goals and body metrics.
        </p>
        
        {/* Nutrition Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Utensils className="mr-2 h-5 w-5" />
              Daily Nutrition
            </h3>
            <Button size="sm" variant="outline" onClick={saveMealPlan}>
              Save Meal Plan
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Calories</span>
                  <span className="text-sm text-gray-500">{calculateDailyTotal()}/{dailyCalories} kcal</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-fitness-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (calculateDailyTotal() / dailyCalories) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Protein</span>
                  <span className="text-sm text-gray-500">{dailyMacros.protein}/{dailyProtein}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (dailyMacros.protein / dailyProtein) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Carbs</span>
                  <span className="text-sm text-gray-500">{dailyMacros.carbs}/{dailyCarbs}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (dailyMacros.carbs / dailyCarbs) * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Fat</span>
                  <span className="text-sm text-gray-500">{dailyMacros.fat}/{dailyFat}g</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (dailyMacros.fat / dailyFat) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm">Protein: {Math.round((dailyMacros.protein * 4 / calculateDailyTotal()) * 100)}%</span>
                </div>
                <span className="text-sm text-gray-500">{dailyMacros.protein * 4} kcal</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm">Carbs: {Math.round((dailyMacros.carbs * 4 / calculateDailyTotal()) * 100)}%</span>
                </div>
                <span className="text-sm text-gray-500">{dailyMacros.carbs * 4} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm">Fat: {Math.round((dailyMacros.fat * 9 / calculateDailyTotal()) * 100)}%</span>
                </div>
                <span className="text-sm text-gray-500">{dailyMacros.fat * 9} kcal</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Meal Search */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search meals or ingredients..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
        
        {/* Meals */}
        <div className="space-y-8">
          {/* Breakfast */}
          {filterMeals(mealPlan.breakfast) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Apple className="mr-2 h-5 w-5" />
                Breakfast
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderMealCard(mealPlan.breakfast, "Breakfast", "breakfast")}
              </div>
            </div>
          )}
          
          {/* Lunch */}
          {filterMeals(mealPlan.lunch) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Utensils className="mr-2 h-5 w-5" />
                Lunch
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderMealCard(mealPlan.lunch, "Lunch", "lunch")}
              </div>
            </div>
          )}
          
          {/* Dinner */}
          {filterMeals(mealPlan.dinner) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Utensils className="mr-2 h-5 w-5" />
                Dinner
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderMealCard(mealPlan.dinner, "Dinner", "dinner")}
              </div>
            </div>
          )}
          
          {/* Snacks */}
          {mealPlan.snacks.some(filterMeals) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Cookie className="mr-2 h-5 w-5" />
                Snacks
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mealPlan.snacks.filter(filterMeals).map((snack, index) => (
                  renderMealCard(snack, "Snack", "snack")
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MealPlan;
