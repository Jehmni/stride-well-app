import React, { useState, useCallback, useEffect } from "react";
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
  Beef,
  Trash2,
  Edit,
  ShoppingCart,
  MapPin,
  Calculator,
  GripVertical,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { meals, fetchMealsForPlan: fetchMealsForPlanHook, createMeal: createMealHook, deleteMeal: deleteMealHook, updateMeal: updateMealHook, setMeals } = useMeals(selectedPlan);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Hook-backed data and actions
  const {
    mealPlans: hookMealPlans,
    isLoading: hookIsLoading,
    fetchMealPlans: fetchMealPlansHook,
    createMealPlan: createMealPlanHook,
    deleteMealPlan: deleteMealPlanHook,
    updateMealPlan: updateMealPlanHook
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

  // Edit plan state
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [planErrors, setPlanErrors] = useState<{ [k: string]: string | undefined }>({});

  const startEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name || '',
      description: plan.description || '',
      calories: String(plan.daily_calorie_target ?? ''),
      protein: String(plan.daily_protein_target ?? ''),
      carbs: String(plan.daily_carbs_target ?? ''),
      fat: String(plan.daily_fat_target ?? '')
    });
    setPlanErrors({});
    setShowEditPlan(true);
  };

  const validatePlanForm = () => {
    const errors: any = {};
    if (!planForm.name.trim()) errors.name = 'Name is required';
    const asNum = (v: string) => (v === '' ? NaN : Number(v));
    const calories = asNum(planForm.calories);
    const protein = asNum(planForm.protein);
    const carbs = asNum(planForm.carbs);
    const fat = asNum(planForm.fat);
    if (!Number.isFinite(calories) || calories <= 0) errors.calories = 'Enter a valid number';
    if (!Number.isFinite(protein) || protein < 0) errors.protein = 'Enter a valid number';
    if (!Number.isFinite(carbs) || carbs < 0) errors.carbs = 'Enter a valid number';
    if (!Number.isFinite(fat) || fat < 0) errors.fat = 'Enter a valid number';
    setPlanErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const savePlanEdits = async () => {
    if (!editingPlan) return;
    if (!validatePlanForm()) {
      toast.error('Please fix form errors');
      return;
    }
    const payload = {
      name: planForm.name.trim(),
      description: planForm.description.trim(),
      calories: Number(planForm.calories),
      protein: Number(planForm.protein),
      carbs: Number(planForm.carbs),
      fat: Number(planForm.fat)
    } as any;
    const updated = await updateMealPlanHook(editingPlan.id, payload);
    if (updated) {
      setShowEditPlan(false);
      setEditingPlan(null);
    }
  };

  // Edit meal state
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState<{ [k: string]: any }>({});
  const [mealErrors, setMealErrors] = useState<{ [k: string]: string | undefined }>({});

  const startEditMeal = (meal: any) => {
    setEditingMealId(meal.id);
    setMealForm({
      name: meal.name || '',
      description: meal.description || '',
      meal_type: meal.meal_type || 'breakfast',
      calories: String(meal.calories ?? 0),
      protein: String(meal.protein ?? 0),
      carbs: String(meal.carbs ?? 0),
      fat: String(meal.fat ?? 0)
    });
    setMealErrors({});
  };

  const validateMealForm = () => {
    const errors: any = {};
    if (!mealForm.name || !mealForm.name.trim()) errors.name = 'Name is required';
    const fields = ['calories', 'protein', 'carbs', 'fat'];
    fields.forEach((f) => {
      const v = Number(mealForm[f]);
      if (!Number.isFinite(v) || v < 0) errors[f] = 'Enter a valid number';
    });
    setMealErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveMealEdits = async (mealId: string) => {
    if (!selectedPlan) return;
    if (!validateMealForm()) {
      toast.error('Please fix meal form errors');
      return;
    }
    const ok = await updateMealHook(mealId, {
      name: String(mealForm.name).trim(),
      description: String(mealForm.description || '').trim(),
      meal_type: String(mealForm.meal_type || 'breakfast'),
      calories: Number(mealForm.calories),
      protein: Number(mealForm.protein),
      carbs: Number(mealForm.carbs),
      fat: Number(mealForm.fat)
    }, selectedPlan);
    if (ok) setEditingMealId(null);
  };

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
    if (!user?.id || !aiUserProfile) {
      toast.error('Please complete your fitness profile first');
      return;
    }
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
        ? [...(prev?.dietary_preferences || []), preference]
        : (prev?.dietary_preferences || []).filter(p => p !== preference)
    }));
  };

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
    'keto', 'paleo', 'mediterranean', 'low-carb'
  ];

  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });
  const [draggedMeal, setDraggedMeal] = useState<Meal | null>(null);
  const [draggedOverMeal, setDraggedOverMeal] = useState<Meal | null>(null);

  const handleBulkEdit = useCallback(async () => {
    if (!selectedPlan) return;
    
    const updates = Object.fromEntries(
      Object.entries(bulkEditValues)
        .filter(([_, value]) => value !== '')
        .map(([key, value]) => [key, parseFloat(value)])
    );

    if (Object.keys(updates).length === 0) {
      toast.error('Please enter at least one macro value to update');
      return;
    }

    const planMeals = meals.filter(m => m.meal_plan_id === selectedPlan);
    let successCount = 0;

    for (const meal of planMeals) {
      const success = await updateMealHook(meal.id, updates);
      if (success) successCount++;
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} meals with new macro values`);
      setShowBulkEdit(false);
      setBulkEditValues({ calories: '', protein: '', carbs: '', fat: '' });
    } else {
      toast.error('Failed to update any meals');
    }
  }, [selectedPlan, meals, bulkEditValues, updateMealHook]);

  const handleDragStart = useCallback((e: React.DragEvent, meal: Meal) => {
    setDraggedMeal(meal);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, meal: Meal) => {
    e.preventDefault();
    if (draggedMeal && draggedMeal.id !== meal.id) {
      setDraggedOverMeal(meal);
    }
  }, [draggedMeal]);

  const handleDragLeave = useCallback(() => {
    setDraggedOverMeal(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetMeal: Meal) => {
    e.preventDefault();
    if (!draggedMeal || !selectedPlan) return;

    const planMeals = meals.filter(m => m.meal_plan_id === selectedPlan);
    const draggedIndex = planMeals.findIndex(m => m.id === draggedMeal.id);
    const targetIndex = planMeals.findIndex(m => m.id === targetMeal.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder meals by meal type to maintain logical grouping
    const reorderedMeals = [...planMeals];
    const [removed] = reorderedMeals.splice(draggedIndex, 1);
    reorderedMeals.splice(targetIndex, 0, removed);

    // Update local state immediately for smooth UX
    setMeals(prevMeals => {
      const otherMeals = prevMeals.filter(m => m.meal_plan_id !== selectedPlan);
      return [...otherMeals, ...reorderedMeals];
    });

    // Persist the new order (client-side only for now)
    toast.success('Meal order updated');
    
    setDraggedMeal(null);
    setDraggedOverMeal(null);
  }, [draggedMeal, selectedPlan, meals, setMeals]);

  const handleDragEnd = useCallback(() => {
    setDraggedMeal(null);
    setDraggedOverMeal(null);
  }, []);

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
              onEditPlan={startEditPlan}
            />

            {/* Selected Plan Details kept here to avoid moving DB interaction right now */}
            {selectedPlan && (
              <div className="border rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Plan Details</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowBulkEdit(true)} size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Bulk Edit Macros
                    </Button>
                    <Button onClick={handleCreateMeal} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Meal
                    </Button>
                  </div>
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
                              className={`p-2 bg-gray-50 rounded transition-all duration-200 ${
                                draggedMeal?.id === meal.id 
                                  ? 'opacity-50 scale-95' 
                                  : draggedOverMeal?.id === meal.id 
                                  ? 'border-2 border-green-500 bg-green-100' 
                                  : 'border border-transparent hover:border-gray-300'
                              }`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, meal)}
                              onDragOver={(e) => handleDragOver(e, meal)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, meal)}
                              onDragEnd={handleDragEnd}
                            >
                              {editingMealId === meal.id ? (
                                <div className="grid md:grid-cols-8 gap-2 items-end">
                                  <div className="md:col-span-2">
                                    <Label className="text-xs">Name</Label>
                                    <Input value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} />
                                    {mealErrors.name && <p className="text-xs text-red-600 mt-1">{mealErrors.name}</p>}
                                  </div>
                                  <div className="md:col-span-2">
                                    <Label className="text-xs">Description</Label>
                                    <Input value={mealForm.description || ''} onChange={(e) => setMealForm({ ...mealForm, description: e.target.value })} />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Type</Label>
                                    <Select value={mealForm.meal_type} onValueChange={(value) => setMealForm({ ...mealForm, meal_type: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="breakfast">Breakfast</SelectItem>
                                        <SelectItem value="lunch">Lunch</SelectItem>
                                        <SelectItem value="dinner">Dinner</SelectItem>
                                        <SelectItem value="snack">Snack</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Calories</Label>
                                    <Input type="number" value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} />
                                    {mealErrors.calories && <p className="text-xs text-red-600 mt-1">{mealErrors.calories}</p>}
                                  </div>
                                  <div>
                                    <Label className="text-xs">Protein</Label>
                                    <Input type="number" value={mealForm.protein} onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })} />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Carbs</Label>
                                    <Input type="number" value={mealForm.carbs} onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })} />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Fat</Label>
                                    <Input type="number" value={mealForm.fat} onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })} />
                                  </div>
                                  <div className="flex gap-2 justify-end md:col-span-8">
                                    <Button variant="outline" size="sm" onClick={() => setEditingMealId(null)}>Cancel</Button>
                                    <Button size="sm" onClick={() => saveMealEdits(meal.id)}>Save</Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="cursor-grab active:cursor-grabbing">
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{meal.name} <span className="ml-2 text-xs text-gray-500 capitalize">({meal.meal_type})</span></p>
                                      {meal.description && <p className="text-xs text-gray-600 mb-1">{meal.description}</p>}
                                      <p className="text-sm text-gray-600">{meal.calories} cal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEditMeal(meal)}>Edit</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleDeleteMeal(meal.id)}>Delete</Button>
                                  </div>
                                </div>
                              )}
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
                        {hookGeneratedAIMealPlan.daily_calories} calories/day  {hookGeneratedAIMealPlan.fitness_goal.replace('_', ' ')}
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
            <ShoppingTab shoppingList={hookShoppingList} />
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
                    value={aiUserProfile?.age || ''}
                    onChange={(e) => handleAIProfileChange('age', parseInt(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ai-weight">Weight (kg)</Label>
                  <Input
                    id="ai-weight"
                    type="number"
                    value={aiUserProfile?.weight || ''}
                    onChange={(e) => handleAIProfileChange('weight', parseFloat(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ai-height">Height (cm)</Label>
                  <Input
                    id="ai-height"
                    type="number"
                    value={aiUserProfile?.height || ''}
                    onChange={(e) => handleAIProfileChange('height', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Activity Level</Label>
                  <Select
                    value={aiUserProfile?.activity_level || 'moderate'}
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
                    value={aiUserProfile?.fitness_goal || 'maintain_weight'}
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
                  value={aiUserProfile?.budget_per_week || ''}
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
                        checked={aiUserProfile?.dietary_preferences?.includes(option) || false}
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
                disabled={hookIsGeneratingAI}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {hookIsGeneratingAI ? (
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

        {/* Edit Meal Plan Dialog */}
        <Dialog open={showEditPlan} onOpenChange={setShowEditPlan}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Meal Plan</DialogTitle>
              <DialogDescription>Update your plan details and targets.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Plan Name</Label>
                <Input id="edit-name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
                {planErrors.name && <p className="text-xs text-red-600">{planErrors.name}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Daily Calories</Label>
                  <Input type="number" value={planForm.calories} onChange={(e) => setPlanForm({ ...planForm, calories: e.target.value })} />
                  {planErrors.calories && <p className="text-xs text-red-600">{planErrors.calories}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>Protein (g)</Label>
                  <Input type="number" value={planForm.protein} onChange={(e) => setPlanForm({ ...planForm, protein: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Carbs (g)</Label>
                  <Input type="number" value={planForm.carbs} onChange={(e) => setPlanForm({ ...planForm, carbs: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Fat (g)</Label>
                  <Input type="number" value={planForm.fat} onChange={(e) => setPlanForm({ ...planForm, fat: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditPlan(false)}>Cancel</Button>
              <Button onClick={savePlanEdits}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Macros Dialog */}
        <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Bulk Edit Macros</DialogTitle>
                          <DialogDescription>
              Update macro values for all meals in the selected plan. Leave fields empty to skip updating that macro.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-calories">Calories</Label>
                  <Input
                    id="bulk-calories"
                    type="number"
                    placeholder="e.g., 500"
                    value={bulkEditValues.calories}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, calories: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-protein">Protein (g)</Label>
                  <Input
                    id="bulk-protein"
                    type="number"
                    placeholder="e.g., 25"
                    value={bulkEditValues.protein}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, protein: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-carbs">Carbs (g)</Label>
                  <Input
                    id="bulk-carbs"
                    type="number"
                    placeholder="e.g., 60"
                    value={bulkEditValues.carbs}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, carbs: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-fat">Fat (g)</Label>
                  <Input
                    id="bulk-fat"
                    type="number"
                    placeholder="e.g., 20"
                    value={bulkEditValues.fat}
                    onChange={(e) => setBulkEditValues(prev => ({ ...prev, fat: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEdit}>Update All Meals</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MealPlan;
