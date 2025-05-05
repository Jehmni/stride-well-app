// This file contains the Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// IMPORTANT: This app uses a web-hosted Supabase instance, not a local one
// These are the production values needed to connect to the web Supabase instance
// DO NOT change these values as they are required for the application to work
const SUPABASE_URL = "https://japrzutwtqotzyudnizh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHJ6dXR3dHFvdHp5dWRuaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjYyMjgsImV4cCI6MjA2MDI0MjIyOH0.wFQPzwhwMzgu3P2fnqqH2Hw0RD5IDA5hF2bcwHVlLe0";

// Create and export the Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);