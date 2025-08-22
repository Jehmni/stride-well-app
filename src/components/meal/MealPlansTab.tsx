import React from 'react';

interface Props {
  isLoading: boolean;
  mealPlans: any[];
  selectedPlan: string | null;
  setSelectedPlan: (id: string | null) => void;
  fetchMealsForPlan: (id: string) => void;
  createMeal: () => void;
  deleteMealPlan: (id: string) => void;
  onEditPlan?: (plan: any) => void;
}

const MealPlansTab: React.FC<Props> = ({ isLoading, mealPlans, selectedPlan, setSelectedPlan, fetchMealsForPlan, createMeal, deleteMealPlan, onEditPlan }) => {
  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : mealPlans.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No Meal Plans Yet</h3>
        </div>
      ) : (
        <div className="grid gap-6">
          {mealPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 border rounded-lg cursor-pointer transition-all ${
                selectedPlan === plan.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"
              }`}
              onClick={() => {
                setSelectedPlan(plan.id);
                fetchMealsForPlan(plan.id);
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                </div>
                <div className="flex gap-2">
                  {onEditPlan && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditPlan(plan); }}
                      className="px-2 py-1 text-sm rounded border border-green-200 text-green-700 hover:bg-green-50"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteMealPlan(plan.id); }} className="px-2 py-1 text-sm rounded border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Plan Details placeholder - kept in parent for now */}
    </div>
  );
};

export default MealPlansTab;
