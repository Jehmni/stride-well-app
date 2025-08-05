import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Calculator, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { showSuccess, showError } from "@/utils/notifications";

interface NutritionTargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTargetsUpdated?: () => void;
}

interface NutritionTarget {
  id: string;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  daily_fiber_g?: number;
  daily_water_ml?: number;
}

const NutritionTargetsModal: React.FC<NutritionTargetsModalProps> = ({
  isOpen,
  onClose,
  onTargetsUpdated
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [editedTargets, setEditedTargets] = useState<NutritionTarget | null>(null);

  // Fetch current targets when modal opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchTargets();
    }
  }, [isOpen, user?.id]);

  const fetchTargets = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setTargets(data);
        setEditedTargets(data);
      }
    } catch (error) {
      console.error('Error fetching nutrition targets:', error);
      showError('Failed to load nutrition targets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Call the function to recalculate targets based on current profile
      const { error } = await (supabase as any).rpc('set_nutrition_targets_for_goal', {
        user_id_param: user.id
      });

      if (error) throw error;

      // Fetch the updated targets
      await fetchTargets();
      showSuccess('Nutrition targets recalculated based on your profile!');
    } catch (error) {
      console.error('Error recalculating targets:', error);
      showError('Failed to recalculate nutrition targets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !editedTargets) return;

    try {
      setIsLoading(true);
      
      const { error } = await (supabase as any)
        .from('nutrition_targets')
        .update({
          daily_calories: editedTargets.daily_calories,
          daily_protein_g: editedTargets.daily_protein_g,
          daily_carbs_g: editedTargets.daily_carbs_g,
          daily_fat_g: editedTargets.daily_fat_g,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setTargets(editedTargets);
      setIsEditing(false);
      showSuccess('Nutrition targets updated successfully!');
      onTargetsUpdated?.();
    } catch (error) {
      console.error('Error updating nutrition targets:', error);
      showError('Failed to update nutrition targets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedTargets(targets);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof NutritionTarget, value: string) => {
    if (!editedTargets) return;
    
    const numValue = parseInt(value) || 0;
    setEditedTargets(prev => prev ? { ...prev, [field]: numValue } : null);
  };

  const calculateMacroPercentages = () => {
    if (!editedTargets) return { protein: 0, carbs: 0, fat: 0 };

    const totalCalories = editedTargets.daily_calories;
    const proteinCalories = editedTargets.daily_protein_g * 4;
    const carbsCalories = editedTargets.daily_carbs_g * 4;
    const fatCalories = editedTargets.daily_fat_g * 9;

    return {
      protein: Math.round((proteinCalories / totalCalories) * 100),
      carbs: Math.round((carbsCalories / totalCalories) * 100),
      fat: Math.round((fatCalories / totalCalories) * 100)
    };
  };

  const macroPercentages = calculateMacroPercentages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nutrition Targets
          </DialogTitle>
          <DialogDescription>
            Your daily nutrition targets based on your fitness goals and profile.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
          </div>
        ) : targets ? (
          <div className="space-y-6">
            {/* Current Targets Display */}
            {!isEditing && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Daily Targets</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRecalculate}
                      disabled={isLoading}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Recalculate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Calories Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Daily Calories</Label>
                      <Badge variant="secondary">{targets.daily_calories} kcal</Badge>
                    </div>
                    <Progress value={100} className="h-2" />
                  </CardContent>
                </Card>

                {/* Macros Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Protein</Label>
                        <Badge variant="outline">{targets.daily_protein_g}g</Badge>
                      </div>
                      <Progress value={macroPercentages.protein} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{macroPercentages.protein}% of calories</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Carbs</Label>
                        <Badge variant="outline">{targets.daily_carbs_g}g</Badge>
                      </div>
                      <Progress value={macroPercentages.carbs} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{macroPercentages.carbs}% of calories</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Fat</Label>
                        <Badge variant="outline">{targets.daily_fat_g}g</Badge>
                      </div>
                      <Progress value={macroPercentages.fat} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{macroPercentages.fat}% of calories</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing && editedTargets && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Edit Targets</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="calories">Daily Calories (kcal)</Label>
                    <Input
                      id="calories"
                      type="number"
                      value={editedTargets.daily_calories}
                      onChange={(e) => handleInputChange('daily_calories', e.target.value)}
                      min="1200"
                      max="5000"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={editedTargets.daily_protein_g}
                        onChange={(e) => handleInputChange('daily_protein_g', e.target.value)}
                        min="50"
                        max="300"
                      />
                    </div>

                    <div>
                      <Label htmlFor="carbs">Carbs (g)</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={editedTargets.daily_carbs_g}
                        onChange={(e) => handleInputChange('daily_carbs_g', e.target.value)}
                        min="50"
                        max="500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="fat">Fat (g)</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={editedTargets.daily_fat_g}
                        onChange={(e) => handleInputChange('daily_fat_g', e.target.value)}
                        min="20"
                        max="150"
                      />
                    </div>
                  </div>

                  {/* Macro Distribution Preview */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium mb-3">Macro Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Protein: {editedTargets.daily_protein_g * 4} kcal ({macroPercentages.protein}%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Carbs: {editedTargets.daily_carbs_g * 4} kcal ({macroPercentages.carbs}%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Fat: {editedTargets.daily_fat_g * 9} kcal ({macroPercentages.fat}%)</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total: {editedTargets.daily_protein_g * 4 + editedTargets.daily_carbs_g * 4 + editedTargets.daily_fat_g * 9} kcal</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No nutrition targets found.</p>
            <Button onClick={handleRecalculate} className="mt-4">
              Calculate Targets
            </Button>
          </div>
        )}

        <DialogFooter>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NutritionTargetsModal; 