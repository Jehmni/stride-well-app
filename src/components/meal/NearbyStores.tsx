
import React, { useState, useEffect } from 'react';
import { Map, ExternalLink, List, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStoresWithIngredients, Store as StoreType } from '@/services/storeService';

interface NearbyStoresProps {
  latitude: number;
  longitude: number;
  radiusInKm?: number;
  ingredients?: string[];
}

const NearbyStores: React.FC<NearbyStoresProps> = ({ 
  latitude, 
  longitude, 
  radiusInKm = 5,
  ingredients = []
}) => {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemAvailability, setItemAvailability] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);

        const { stores, itemAvailability } = await getStoresWithIngredients(
          ingredients,
          latitude,
          longitude,
          radiusInKm
        );

        setStores(stores);
        setItemAvailability(itemAvailability);
      } catch (err) {
        console.error('Error fetching nearby stores:', err);
        setError('Failed to load nearby stores. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [latitude, longitude, radiusInKm, ingredients]);

  // Get items available at a specific store
  const getAvailableItems = (storeId: string): string[] => {
    const availableItems: string[] = [];

    Object.entries(itemAvailability).forEach(([item, storeIds]) => {
      if (storeIds.includes(storeId)) {
        availableItems.push(item);
      }
    });

    return availableItems;
  };

  // Open directions to the store in Google Maps
  const getDirections = (store: StoreType) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${store.coordinates.latitude},${store.coordinates.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin h-10 w-10 border-4 border-fitness-primary border-opacity-50 border-t-fitness-primary rounded-full mx-auto"></div>
        <p className="mt-4">Searching for stores near you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-10">
        <Map className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-4 text-lg font-medium">No Stores Found</h3>
        <p className="mt-2 text-gray-500">
          {ingredients.length > 0 
            ? `We couldn't find any stores within ${radiusInKm}km that carry your items.`
            : `We couldn't find any stores within ${radiusInKm}km of your location.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Showing {stores.length} stores within {radiusInKm}km of your location
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button 
            variant={viewMode === 'map' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-4">
          {stores.map((store) => {
            const availableItems = getAvailableItems(store.id);

            return (
              <Card key={store.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {store.image_url && (
                      <div className="md:w-1/3">
                        <img
                          src={store.image_url}
                          alt={store.name}
                          className="h-48 md:h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 md:w-2/3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold">{store.name}</h3>
                          <p className="text-gray-600 dark:text-gray-400">{store.address}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm font-semibold">{store.distance} km away</span>
                            {store.rating && (
                              <span className="ml-4 flex items-center">
                                <span className="text-yellow-400">★</span>
                                <span className="text-sm ml-1">{store.rating}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          onClick={() => getDirections(store)}
                        >
                          <Navigation2 className="h-4 w-4 mr-1" />
                          Directions
                        </Button>
                      </div>

                      {availableItems.length > 0 && ingredients.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-1">Available Items</h4>
                          <div className="flex flex-wrap gap-1">
                            {availableItems.map((item, i) => (
                              <span
                                key={i}
                                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {store.hours && (
                        <div className="mt-4 text-sm">
                          <span className="font-medium">Hours:</span> {store.hours.open} - {store.hours.close}
                        </div>
                      )}

                      {store.phone && (
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Phone:</span> {store.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="h-[500px] rounded-lg overflow-hidden border">
          <iframe
            title="Store Locations"
            width="100%"
            height="100%"
            src={`https://www.google.com/maps/embed/v1/search?q=grocery+stores+near+${latitude},${longitude}&key=YOUR_API_KEY&zoom=13`}
            allowFullScreen
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default NearbyStores;
