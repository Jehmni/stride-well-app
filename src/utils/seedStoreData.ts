
import { supabase } from "@/integrations/supabase/client";

// Function to seed grocery store data into the database
export const seedGroceryStores = async () => {
  const { data, error } = await supabase
    .from('grocery_stores')
    .select('id')
    .limit(1);
    
  if (data && data.length > 0) {
    console.log("Store data already exists, skipping seeding");
    return;
  }
    
  const storeData = [
    {
      name: 'Healthy Foods Market',
      address: '123 Main St, Anytown',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      items: ['Chicken Breast', 'Brown Rice', 'Broccoli', 'Protein Powder', 'Quinoa', 'Avocado'],
      phone: '555-123-4567',
      hours: {
        open: '08:00',
        close: '21:00'
      },
      rating: 4.5,
      image_url: 'https://images.unsplash.com/photo-1534723452862-4c874018d8d4'
    },
    {
      name: 'Fitness Nutrition Center',
      address: '456 Oak St, Anytown',
      coordinates: {
        latitude: 40.7135, 
        longitude: -74.0090
      },
      items: ['Protein Powder', 'Eggs', 'Greek Yogurt', 'Nuts', 'Protein Bars', 'Pre-Workout'],
      phone: '555-987-6543',
      hours: {
        open: '07:00',
        close: '20:00'
      },
      rating: 4.2,
      image_url: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818'
    },
    {
      name: 'Fresh Produce Market',
      address: '789 Maple St, Anytown',
      coordinates: {
        latitude: 40.7165,
        longitude: -74.0030
      },
      items: ['Spinach', 'Berries', 'Sweet Potatoes', 'Avocado', 'Kale', 'Apples', 'Bananas'],
      phone: '555-567-8901',
      hours: {
        open: '09:00',
        close: '18:00'
      },
      rating: 4.7,
      image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9'
    },
    {
      name: 'Organic Health Shoppe',
      address: '321 Pine St, Anytown',
      coordinates: {
        latitude: 40.7145,
        longitude: -74.0080
      },
      items: ['Organic Chicken', 'Grass-fed Beef', 'Coconut Oil', 'Almond Milk', 'Chia Seeds', 'Hemp Protein'],
      phone: '555-234-5678',
      hours: {
        open: '08:30',
        close: '19:30'
      },
      rating: 4.6,
      image_url: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2'
    },
    {
      name: 'Vitamin World',
      address: '555 Grove St, Anytown',
      coordinates: {
        latitude: 40.7115,
        longitude: -74.0050
      },
      items: ['Multivitamins', 'Fish Oil', 'Vitamin D', 'Probiotics', 'Creatine', 'BCAAs'],
      phone: '555-345-6789',
      hours: {
        open: '09:00',
        close: '20:00'
      },
      rating: 4.1,
      image_url: 'https://images.unsplash.com/photo-1556760544-74068565f05c'
    }
  ];
  
  try {
    const { error } = await supabase.from('grocery_stores').insert(storeData);
    
    if (error) throw error;
    
    console.log("Successfully seeded grocery store data");
  } catch (error) {
    console.error("Error seeding grocery store data:", error);
  }
};
