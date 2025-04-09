
import React from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface NutritionCardProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  target: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onClick?: () => void;
}

const NutritionCard: React.FC<NutritionCardProps> = ({
  calories,
  protein,
  carbs,
  fat,
  target,
  onClick
}) => {
  const calculatePercentage = (current: number, target: number) => 
    Math.min(Math.round((current / target) * 100), 100);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-4">Today's Nutrition</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Calories: {calories} / {target.calories} kcal
              </span>
              <span className="text-sm font-medium">
                {calculatePercentage(calories, target.calories)}%
              </span>
            </div>
            <Progress
              value={calculatePercentage(calories, target.calories)}
              className="h-2"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Protein: {protein}g / {target.protein}g
              </span>
              <span className="text-sm font-medium">
                {calculatePercentage(protein, target.protein)}%
              </span>
            </div>
            <Progress
              value={calculatePercentage(protein, target.protein)}
              className="h-2 bg-blue-100"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Carbs: {carbs}g / {target.carbs}g
              </span>
              <span className="text-sm font-medium">
                {calculatePercentage(carbs, target.carbs)}%
              </span>
            </div>
            <Progress
              value={calculatePercentage(carbs, target.carbs)}
              className="h-2 bg-green-100"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Fat: {fat}g / {target.fat}g
              </span>
              <span className="text-sm font-medium">
                {calculatePercentage(fat, target.fat)}%
              </span>
            </div>
            <Progress
              value={calculatePercentage(fat, target.fat)}
              className="h-2 bg-yellow-100"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          variant="outline"
          className="w-full"
          onClick={onClick}
        >
          View Meal Plan
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NutritionCard;
