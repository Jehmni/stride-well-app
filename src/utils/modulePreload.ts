/**
 * This utility helps with preloading critical modules
 * to prevent chunk loading errors in production builds
 */

import { lazy } from 'react';

// Helper to preload lazy-loaded modules
export const preloadModule = (importFn: () => Promise<any>) => {
  // Start loading the module immediately
  const modulePromise = importFn();
  
  // Return the lazy component that uses the already-started promise
  return lazy(() => modulePromise);
};

/**
 * Preload dashboard-related components to ensure they're available
 * when needed. This helps prevent chunk loading errors.
 */
export const preloadDashboardModules = () => {
  // Preload all dashboard components
  const componentsPromise = import('@/components/dashboard/DashboardLayout');
  const workoutStatsPromise = import('@/hooks/useWorkoutStats');
  const schedulePromise = import('@/hooks/useWorkoutSchedule');
  const nutritionPromise = import('@/hooks/useNutrition');
  
  // Return a promise that resolves when all modules are loaded
  return Promise.all([
    componentsPromise, 
    workoutStatsPromise, 
    schedulePromise, 
    nutritionPromise
  ]);
}; 