
import React, { useState, useEffect } from 'react';
import { Map, ExternalLink, List, Navigation2, ShoppingCart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getStoresWithIngredients, Store as StoreType } from '@/services/storeService';
import { useGeolocation } from '@/hooks/useGeolocation';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>(ingredients);
  const [distance, setDistance] = useState<number>(radiusInKm);
  const { calculateDistance } = useGeolocation();

  // Use effect to fetch stores based on ingredients and location
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);

        const { stores, itemAvailability } = await getStoresWithIngredients(
          selectedItems.length > 0 ? selectedItems : ingredients,
          latitude,
          longitude,
          distance
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

    // Only fetch if we have valid coordinates
    if (latitude && longitude) {
      fetchStores();
    }
  }, [latitude, longitude, distance, selectedItems]);

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

  // Filter stores based on search query
  const filteredStores = stores.filter(store => {
    const searchLower = searchQuery.toLowerCase();
    if (!searchQuery) return true;
    
    // Match store name or address
    if (
      store.name.toLowerCase().includes(searchLower) ||
      store.address.toLowerCase().includes(searchLower)
    ) {
      return true;
    }
    
    // Match items in stock
    const availableItems = getAvailableItems(store.id);
    return availableItems.some(item => item.toLowerCase().includes(searchLower));
  });

  // Handle ingredient selection
  const toggleIngredient = (ingredient: string) => {
    setSelectedItems(prev => 
      prev.includes(ingredient)
        ? prev.filter(item => item !== ingredient)
        : [...prev, ingredient]
    );
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

  return (
    <div className="space-y-6">
      {/* Filter section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <Search className="mr-2 h-4 w-4" />
            Find Stores
          </h3>
          <Input
            placeholder="Search by store name or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium mr-2">Distance:</span>
            <Button 
              size="sm" 
              variant={distance === 2 ? "default" : "outline"}
              onClick={() => setDistance(2)}
            >
              2km
            </Button>
            <Button 
              size="sm" 
              variant={distance === 5 ? "default" : "outline"}
              onClick={() => setDistance(5)}
            >
              5km
            </Button>
            <Button 
              size="sm" 
              variant={distance === 10 ? "default" : "outline"}
              onClick={() => setDistance(10)}
            >
              10km
            </Button>
          </div>
        </div>
        
        {ingredients.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ingredients needed:
            </h4>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ingredient-${index}`}
                    checked={selectedItems.includes(ingredient)}
                    onCheckedChange={() => toggleIngredient(ingredient)}
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className="text-sm cursor-pointer"
                  >
                    {ingredient}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Showing {filteredStores.length} stores within {distance}km of your location
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

      {filteredStores.length === 0 ? (
        <div className="text-center py-10">
          <Map className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Stores Found</h3>
          <p className="mt-2 text-gray-500">
            {selectedItems.length > 0 
              ? `We couldn't find any stores within ${distance}km that carry your selected items.`
              : `We couldn't find any stores within ${distance}km of your location.`
            }
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredStores.map((store) => {
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

                      {availableItems.length > 0 && selectedItems.length > 0 && (
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
