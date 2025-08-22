import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StoreCard from './StoreCard';

interface Props {
  shoppingList: any | null;
}

const ShoppingTab: React.FC<Props> = ({ shoppingList }) => {
  return (
    <div>
      {shoppingList ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">Grocery List</CardTitle>
                <CardDescription>Estimated total: ${shoppingList.estimatedCost}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {shoppingList.groceryItems.map((item: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2 p-2 rounded border">
                      <input type="checkbox" />
                      <span className="flex-1">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">Nearby Stores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {shoppingList.storesWithInventory.slice(0, 3).map((store: any) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No Shopping List Yet</h3>
        </div>
      )}
    </div>
  );
};

export default ShoppingTab;
