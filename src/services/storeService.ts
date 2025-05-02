import { supabase } from "@/integrations/supabase/client";

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

type GroceryItem = {
  name: string;
  stores: string[];
};

/**
 * Fetch nearby stores based on user location
 * 
 * In a real implementation, this would use a service like Google Places API
 * For this demo, we'll simulate it with mock data stored in Supabase
 */
export const getNearbyStores = async (
  latitude: number, 
  longitude: number, 
  radiusInKm: number = 5
): Promise<Store[]> => {
  try {
    // In a real implementation, this would call an external API
    // For demo, we'll fetch mock data from Supabase
    const { data, error } = await supabase
      .from('grocery_stores')
      .select('*');
    
    if (error) throw error;

    // Filter and sort by distance (simulated)
    const stores = (data || []) as Store[];
    
    // Calculate distance (using a simplified version of the Haversine formula)
    const storesWithDistance = stores.map(store => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        store.coordinates.latitude, 
        store.coordinates.longitude
      );
      return { ...store, distance };
    });

    // Filter by radius and sort by distance
    return storesWithDistance
      .filter(store => store.distance <= radiusInKm)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error fetching nearby stores:', error);
    return [];
  }
};

/**
 * Get stores that have specific ingredients in stock
 */
export const getStoresWithIngredients = async (
  ingredients: string[],
  latitude: number,
  longitude: number,
  radiusInKm: number = 5
): Promise<{ stores: Store[], itemAvailability: Record<string, string[]> }> => {
  try {
    // Get nearby stores
    const nearbyStores = await getNearbyStores(latitude, longitude, radiusInKm);
    
    // Create a map of ingredients to stores
    const itemAvailability: Record<string, string[]> = {};
    
    // Initialize with empty arrays
    ingredients.forEach(ingredient => {
      itemAvailability[ingredient] = [];
    });
    
    // Find which stores have each ingredient
    nearbyStores.forEach(store => {
      store.items.forEach(item => {
        // Check if this item matches any of our ingredients (simple includes check)
        ingredients.forEach(ingredient => {
          if (item.toLowerCase().includes(ingredient.toLowerCase())) {
            if (!itemAvailability[ingredient].includes(store.id)) {
              itemAvailability[ingredient].push(store.id);
            }
          }
        });
      });
    });
    
    return {
      stores: nearbyStores,
      itemAvailability
    };
  } catch (error) {
    console.error('Error getting stores with ingredients:', error);
    return { stores: [], itemAvailability: {} };
  }
};

/**
 * Simple distance calculation using Haversine formula (approximate)
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
} 