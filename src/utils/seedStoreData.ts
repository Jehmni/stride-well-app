
import { supabase } from "@/integrations/supabase/client";

// Mock data for grocery stores
const mockGroceryStores = [
  {
    id: '4f2a5f0c-b5d5-4b7a-b1c1-0dce8e1e551a',  // Using proper UUID format
    name: 'Healthy Foods Market',
    address: '123 Main St, Anytown',
    coordinates: {
      latitude: 34.052235,
      longitude: -118.243683
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
    id: '662f7e68-f33e-42c7-bdfa-74a051ced8a5',  // Using proper UUID format
    name: 'Fitness Nutrition Center',
    address: '456 Oak St, Anytown',
    coordinates: {
      latitude: 34.052235,
      longitude: -118.243683
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
    id: '3a7b9c21-5f8d-4e6a-9c0b-2d3a4f5e6b7c',  // Using proper UUID format
    name: 'Fresh Produce Market',
    address: '789 Maple St, Anytown',
    coordinates: {
      latitude: 34.052235,
      longitude: -118.243683
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

// Function to seed grocery store data into Supabase
export const seedGroceryStores = async () => {
  try {
    // Check if stores already exist
    const { data: existingStores, error: fetchError } = await supabase
      .from('grocery_stores')
      .select('id')
      .limit(1);
      
    if (fetchError) {
      console.error("Error checking grocery stores:", fetchError);
      return;
    }
    
    // Skip seeding if stores already exist
    if (existingStores && existingStores.length > 0) {
      console.log("Grocery stores already seeded, skipping...");
      return;
    }
    
    // Direct insert with proper UUIDs
    const { data, error } = await supabase
      .from('grocery_stores')
      .insert(mockGroceryStores);
      
    if (error) {
      console.error("Error seeding grocery store data:", error);
    } else {
      console.log("Grocery stores seeded successfully!");
    }
  } catch (err) {
    console.error("Error in seed function:", err);
  }
};
