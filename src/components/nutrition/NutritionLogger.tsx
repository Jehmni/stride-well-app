import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNutrition } from "@/hooks/useNutrition";
import { useAuth } from "@/hooks/useAuth";
import { showSuccess, showError } from "@/utils/notifications";

interface NutritionLoggerProps {
  onLogComplete?: () => void;
}

const NutritionLogger: React.FC<NutritionLoggerProps> = ({ onLogComplete }) => {
  const { user } = useAuth();
  const [nutritionSummary, logNutrition] = useNutrition(user?.id);
  const [isLogging, setIsLogging] = useState(false);
  
  const [formData, setFormData] = useState({
    meal_name: '',
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'meal_name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.meal_name || formData.calories <= 0) {
      showError('Please fill in all required fields');
      return;
    }

    setIsLogging(true);
    
    try {
      await logNutrition({
        meal_name: formData.meal_name,
        meal_type: formData.meal_type,
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs,
        fat: formData.fat
      });

      showSuccess('Nutrition logged successfully!');
      
      // Reset form
      setFormData({
        meal_name: '',
        meal_type: 'breakfast',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      });

      onLogComplete?.();
    } catch (error) {
      showError('Failed to log nutrition');
      console.error('Error logging nutrition:', error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Log Nutrition</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="meal_name">Meal Name *</Label>
            <Input
              id="meal_name"
              value={formData.meal_name}
              onChange={(e) => handleInputChange('meal_name', e.target.value)}
              placeholder="e.g., Grilled Chicken Salad"
              required
            />
          </div>

          <div>
            <Label htmlFor="meal_type">Meal Type</Label>
            <Select
              value={formData.meal_type}
              onValueChange={(value) => handleInputChange('meal_type', value as any)}
            >
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
            <Label htmlFor="calories">Calories *</Label>
            <Input
              id="calories"
              type="number"
              value={formData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.protein}
                onChange={(e) => handleInputChange('protein', e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.carbs}
                onChange={(e) => handleInputChange('carbs', e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.fat}
                onChange={(e) => handleInputChange('fat', e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLogging}
          >
            {isLogging ? 'Logging...' : 'Log Nutrition'}
          </Button>
        </form>

        {/* Current Summary */}
        {nutritionSummary.target && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold mb-2">Today's Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Calories:</span>
                <span>{nutritionSummary.current.calories} / {nutritionSummary.target.calories}</span>
              </div>
              <div className="flex justify-between">
                <span>Protein:</span>
                <span>{nutritionSummary.current.protein}g / {nutritionSummary.target.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs:</span>
                <span>{nutritionSummary.current.carbs}g / {nutritionSummary.target.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat:</span>
                <span>{nutritionSummary.current.fat}g / {nutritionSummary.target.fat}g</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionLogger; 