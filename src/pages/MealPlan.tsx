
import React from "react";
import { Apple, ChevronRight, Cookie, CreditCard, Search, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type Meal = {
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
  // Get user profile from localStorage
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const fitnessGoal = userProfile.fitnessGoal || "general-fitness";
  
  // Calculate base calories based on user data
  const calculateBMR = (): number => {
    const weight = userProfile.weight || 70; // kg
    const height = userProfile.height || 170; // cm
    const age = userProfile.age || 30; // years
    const isMale = userProfile.sex === "male";
    
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
    
    switch (fitnessGoal) {
      case "weight-loss":
        return Math.round(tdee * 0.85); // 15% deficit
      case "muscle-gain":
        return Math.round(tdee * 1.1); // 10% surplus
      default:
        return Math.round(tdee); // Maintenance
    }
  };
  
  const dailyCalories = calculateTDEE();
  const dailyProtein = Math.round((userProfile.weight || 70) * (fitnessGoal === "muscle-gain" ? 1.8 : 1.6)); // g
  const dailyFat = Math.round(dailyCalories * 0.25 / 9); // 25% of calories from fat, 9 cal per gram
  const dailyCarbs = Math.round((dailyCalories - (dailyProtein * 4) - (dailyFat * 9)) / 4); // Remaining calories from carbs, 4 cal per gram
  
  // Sample meal plans based on fitness goals
  const mealPlans: Record<string, DailyPlan> = {
    "weight-loss": {
      breakfast: {
        name: "Greek Yogurt with Berries",
        calories: 290,
        protein: 20,
        carbs: 30,
        fat: 8,
        recipe: [
          "1 cup Greek yogurt (0% fat)",
          "1/2 cup mixed berries",
          "1 tbsp honey",
          "2 tbsp sliced almonds"
        ],
        image: "https://images.unsplash.com/photo-1542691457-cbe4df041eb2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      lunch: {
        name: "Grilled Chicken Salad",
        calories: 350,
        protein: 35,
        carbs: 20,
        fat: 12,
        recipe: [
          "120g grilled chicken breast",
          "2 cups mixed greens",
          "1/4 cup cherry tomatoes",
          "1/4 cucumber, sliced",
          "1 tbsp olive oil",
          "1 tbsp balsamic vinegar"
        ],
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      dinner: {
        name: "Baked Salmon with Vegetables",
        calories: 420,
        protein: 30,
        carbs: 25,
        fat: 18,
        recipe: [
          "150g salmon fillet",
          "1 cup roasted broccoli",
          "1/2 cup quinoa",
          "1 tsp olive oil",
          "Lemon juice, salt, and pepper to taste"
        ],
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      snacks: [
        {
          name: "Apple with Almond Butter",
          calories: 200,
          protein: 5,
          carbs: 25,
          fat: 10,
          recipe: [
            "1 medium apple",
            "1 tbsp almond butter"
          ],
          image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        }
      ]
    },
    "muscle-gain": {
      breakfast: {
        name: "High-Protein Oatmeal",
        calories: 450,
        protein: 30,
        carbs: 50,
        fat: 12,
        recipe: [
          "1 cup oats",
          "1 scoop protein powder",
          "1 banana",
          "1 tbsp peanut butter",
          "1/2 cup milk"
        ],
        image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      lunch: {
        name: "Turkey and Avocado Wrap",
        calories: 550,
        protein: 40,
        carbs: 45,
        fat: 20,
        recipe: [
          "150g turkey breast",
          "1 whole wheat wrap",
          "1/2 avocado",
          "Lettuce, tomato, red onion",
          "1 tbsp light mayo"
        ],
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      dinner: {
        name: "Steak with Sweet Potato",
        calories: 650,
        protein: 45,
        carbs: 50,
        fat: 25,
        recipe: [
          "200g lean steak",
          "1 large sweet potato",
          "2 cups steamed vegetables",
          "2 tsp olive oil",
          "Herbs and spices to taste"
        ],
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      snacks: [
        {
          name: "Protein Smoothie",
          calories: 300,
          protein: 25,
          carbs: 30,
          fat: 5,
          recipe: [
            "1 scoop protein powder",
            "1 cup milk",
            "1 banana",
            "1/2 cup frozen berries",
            "Ice cubes"
          ],
          image: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        },
        {
          name: "Greek Yogurt with Honey",
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 5,
          recipe: [
            "1 cup Greek yogurt",
            "1 tbsp honey",
            "1/4 cup granola"
          ],
          image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        }
      ]
    },
    "general-fitness": {
      breakfast: {
        name: "Avocado Toast with Eggs",
        calories: 380,
        protein: 20,
        carbs: 35,
        fat: 15,
        recipe: [
          "2 slices whole grain bread",
          "1/2 avocado",
          "2 eggs (poached or fried)",
          "Salt, pepper, and red pepper flakes to taste"
        ],
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1480&q=80"
      },
      lunch: {
        name: "Quinoa Bowl",
        calories: 420,
        protein: 25,
        carbs: 45,
        fat: 14,
        recipe: [
          "1 cup cooked quinoa",
          "100g grilled chicken",
          "1/2 cup roasted vegetables",
          "1/4 avocado",
          "1 tbsp olive oil",
          "Lemon juice, salt, and pepper to taste"
        ],
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      dinner: {
        name: "Fish Tacos",
        calories: 480,
        protein: 30,
        carbs: 40,
        fat: 18,
        recipe: [
          "150g white fish (grilled)",
          "2 corn tortillas",
          "1/2 cup cabbage slaw",
          "1/4 avocado",
          "Cilantro, lime, and hot sauce to taste"
        ],
        image: "https://images.unsplash.com/photo-1551504734-5ee1c4a3479b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      snacks: [
        {
          name: "Mixed Nuts and Dried Fruit",
          calories: 250,
          protein: 8,
          carbs: 20,
          fat: 15,
          recipe: [
            "1/4 cup mixed nuts",
            "2 tbsp dried fruits"
          ],
          image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1496&q=80"
        }
      ]
    },
    "endurance": {
      breakfast: {
        name: "Overnight Oats",
        calories: 400,
        protein: 15,
        carbs: 60,
        fat: 10,
        recipe: [
          "1 cup rolled oats",
          "1 cup almond milk",
          "1 banana, sliced",
          "1 tbsp chia seeds",
          "1 tbsp maple syrup",
          "Cinnamon to taste"
        ],
        image: "https://images.unsplash.com/photo-1556103255-4443dbae8e5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      lunch: {
        name: "Mediterranean Pasta Salad",
        calories: 480,
        protein: 20,
        carbs: 65,
        fat: 15,
        recipe: [
          "1.5 cups whole wheat pasta",
          "1/2 cup cherry tomatoes",
          "1/4 cup cucumber",
          "1/4 cup olives",
          "50g feta cheese",
          "1 tbsp olive oil",
          "Balsamic vinegar and herbs to taste"
        ],
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
      },
      dinner: {
        name: "Sweet Potato and Black Bean Bowl",
        calories: 520,
        protein: 25,
        carbs: 70,
        fat: 12,
        recipe: [
          "1 large sweet potato, cubed and roasted",
          "1/2 cup black beans",
          "1/2 cup brown rice",
          "1/4 cup corn",
          "Avocado, cilantro, and lime to garnish"
        ],
        image: "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1764&q=80"
      },
      snacks: [
        {
          name: "Banana with Peanut Butter",
          calories: 250,
          protein: 8,
          carbs: 35,
          fat: 10,
          recipe: [
            "1 banana",
            "2 tbsp peanut butter"
          ],
          image: "https://images.unsplash.com/photo-1526630588889-56ade2a5b730?ixlib=rb-4.0.3&auto=format&fit=crop&w=1364&q=80"
        },
        {
          name: "Energy Balls",
          calories: 200,
          protein: 6,
          carbs: 25,
          fat: 8,
          recipe: [
            "1/2 cup oats",
            "2 tbsp peanut butter",
            "1 tbsp honey",
            "1 tbsp chia seeds",
            "2 tbsp dark chocolate chips"
          ],
          image: "https://images.unsplash.com/photo-1533765908890-b54ab771e9c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80"
        }
      ]
    }
  };
  
  const selectedPlan = mealPlans[fitnessGoal as keyof typeof mealPlans] || mealPlans["general-fitness"];
  
  // Calculate daily totals
  const calculateMealTotal = (meal: Meal): number => meal.calories;
  const calculateDailyTotal = (): number => {
    let total = calculateMealTotal(selectedPlan.breakfast);
    total += calculateMealTotal(selectedPlan.lunch);
    total += calculateMealTotal(selectedPlan.dinner);
    selectedPlan.snacks.forEach(snack => {
      total += calculateMealTotal(snack);
    });
    return total;
  };
  
  const dailyTotalCalories = calculateDailyTotal();
  
  // Mock data for nearby grocery stores
  const nearbyStores = [
    {
      name: "Whole Foods Market",
      distance: "0.8 miles",
      address: "123 Organic Street"
    },
    {
      name: "Trader Joe's",
      distance: "1.2 miles",
      address: "456 Healthy Avenue"
    },
    {
      name: "Farmers Market",
      distance: "2.1 miles",
      address: "789 Fresh Produce Lane"
    }
  ];

  // Render a meal card
  const renderMealCard = (meal: Meal, title: string) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="h-40 bg-cover bg-center" 
        style={{ backgroundImage: `url(${meal.image})` }}
      />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-xl font-medium">{title}</h4>
          <span className="text-sm bg-fitness-primary bg-opacity-10 text-fitness-primary px-2 py-1 rounded-full">
            {meal.calories} kcal
          </span>
        </div>
        <h5 className="font-medium mb-2">{meal.name}</h5>
        
        <div className="flex space-x-4 mb-4 text-sm">
          <div>
            <span className="font-medium block">Protein</span>
            <span>{meal.protein}g</span>
          </div>
          <div>
            <span className="font-medium block">Carbs</span>
            <span>{meal.carbs}g</span>
          </div>
          <div>
            <span className="font-medium block">Fat</span>
            <span>{meal.fat}g</span>
          </div>
        </div>
        
        <h6 className="font-medium mb-2">Ingredients:</h6>
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
          {meal.recipe.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          variant="outline"
          className="w-full"
        >
          See Full Recipe
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout title="Meal Plans">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Personalized Meal Plan</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Based on your {fitnessGoal === "weight-loss" ? "weight loss" : fitnessGoal === "muscle-gain" ? "muscle building" : fitnessGoal === "endurance" ? "endurance training" : "general fitness"} goals
        </p>
        
        {/* Nutrition Summary */}
        <div className="bg-fitness-primary bg-opacity-10 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Utensils className="mr-2 h-5 w-5" />
            Daily Nutrition Targets
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Daily Calories</p>
              <p className="text-2xl font-bold">{dailyCalories} <span className="text-sm font-normal">kcal</span></p>
              <p className="text-xs text-gray-500 mt-1">Plan: {dailyTotalCalories} kcal</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Protein</p>
              <p className="text-2xl font-bold">{dailyProtein} <span className="text-sm font-normal">g</span></p>
              <p className="text-xs text-gray-500 mt-1">{Math.round(dailyProtein * 4 / dailyCalories * 100)}% of calories</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Carbs</p>
              <p className="text-2xl font-bold">{dailyCarbs} <span className="text-sm font-normal">g</span></p>
              <p className="text-xs text-gray-500 mt-1">{Math.round(dailyCarbs * 4 / dailyCalories * 100)}% of calories</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Fat</p>
              <p className="text-2xl font-bold">{dailyFat} <span className="text-sm font-normal">g</span></p>
              <p className="text-xs text-gray-500 mt-1">{Math.round(dailyFat * 9 / dailyCalories * 100)}% of calories</p>
            </div>
          </div>
        </div>
        
        {/* Meals */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Today's Meals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {renderMealCard(selectedPlan.breakfast, "Breakfast")}
            {renderMealCard(selectedPlan.lunch, "Lunch")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {renderMealCard(selectedPlan.dinner, "Dinner")}
            <div>
              <h4 className="text-xl font-semibold mb-4">Snacks</h4>
              <div className="space-y-4">
                {selectedPlan.snacks.map((snack, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="flex">
                      <div 
                        className="w-24 bg-cover bg-center" 
                        style={{ backgroundImage: `url(${snack.image})` }}
                      />
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">{snack.name}</h5>
                          <span className="text-xs bg-fitness-primary bg-opacity-10 text-fitness-primary px-2 py-1 rounded-full">
                            {snack.calories} kcal
                          </span>
                        </div>
                        <div className="flex space-x-3 mt-2 text-xs text-gray-500">
                          <span>P: {snack.protein}g</span>
                          <span>C: {snack.carbs}g</span>
                          <span>F: {snack.fat}g</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Grocery Stores */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Nearby Grocery Stores
          </h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search for stores near you..." 
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-4">
              {nearbyStores.map((store, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-fitness-primary bg-opacity-10 rounded-full">
                      <Apple className="h-5 w-5 text-fitness-primary" />
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium">{store.name}</h4>
                      <p className="text-sm text-gray-500">{store.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm">{store.distance}</span>
                    <ChevronRight size={16} className="ml-2 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View More Stores
            </Button>
          </div>
        </div>
        
        {/* Shopping List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Cookie className="mr-2 h-5 w-5" />
            Weekly Shopping List
          </h3>
          <Card className="p-6">
            <p className="mb-4">Here's what you need for your meal plan this week:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Proteins</h4>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                  <li>Chicken breast (300g)</li>
                  <li>Salmon fillets (300g)</li>
                  <li>Greek yogurt (500g)</li>
                  <li>Eggs (12)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Fruits & Vegetables</h4>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                  <li>Mixed berries (200g)</li>
                  <li>Bananas (5)</li>
                  <li>Avocados (2)</li>
                  <li>Sweet potatoes (3)</li>
                  <li>Broccoli (1 head)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Grains & Other</h4>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400">
                  <li>Quinoa (500g)</li>
                  <li>Rolled oats (500g)</li>
                  <li>Almond butter (1 jar)</li>
                  <li>Olive oil (1 bottle)</li>
                </ul>
              </div>
            </div>
            <Button className="w-full mt-6">
              Generate Complete Shopping List
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MealPlan;
