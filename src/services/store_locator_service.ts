// src/services/store_locator_service.ts
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name: string;
  chain: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  hours: StoreHours;
  distance: number;
  inventory: StoreInventory[];
}

export interface StoreHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface StoreInventory {
  item_name: string;
  in_stock: boolean;
  price: number;
  quantity_available?: number;
  aisle?: string;
  last_updated: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

class StoreLocatorService {
  private readonly GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  private readonly KROGER_API_KEY = import.meta.env.VITE_KROGER_API_KEY;
  private readonly INSTACART_API_KEY = import.meta.env.VITE_INSTACART_API_KEY;

  async findNearbyStores(userLocation: UserLocation, radius: number = 5000): Promise<Store[]> {
    try {
      // Get user's current location if not provided
      if (!userLocation.latitude || !userLocation.longitude) {
        userLocation = await this.getCurrentLocation();
      }

      // First try to get stores from our database using the new function
      const { data: nearbyStores, error } = await supabase
        .rpc('get_nearby_stores', {
          user_lat: userLocation.latitude,
          user_lng: userLocation.longitude,
          radius_km: radius / 1000 // Convert meters to kilometers
        });

      if (error) {
        console.error('Error fetching nearby stores from database:', error);
        // Fallback to mock data
        return this.getMockStores(userLocation);
      }

      // Transform database results to Store interface
      const stores: Store[] = await Promise.all(
        nearbyStores.map(async (store: any) => {
          const inventory = await this.getStoreInventoryFromDB(store.id);
          return {
            id: store.id,
            name: store.name,
            chain: store.chain || 'independent',
            address: store.address,
            latitude: store.latitude,
            longitude: store.longitude,
            phone: store.phone || '',
            hours: store.hours || this.getDefaultHours(),
            distance: store.distance_km * 1000, // Convert km to meters
            inventory
          };
        })
      );

      return stores;
    } catch (error) {
      console.error('Error finding nearby stores:', error);
      // Return mock data for development/demo purposes
      return this.getMockStores(userLocation);
    }
  }

  async checkInventory(stores: Store[], groceryItems: string[]): Promise<Store[]> {
    try {
      const storesWithInventory = await Promise.all(
        stores.map(async (store) => {
          const inventory = await this.getStoreInventory(store, groceryItems);
          return {
            ...store,
            inventory
          };
        })
      );

      // Sort by number of items in stock
      return storesWithInventory.sort((a, b) => {
        const aInStock = a.inventory.filter(item => item.in_stock).length;
        const bInStock = b.inventory.filter(item => item.in_stock).length;
        return bInStock - aInStock;
      });
    } catch (error) {
      console.error('Error checking inventory:', error);
      throw error;
    }
  }

  private async getStoreInventoryFromDB(storeId: string): Promise<StoreInventory[]> {
    try {
      const { data, error } = await supabase
        .from('store_inventory')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;

      return data.map((item: any) => ({
        item_name: item.item_name,
        in_stock: item.in_stock,
        price: item.price || 0,
        quantity_available: item.quantity_available,
        aisle: item.aisle,
        last_updated: item.last_updated
      }));
    } catch (error) {
      console.error('Error fetching store inventory from DB:', error);
      return [];
    }
  }

