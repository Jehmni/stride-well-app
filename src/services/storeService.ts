import { supabase } from "@/integrations/supabase/client";

export type Store = {
  id: string;
  name: string;
  address: string;
  distance: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  items: string[];
  phone?: string;
  hours?: {
    open: string;
    close: string;
  };
  rating?: number;
  image_url?: string;
};

export type GroceryItem = {
  name: string;
  category: string;
  stores: string[];
};

type StoreFilterOptions = {
  maxDistance?: number;
  openNow?: boolean;
  hasItemsInStock?: string[];
  sortBy?: 'distance' | 'rating';
};

/**
 * Fetch nearby stores based on user location
 * 
 * This uses the grocery_stores table in Supabase
 */
export const getNearbyStores = async (
  latitude: number, 
  longitude: number, 
  radiusInKm: number = 5,
  options?: StoreFilterOptions
): Promise<Store[]> => {
  try {
    // In a real implementation, we would use PostGIS for radius queries
    // Here we'll retrieve all stores and filter them in-memory
    const { data: dbStores, error } = await supabase
      .from('grocery_stores')
      .select('*');
      
    if (error) throw error;

    if (!dbStores || dbStores.length === 0) {
      // Return mock data as fallback if no stores in database
      const mockStores: Store[] = [
        {
          id: '1',
          name: 'Healthy Foods Market',
          address: '123 Main St, Anytown',
          distance: 0.8,
          coordinates: {
            latitude: latitude + 0.01,
            longitude: longitude - 0.01
          },
          items: ['Chicken Breast', 'Brown Rice', 'Broccoli', 'Protein Powder'],
          phone: '555-123-4567',
          hours: {
            open: '08:00',
            close: '21:00'
          },
          rating: 4.5,
          image_url: 'https://images.unsplash.com/photo-1534723452862-4c874018d8d4'
        },
        {
          id: '2',
          name: 'Fitness Nutrition Center',
          address: '456 Oak St, Anytown',
          distance: 1.5,
          coordinates: {
            latitude: latitude - 0.02,
            longitude: longitude + 0.01
          },
          items: ['Protein Powder', 'Eggs', 'Greek Yogurt', 'Nuts'],
          phone: '555-987-6543',
          hours: {
            open: '07:00',
            close: '20:00'
          },
          rating: 4.2,
          image_url: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818'
        },
        {
          id: '3',
          name: 'Fresh Produce Market',
          address: '789 Maple St, Anytown',
          distance: 2.3,
          coordinates: {
            latitude: latitude + 0.03,
            longitude: longitude + 0.02
          },
          items: ['Spinach', 'Berries', 'Sweet Potatoes', 'Avocado'],
          phone: '555-567-8901',
          hours: {
            open: '09:00',
            close: '18:00'
          },
          rating: 4.7,
          image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9'
        }
      ];
      return mockStores;
    }
    
    // Calculate distance and convert to Store type
    let stores: Store[] = dbStores.map(store => {
      const storeCoords = store.coordinates as { latitude: number, longitude: number };
      
      // Add null check for coordinates
      if (!storeCoords || typeof storeCoords.latitude !== 'number' || typeof storeCoords.longitude !== 'number') {
        console.warn(`Store ${store.id} has invalid coordinates:`, storeCoords);
        // Return a store with default coordinates and max distance
        return {
          id: store.id,
          name: store.name,
          address: store.address,
          distance: 999999, // Very far away
          coordinates: { latitude: 0, longitude: 0 },
          items: store.items,
          phone: store.phone,
          hours: store.hours as { open: string, close: string } || undefined,
          rating: store.rating,
          image_url: store.image_url
        };
      }
      
      const distance = calculateDistance(
        latitude, 
        longitude, 
        storeCoords.latitude, 
        storeCoords.longitude
      );
      
      return {
        id: store.id,
        name: store.name,
        address: store.address,
        distance: distance,
        coordinates: storeCoords,
        items: store.items,
        phone: store.phone,
        hours: store.hours as { open: string, close: string } || undefined,
        rating: store.rating,
        image_url: store.image_url
      };
    });
    
    // Filter and sort by distance (simulated)
    let filteredStores = stores;
    
    // Filter by radius
    filteredStores = filteredStores.filter(store => 
      store.distance <= (options?.maxDistance || radiusInKm)
    );
    
    // Filter by open now
    if (options?.openNow) {
      const now = new Date();
      const currentHour = now.getHours();
      
      filteredStores = filteredStores.filter(store => {
        if (!store.hours) return true; // If no hours, assume always open
        
        const openHour = parseInt(store.hours.open.split(':')[0]);
        const closeHour = parseInt(store.hours.close.split(':')[0]);
        
        return currentHour >= openHour && currentHour < closeHour;
      });
    }
    
    // Filter by items in stock
    if (options?.hasItemsInStock && options.hasItemsInStock.length > 0) {
      filteredStores = filteredStores.filter(store => 
        options.hasItemsInStock!.every(item => 
          store.items.some(storeItem => 
            storeItem.toLowerCase().includes(item.toLowerCase())
          )
        )
      );
    }
    
    // Apply sorting
    if (options?.sortBy === 'rating') {
      filteredStores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default sorting by distance
      filteredStores.sort((a, b) => a.distance - b.distance);
    }

    return filteredStores;
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
): Promise<{ stores: Store[], itemAvailability: Record<string, string[]>, optimizedRoute?: Store[] }> => {
  try {
    // Get nearby stores
    const nearbyStores = await getNearbyStores(latitude, longitude, radiusInKm, {
      hasItemsInStock: ingredients
    });
    
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
    
    // Calculate optimized route (simplified)
    // In a real app, this would use a proper TSP algorithm
    let optimizedRoute: Store[] = [];
    
    if (nearbyStores.length > 0) {
      // Start with nearest store
      let remainingStores = [...nearbyStores];
      let currentLocation = { latitude, longitude };
      
      while (remainingStores.length > 0) {
        // Find nearest store to current location
        let minDist = Number.MAX_VALUE;
        let nearestStoreIndex = -1;
        
        remainingStores.forEach((store, index) => {
          const dist = calculateDistance(
            currentLocation.latitude, 
            currentLocation.longitude, 
            store.coordinates.latitude, 
            store.coordinates.longitude
          );
          
          if (dist < minDist) {
            minDist = dist;
            nearestStoreIndex = index;
          }
        });
        
        if (nearestStoreIndex !== -1) {
          const nextStore = remainingStores[nearestStoreIndex];
          optimizedRoute.push(nextStore);
          currentLocation = nextStore.coordinates;
          remainingStores.splice(nearestStoreIndex, 1);
        }
      }
    }
    
    return {
      stores: nearbyStores,
      itemAvailability,
      optimizedRoute
    };
  } catch (error) {
    console.error('Error getting stores with ingredients:', error);
    return { stores: [], itemAvailability: {} };
  }
};

/**
 * Get recommended grocery items based on a meal plan
 */
export const getRecommendedItems = async (
  mealPlanId: string
): Promise<GroceryItem[]> => {
  try {
    // Fetch meal plan details
    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_plan_id', mealPlanId);
      
    if (error) throw error;
    
    if (!meals || meals.length === 0) {
      return [];
    }
    
    // Extract ingredients from recipe (in real app would parse recipe text)
    // For demo, we'll return mock data
    const mockGroceryItems: GroceryItem[] = [
      { name: "Chicken Breast", category: "Protein", stores: [] },
      { name: "Brown Rice", category: "Grains", stores: [] },
      { name: "Broccoli", category: "Vegetables", stores: [] },
      { name: "Olive Oil", category: "Oils", stores: [] },
      { name: "Protein Powder", category: "Supplements", stores: [] },
      { name: "Eggs", category: "Protein", stores: [] },
      { name: "Oats", category: "Grains", stores: [] },
      { name: "Spinach", category: "Vegetables", stores: [] },
      { name: "Greek Yogurt", category: "Dairy", stores: [] },
      { name: "Berries", category: "Fruits", stores: [] }
    ];
    
    return mockGroceryItems;
  } catch (error) {
    console.error('Error getting recommended items:', error);
    return [];
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
