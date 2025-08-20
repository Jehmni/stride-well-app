import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StoreCardProps {
  store: any;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const inStockCount = store.inventory?.filter((item: any) => item.in_stock).length || 0;
  const totalItems = store.inventory?.length || 0;

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold">{store.name}</h4>
          <p className="text-xs text-gray-600">{store.address}</p>
        </div>
        <Badge variant={inStockCount === totalItems ? 'default' : 'secondary'}>
          {Math.round(store.distance || 0)}m away
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center text-green-600">
          {inStockCount}/{totalItems} items
        </span>
        <span className="text-gray-500">{store.phone}</span>
      </div>
    </div>
  );
};

export default StoreCard;