  private async getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          // Fallback to IP-based location
          this.getLocationFromIP().then(resolve).catch(reject);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  private async getLocationFromIP(): Promise<UserLocation> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      // Default to a major city if all else fails
      return { latitude: 40.7128, longitude: -74.0060 }; // NYC
    }
  }

  private async searchGooglePlaces(location: UserLocation, radius: number): Promise<Store[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
        `location=${location.latitude},${location.longitude}&` +
        `radius=${radius}&` +
        `type=grocery_or_supermarket&` +
        `key=${this.GOOGLE_PLACES_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch places');
      }

      const data = await response.json();
      
      return data.results.map((place: any) => ({
        id: place.place_id,
        name: place.name,
        chain: this.identifyChain(place.name),
        address: place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        phone: '',
        hours: {} as StoreHours,
        distance: this.calculateDistance(
          location.latitude,
          location.longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
        inventory: []
      }));
    } catch (error) {
      console.error('Error searching Google Places:', error);
      // Return mock data for development/demo purposes
      return this.getMockStores(location);
    }
  }

  private async enhanceStoreData(store: Store): Promise<Store> {
    try {
      // Get detailed place information
      const placeDetails = await this.getPlaceDetails(store.id);
      
      return {
        ...store,
        phone: placeDetails.phone || store.phone,
        hours: placeDetails.hours || this.getDefaultHours(),
        address: placeDetails.address || store.address
      };
    } catch (error) {
      console.error('Error enhancing store data:', error);
      return {
        ...store,
        hours: this.getDefaultHours()
      };
    }
  }

  private async getPlaceDetails(placeId: string) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${placeId}&` +
        `fields=formatted_phone_number,opening_hours,formatted_address&` +
        `key=${this.GOOGLE_PLACES_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const data = await response.json();
      const result = data.result;

      return {
        phone: result.formatted_phone_number,
        address: result.formatted_address,
        hours: this.parseOpeningHours(result.opening_hours)
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      return {};
    }
  }

  private async getStoreInventory(store: Store, items: string[]): Promise<StoreInventory[]> {
    try {
      // Try different APIs based on store chain
      switch (store.chain.toLowerCase()) {
        case 'kroger':
        case 'ralphs':
        case 'king soopers':
          return await this.getKrogerInventory(store, items);
        
        case 'walmart':
          return await this.getWalmartInventory(store, items);
        
        case 'target':
          return await this.getTargetInventory(store, items);
        
        default:
          return await this.getGenericInventory(store, items);
      }
    } catch (error) {
      console.error('Error getting store inventory:', error);
      return this.getMockInventory(items);
    }
  }

  private async getKrogerInventory(store: Store, items: string[]): Promise<StoreInventory[]> {
    // Implementation for Kroger API (requires API key and authentication)
    // This is a simplified version - real implementation would need OAuth
    
    try {
      const inventory: StoreInventory[] = [];
      
      for (const item of items) {
        // Mock implementation - replace with actual Kroger API calls
        const mockItem: StoreInventory = {
          item_name: item,
          in_stock: Math.random() > 0.2, // 80% chance in stock
          price: Math.round((Math.random() * 10 + 1) * 100) / 100,
          quantity_available: Math.floor(Math.random() * 50) + 1,
          aisle: `Aisle ${Math.floor(Math.random() * 20) + 1}`,
          last_updated: new Date().toISOString()
        };
        inventory.push(mockItem);
      }
      
      return inventory;
    } catch (error) {
      return this.getMockInventory(items);
    }
  }

  private async getWalmartInventory(store: Store, items: string[]): Promise<StoreInventory[]> {
    // Walmart API integration would go here
    return this.getMockInventory(items);
  }

  private async getTargetInventory(store: Store, items: string[]): Promise<StoreInventory[]> {
    // Target API integration would go here
    return this.getMockInventory(items);
  }

  private async getGenericInventory(store: Store, items: string[]): Promise<StoreInventory[]> {
    // Generic inventory check for unknown chains
    return this.getMockInventory(items);
  }

  private getMockInventory(items: string[]): StoreInventory[] {
    return items.map(item => ({
      item_name: item,
      in_stock: Math.random() > 0.15, // 85% chance in stock
      price: Math.round((Math.random() * 8 + 0.5) * 100) / 100,
      quantity_available: Math.floor(Math.random() * 30) + 5,
      aisle: `Aisle ${Math.floor(Math.random() * 15) + 1}`,
      last_updated: new Date().toISOString()
    }));
  }

  private identifyChain(storeName: string): string {
    const chains = {
      'kroger': ['kroger'],
      'walmart': ['walmart', 'walmart supercenter'],
      'target': ['target'],
      'safeway': ['safeway'],
      'whole foods': ['whole foods'],
      'trader joes': ["trader joe's", 'trader joes'],
      'costco': ['costco'],
      'ralphs': ['ralphs'],
      'king soopers': ['king soopers'],
      'harris teeter': ['harris teeter'],
      'publix': ['publix'],
      'wegmans': ['wegmans']
    };

    const lowerName = storeName.toLowerCase();
    
    for (const [chain, variations] of Object.entries(chains)) {
      if (variations.some(variation => lowerName.includes(variation))) {
        return chain;
      }
    }
    
    return 'independent';
  }

  private parseOpeningHours(openingHours: any): StoreHours {
    if (!openingHours || !openingHours.weekday_text) {
      return this.getDefaultHours();
    }

    const hours: any = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    openingHours.weekday_text.forEach((dayText: string, index: number) => {
      const timeMatch = dayText.match(/:\s*(.+)/);
      hours[days[index]] = timeMatch ? timeMatch[1] : 'Closed';
    });

    return hours;
  }

  private getDefaultHours(): StoreHours {
    return {
      monday: '8:00 AM – 10:00 PM',
      tuesday: '8:00 AM – 10:00 PM',
      wednesday: '8:00 AM – 10:00 PM',
      thursday: '8:00 AM – 10:00 PM',
      friday: '8:00 AM – 10:00 PM',
      saturday: '8:00 AM – 10:00 PM',
      sunday: '8:00 AM – 9:00 PM'
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return Math.round(R * c * 1000); // Distance in meters
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getMockStores(location: UserLocation): Store[] {
    return [
      {
        id: 'mock-1',
        name: 'Kroger',
        chain: 'kroger',
        address: '123 Main St',
        latitude: location.latitude + 0.01,
        longitude: location.longitude + 0.01,
        phone: '(555) 123-4567',
        hours: this.getDefaultHours(),
        distance: 1200,
        inventory: []
      },
      {
        id: 'mock-2',
        name: 'Walmart Supercenter',
        chain: 'walmart',
        address: '456 Oak Ave',
        latitude: location.latitude - 0.015,
        longitude: location.longitude + 0.02,
        phone: '(555) 987-6543',
        hours: this.getDefaultHours(),
        distance: 1800,
        inventory: []
      },
      {
        id: 'mock-3',
        name: 'Whole Foods Market',
        chain: 'whole foods',
        address: '789 Pine Rd',
        latitude: location.latitude + 0.02,
        longitude: location.longitude - 0.01,
        phone: '(555) 456-7890',
        hours: this.getDefaultHours(),
        distance: 2100,
        inventory: []
      }
    ];
  }

  async generateShoppingList(mealPlanId: string): Promise<{
    groceryItems: string[];
    estimatedCost: number;
    storesWithInventory: Store[];
  }> {
    try {
      // Get meal plan from database
      const { data: mealPlan, error } = await supabase
        .from('enhanced_meal_plans')
        .select('grocery_list')
        .eq('id', mealPlanId)
        .single();

      if (error) throw error;

      const groceryItems = mealPlan.grocery_list.map((item: any) => item.name);

      const userLocation = await this.getCurrentLocation();
      const nearbyStores = await this.findNearbyStores(userLocation);
      const storesWithInventory = await this.checkInventory(nearbyStores, groceryItems);

      const estimatedCost = mealPlan.grocery_list.reduce((total: number, item: any) => 
        total + item.estimated_price, 0);

      return {
        groceryItems,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        storesWithInventory
      };
    } catch (error) {
      console.error('Error generating shopping list:', error);
      throw error;
    }
  }
}

export const storeLocatorService = new StoreLocatorService();