// src/services/meal_plan_service.ts
import { supabase } from '@/integrations/supabase/client';

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  dietary_preferences: string[];
  daily_calories: number;
  meals: DailyMeals[];
  grocery_list: GroceryItem[];
  created_at: string;
}

export interface DailyMeals {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

export interface Meal {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  serving_size: string;
}

export interface GroceryItem {
  name: string;
  quantity: string;
  category: 'protein' | 'vegetables' | 'fruits' | 'grains' | 'dairy' | 'pantry' | 'spices';
  estimated_price: number;
  alternatives?: string[];
}

export interface UserFitnessProfile {
  age: number;
  weight: number;
  height: number;
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  fitness_goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  dietary_preferences: string[];
  allergies: string[];
  budget_per_week: number;
}

class MealPlanService {
  private openaiModel = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4';

  async generateMealPlan(userProfile: UserFitnessProfile): Promise<MealPlan> {
    try {
      // Calculate daily calorie needs
      const dailyCalories = this.calculateDailyCalories(userProfile);
      
      // Generate AI meal plan
      const aiMealPlan = await this.generateAIMealPlan(userProfile, dailyCalories);
      
      // Extract grocery list
      const groceryList = this.extractGroceryList(aiMealPlan.meals);
      
      // Save to database using the enhanced_meal_plans table
      // Retrieve current user id safely
      const userResp = await supabase.auth.getUser();
      const currentUserId = (userResp as any)?.data?.user?.id || null;

      // Use any on the supabase.from call for enhanced_meal_plans to avoid generated-type mismatches
      const { data: mealPlan, error } = await (supabase as any)
        .from('enhanced_meal_plans')
        .insert({
          user_id: currentUserId,
          week_start_date: this.getWeekStartDate(),
          fitness_goal: userProfile.fitness_goal,
          dietary_preferences: userProfile.dietary_preferences,
          daily_calories: dailyCalories,
          meals: aiMealPlan.meals,
          grocery_list: groceryList
        })
        .select()
        .single();

      if (error) throw error;

      return mealPlan as MealPlan;
    } catch (error) {
      console.error('Error generating meal plan:', error);
      throw error;
    }
  }

  private calculateDailyCalories(profile: UserFitnessProfile): number {
    // Harris-Benedict equation for BMR
    const bmr = profile.weight * 10 + profile.height * 6.25 - profile.age * 5 + 5;
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725
    };
    
    const tdee = bmr * activityMultipliers[profile.activity_level];
    
    // Adjust based on fitness goal
    const goalAdjustments = {
      weight_loss: -500, // 500 calorie deficit
      muscle_gain: 300,  // 300 calorie surplus
      maintenance: 0,
      endurance: 200     // Slight surplus for performance
    };
    
    return Math.round(tdee + goalAdjustments[profile.fitness_goal]);
  }

