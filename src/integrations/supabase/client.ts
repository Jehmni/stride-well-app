
// This file contains the Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Production Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Check what values are being loaded
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_PUBLISHABLE_KEY exists:', !!SUPABASE_PUBLISHABLE_KEY);

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
