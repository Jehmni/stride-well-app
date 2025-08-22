import React from 'react';
import NutritionLogger from '@/components/nutrition/NutritionLogger';
import NutritionTargetsModal from '@/components/nutrition/NutritionTargetsModal';

const NutritionTab: React.FC = () => {
  return (
    <div className="grid gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
          <p className="text-gray-600">Log your daily nutrition and track your progress.</p>
        </div>
        <NutritionTargetsModal isOpen={false} onClose={() => {}} onTargetsUpdated={() => {}} />
      </div>

      <div className="grid gap-6">
        <NutritionLogger />
      </div>
    </div>
  );
};

export default NutritionTab;