  private async generateAIMealPlan(profile: UserFitnessProfile, dailyCalories: number) {
    const prompt = this.buildMealPlanPrompt(profile, dailyCalories);
    // Call local AI proxy server to keep API key server-side
    const payload = {
      model: this.openaiModel,
      messages: [
        {
          role: 'system',
          content: `You are a certified nutritionist and meal planning expert. Create detailed, practical meal plans that align with fitness goals and dietary preferences.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    };

    // Attach current user id and request server-side persistence if configured
    const userResp = await supabase.auth.getUser();
    const currentUserId = (userResp as any)?.data?.user?.id || null;

    const proxyUrl = (import.meta.env.VITE_AI_PROXY_URL || '').trim();
    const proxyKey = (import.meta.env.VITE_AI_PROXY_KEY || '').trim();

    if (!proxyUrl || !proxyKey) {
      const details = `Missing AI proxy configuration. ${!proxyUrl ? 'VITE_AI_PROXY_URL ' : ''}${!proxyKey ? 'VITE_AI_PROXY_KEY' : ''}`.trim();
      throw new Error(details);
    }

    const resp = await fetch(proxyUrl + '/api/ai/meal-plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-AI-PROXY-KEY': proxyKey },
      body: JSON.stringify({ userProfile: profile, openaiPayload: payload, userId: currentUserId, persist: Boolean(import.meta.env.VITE_AI_PROXY_PERSIST) })
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`AI proxy failed: ${err}`);
    }

    const result = await resp.json();
    // If proxy returns parsed JSON under parsed, use it; otherwise try raw content
    if (result.parsed) return result.parsed;
    if (result.raw && result.raw.choices && result.raw.choices[0] && result.raw.choices[0].message) {
      try { return JSON.parse(result.raw.choices[0].message.content); } catch (e) { return result.raw; }
    }
    return result;
  }

  private buildMealPlanPrompt(profile: UserFitnessProfile, dailyCalories: number): string {
    const macroRatios = this.getMacroRatios(profile.fitness_goal);
    
    return `
Create a comprehensive 7-day meal plan with the following requirements:

User Profile:
- Age: ${profile.age}
- Weight: ${profile.weight}kg
- Height: ${profile.height}cm
- Activity Level: ${profile.activity_level}
- Fitness Goal: ${profile.fitness_goal}
- Daily Calories: ${dailyCalories}
- Dietary Preferences: ${profile.dietary_preferences.join(', ')}
- Allergies: ${profile.allergies.join(', ')}
- Weekly Budget: $${profile.budget_per_week}

Macro Targets (per day):
- Protein: ${Math.round(dailyCalories * macroRatios.protein / 4)}g (${Math.round(macroRatios.protein * 100)}%)
- Carbs: ${Math.round(dailyCalories * macroRatios.carbs / 4)}g (${Math.round(macroRatios.carbs * 100)}%)
- Fats: ${Math.round(dailyCalories * macroRatios.fats / 9)}g (${Math.round(macroRatios.fats * 100)}%)

Requirements:
1. 7 days of meals (Monday-Sunday)
2. Each day: breakfast, lunch, dinner, 2 snacks
3. Include detailed ingredients with quantities
4. Provide step-by-step cooking instructions
5. Calculate accurate nutritional information
6. Consider prep time and difficulty
7. Use budget-friendly ingredients
8. Ensure variety across the week

Return ONLY a valid JSON object with this structure:
{
  "meals": [
    {
      "day": "Monday",
      "breakfast": {
        "name": "Meal Name",
        "description": "Brief description",
        "calories": 400,
        "protein": 25,
        "carbs": 40,
        "fats": 12,
        "ingredients": ["1 cup oats", "1 banana", "1 tbsp almond butter"],
        "instructions": ["Step 1", "Step 2"],
        "prep_time": 10,
        "serving_size": "1 bowl"
      },
      "lunch": { ... },
      "dinner": { ... },
      "snacks": [{ ... }, { ... }]
    },
    ... (repeat for all 7 days)
  ]
}
    `;
  }

  private getMacroRatios(goal: string) {
    const ratios = {
      weight_loss: { protein: 0.30, carbs: 0.35, fats: 0.35 },
      muscle_gain: { protein: 0.25, carbs: 0.45, fats: 0.30 },
      maintenance: { protein: 0.25, carbs: 0.45, fats: 0.30 },
      endurance: { protein: 0.20, carbs: 0.55, fats: 0.25 }
    };
    return ratios[goal] || ratios.maintenance;
  }

  private extractGroceryList(meals: DailyMeals[]): GroceryItem[] {
    const ingredientMap = new Map<string, { quantity: number, unit: string, category: string }>();
    
    meals.forEach(day => {
      [day.breakfast, day.lunch, day.dinner, ...day.snacks].forEach(meal => {
        meal.ingredients.forEach(ingredient => {
          const parsed = this.parseIngredient(ingredient);
          const key = parsed.name.toLowerCase();
          
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.quantity += parsed.quantity;
          } else {
            ingredientMap.set(key, {
              quantity: parsed.quantity,
              unit: parsed.unit,
              category: this.categorizeIngredient(parsed.name)
            });
          }
        });
      });
    });

    return Array.from(ingredientMap.entries()).map(([name, details]) => ({
      name: this.capitalizeWords(name),
      quantity: `${details.quantity} ${details.unit}`,
      category: details.category as any,
      estimated_price: this.estimatePrice(name, details.quantity, details.unit),
      alternatives: this.getAlternatives(name)
    }));
  }

  private parseIngredient(ingredient: string) {
    // Simple parser for ingredients like "2 cups rice", "1 lb chicken breast"
    const match = ingredient.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(.+)$/);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2] || 'piece',
        name: match[3].trim()
      };
    }
    return { quantity: 1, unit: 'piece', name: ingredient };
  }

  private categorizeIngredient(ingredient: string): string {
    const categories = {
      protein: ['chicken', 'beef', 'fish', 'eggs', 'tofu', 'beans', 'lentils', 'turkey', 'salmon', 'tuna'],
      vegetables: ['broccoli', 'spinach', 'carrots', 'onions', 'peppers', 'tomatoes', 'cucumber', 'lettuce'],
      fruits: ['banana', 'apple', 'berries', 'orange', 'grapes', 'avocado', 'lemon', 'lime'],
      grains: ['rice', 'oats', 'bread', 'pasta', 'quinoa', 'flour', 'cereal'],
      dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
      pantry: ['oil', 'vinegar', 'sauce', 'stock', 'broth'],
      spices: ['salt', 'pepper', 'garlic', 'herbs', 'spices', 'seasoning']
    };

    const lowerIngredient = ingredient.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
        return category;
      }
    }
    return 'pantry';
  }

  private estimatePrice(ingredient: string, quantity: number, unit: string): number {
    // Basic price estimation (you could integrate with a real pricing API)
    const basePrices = {
      protein: 8.0,
      vegetables: 2.5,
      fruits: 3.0,
      grains: 1.5,
      dairy: 4.0,
      pantry: 3.0,
      spices: 5.0
    };
    
    const category = this.categorizeIngredient(ingredient);
    const basePrice = basePrices[category] || 3.0;
    
    // Adjust for quantity (rough estimation)
    return Math.round((basePrice * quantity * 0.1) * 100) / 100;
  }

  private getAlternatives(ingredient: string): string[] {
    const alternatives = {
      'chicken breast': ['turkey breast', 'lean ground turkey', 'tofu'],
      'ground beef': ['ground turkey', 'lentils', 'black beans'],
      'rice': ['quinoa', 'cauliflower rice', 'brown rice'],
      'milk': ['almond milk', 'oat milk', 'soy milk'],
      'butter': ['olive oil', 'coconut oil', 'avocado oil']
    };
    
    return alternatives[ingredient.toLowerCase()] || [];
  }

  private capitalizeWords(str: string): string {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private getWeekStartDate(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  async getUserMealPlans(userId: string): Promise<MealPlan[]> {
    const { data, error } = await (supabase as any)
      .from('enhanced_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any) as MealPlan[];
  }

  async deleteMealPlan(mealPlanId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('enhanced_meal_plans')
      .delete()
      .eq('id', mealPlanId);

    if (error) throw error;
  }

  // Method to get user fitness profile from existing user_profiles table
  async getUserFitnessProfile(userId: string): Promise<UserFitnessProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        return {
          age: data.age || 30,
          weight: data.weight || 70,
          height: data.height || 175,
          activity_level: (data.activity_level as UserFitnessProfile['activity_level']) || 'moderately_active',
          fitness_goal: (data.fitness_goal as UserFitnessProfile['fitness_goal']) || 'maintenance',
          dietary_preferences: (data.dietary_preferences as string[]) || [],
          allergies: (data.dietary_restrictions as string[]) || [], // Map dietary_restrictions to allergies
          budget_per_week: 100 // Default budget since it's not in user_profiles
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user fitness profile:', error);
      return null;
    }
  }

  // Method to update user fitness profile in user_profiles table
  async updateUserFitnessProfile(userId: string, profile: Partial<UserFitnessProfile>): Promise<void> {
    try {
      const updateData: any = {};
      
      if (profile.age !== undefined) updateData.age = profile.age;
      if (profile.weight !== undefined) updateData.weight = profile.weight;
      if (profile.height !== undefined) updateData.height = profile.height;
      if (profile.activity_level !== undefined) updateData.activity_level = profile.activity_level;
      if (profile.fitness_goal !== undefined) updateData.fitness_goal = profile.fitness_goal;
      if (profile.dietary_preferences !== undefined) updateData.dietary_preferences = profile.dietary_preferences;
      if (profile.allergies !== undefined) updateData.dietary_restrictions = profile.allergies;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user fitness profile:', error);
      throw error;
    }
  }
}

export const mealPlanService = new MealPlanService();