import React from 'react';

interface MealCardProps {
  meal: any;
  mealType: string;
}

const MealCard: React.FC<MealCardProps> = ({ meal, mealType }) => {
  const mealTypeColors = {
    'Breakfast': 'bg-yellow-50 text-yellow-600 border-yellow-200',
    'Lunch': 'bg-blue-50 text-blue-600 border-blue-200',
    'Dinner': 'bg-purple-50 text-purple-600 border-purple-200'
  } as Record<string, string>;

  return (
    <div className={`p-3 rounded-lg border-2 ${mealTypeColors[mealType] || ''}`}>
      <h4 className="font-semibold mb-2">{mealType}</h4>
      <h5 className="font-medium text-sm mb-1">{meal?.name}</h5>
      {meal?.description && <p className="text-xs text-gray-600 mb-2">{meal.description}</p>}
      <div className="flex justify-between text-xs">
        <span>{meal?.calories} cal</span>
        <span className="flex items-center">
          <span className="w-3 h-3 mr-1" />
          {meal?.prep_time}min
        </span>
      </div>
      <div className="mt-2 text-xs">
        <span className="bg-white bg-opacity-50 px-2 py-1 rounded">
          P: {meal?.protein}g | C: {meal?.carbs}g | F: {meal?.fats || meal?.fat}g
        </span>
      </div>
    </div>
  );
};

export default MealCard;
