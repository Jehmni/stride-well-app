import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  aiMealPlans: any[];
  setGeneratedAIMealPlan: (plan: any | null) => void;
  generateShoppingList: (id: string) => void;
  isGeneratingShoppingList: boolean;
  generatedAIMealPlan: any | null;
}

const AIPlansTab: React.FC<Props> = ({ aiMealPlans, setGeneratedAIMealPlan, generateShoppingList, isGeneratingShoppingList, generatedAIMealPlan }) => {
  return (
    <div className="space-y-6">
      {aiMealPlans.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No AI Meal Plans Yet</h3>
        </div>
      ) : (
        <div className="grid gap-6">
          {aiMealPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-2">Week of {new Date(plan.week_start_date).toLocaleDateString()}</CardTitle>
                    <CardDescription className="mb-2">{plan.daily_calories} calories/day • {plan.fitness_goal}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setGeneratedAIMealPlan(plan)}>View Plan</Button>
                    <Button variant="outline" size="sm" onClick={() => generateShoppingList(plan.id)} disabled={isGeneratingShoppingList}>Shopping</Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Generated AI Meal Plan Display handled by parent for now */}
    </div>
  );
};

export default AIPlansTab;
