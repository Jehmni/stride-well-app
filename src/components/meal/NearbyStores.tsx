import React, { useState, useEffect } from "react";
import { MapPin, ShoppingCart, Store, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getStoresWithIngredients } from "@/services/storeService";
import { toast } from "sonner";

type NearbyStoresProps = {
  ingredients: string[];
  onStoreSelect?: (storeId: string) => void;
};

type Store = {
  id: string;
  name: string;
  address: string;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  items: string[];
};

const NearbyStores: React.FC<NearbyStoresProps> = ({ 
  ingredients,
  onStoreSelect 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [itemAvailability, setItemAvailability] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { latitude, longitude, error: locationError, loading: locationLoading } = useGeolocation();

  useEffect(() => {
    const fetchStores = async () => {
      if (!latitude || !longitude || !ingredients.length) return;
      
      try {
        setIsLoading(true);
        const result = await getStoresWithIngredients(
          ingredients,
          latitude,
          longitude,
          5 // 5km radius
        );
        
        setStores(result.stores);
        setItemAvailability(result.itemAvailability);
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Unable to fetch nearby stores");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [latitude, longitude, ingredients]);

  const handleViewOnMap = (store: Store) => {
    // Open in Google Maps
    const url = `https://www.google.com/maps/search/?api=1&query=${store.coordinates.latitude},${store.coordinates.longitude}`;
    window.open(url, '_blank');
  };

  // Calculate which store has the most ingredients
  const getBestStore = (): Store | null => {
    if (!stores.length) return null;

    const storeCounts = stores.map(store => {
      let count = 0;
      Object.values(itemAvailability).forEach(storeIds => {
        if (storeIds.includes(store.id)) count++;
      });
      return { store, count };
    });

    storeCounts.sort((a, b) => b.count - a.count);
    return storeCounts[0]?.store || null;
  };

  const bestStore = getBestStore();
  const totalIngredients = ingredients.length;

  if (locationLoading || isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center mb-2">
            <Store className="h-5 w-5 mr-2 text-gray-500" />
            <h3 className="text-sm font-medium">Finding nearby stores...</h3>
          </div>
          <Skeleton className="h-12 w-full rounded-md mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (locationError) {
    return (
      <Card className="mb-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Enable location to see nearby stores with these ingredients
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stores.length) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Store className="h-5 w-5 mr-2 text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No stores found nearby with these ingredients
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer bg-gray-50 dark:bg-gray-800 flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />
            <div>
              <h3 className="text-sm font-medium">Get Ingredients Nearby</h3>
              {bestStore && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {bestStore.name} ({bestStore.distance}km) has 
                  {" "}
                  <span className="font-medium">
                    {Object.values(itemAvailability).filter(storeIds => 
                      storeIds.includes(bestStore.id)
                    ).length}/{totalIngredients}
                  </span>
                  {" "}ingredients
                </p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>

        {isExpanded && (
          <div className="p-4">
            <h4 className="text-sm font-medium mb-3">Nearby Grocery Stores</h4>
            <div className="space-y-3">
              {stores.slice(0, 3).map(store => {
                const availableCount = Object.values(itemAvailability).filter(
                  storeIds => storeIds.includes(store.id)
                ).length;
                
                return (
                  <div key={store.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="bg-primary/10 p-2 rounded">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm">{store.name}</h5>
                      <p className="text-xs text-gray-500 truncate">{store.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {availableCount}/{totalIngredients} ingredients
                        </span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {store.distance}km away
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewOnMap(store)}
                        className="h-8 w-8 p-0"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        className="h-8"
                        onClick={() => onStoreSelect?.(store.id)}
                      >
                        Shop
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {stores.length > 3 && (
              <Button 
                variant="link" 
                className="w-full mt-2 text-xs"
                onClick={() => window.open(
                  `https://www.google.com/maps/search/grocery+stores+near+me`, 
                  '_blank'
                )}
              >
                View all {stores.length} stores on map
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NearbyStores; 