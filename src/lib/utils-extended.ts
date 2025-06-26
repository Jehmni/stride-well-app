/**
 * Utility Functions for Common Operations
 * Centralized helper functions to reduce code duplication and improve maintainability
 */

import { VALIDATION_PATTERNS, ERROR_MESSAGES, TIME_CONFIG } from '@/lib/constants';
import type { UUID, ApiResponse, ValidationRule } from '@/types';
import { toast } from 'sonner';

// UUID Utilities
export const isValidUUID = (uuid: string): boolean => {
  return VALIDATION_PATTERNS.UUID.test(uuid);
};

export const generateUUID = (): UUID => {
  return crypto.randomUUID();
};

// Validation Utilities
export const validateEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8 && VALIDATION_PATTERNS.STRONG_PASSWORD.test(password);
};

export const validateForm = (data: Record<string, any>, rules: Record<string, ValidationRule[]>): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      let ruleValid = true;
      
      switch (rule.type) {
        case 'required':
          ruleValid = value !== undefined && value !== null && value !== '';
          break;
        case 'email':
          ruleValid = !value || validateEmail(value);
          break;
        case 'minLength':
          ruleValid = !value || value.length >= rule.value;
          break;
        case 'maxLength':
          ruleValid = !value || value.length <= rule.value;
          break;
        case 'pattern':
          ruleValid = !value || rule.value.test(value);
          break;
        case 'custom':
          ruleValid = !value || (rule.validator && rule.validator(value));
          break;
      }
      
      if (!ruleValid) {
        errors[field] = rule.message;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
};

// Date/Time Utilities
export const formatDate = (date: Date | string, format: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'medium':
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    case 'long':
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'relative':
      return getRelativeTimeString(dateObj);
    default:
      return dateObj.toLocaleDateString();
  }
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / (TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE));
  const minutes = Math.floor((seconds % (TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE)) / TIME_CONFIG.SECONDS_PER_MINUTE);
  const remainingSeconds = seconds % TIME_CONFIG.SECONDS_PER_MINUTE;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / TIME_CONFIG.MILLISECONDS_PER_SECOND);
  
  if (diffInSeconds < TIME_CONFIG.SECONDS_PER_MINUTE) {
    return 'just now';
  } else if (diffInSeconds < TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE) {
    const minutes = Math.floor(diffInSeconds / TIME_CONFIG.SECONDS_PER_MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < TIME_CONFIG.HOURS_PER_DAY * TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE) {
    const hours = Math.floor(diffInSeconds / (TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE));
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < TIME_CONFIG.DAYS_PER_WEEK * TIME_CONFIG.HOURS_PER_DAY * TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE) {
    const days = Math.floor(diffInSeconds / (TIME_CONFIG.HOURS_PER_DAY * TIME_CONFIG.MINUTES_PER_HOUR * TIME_CONFIG.SECONDS_PER_MINUTE));
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date, 'short');
  }
};

// String Utilities
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text.split(' ').map(capitalizeFirst).join(' ');
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Number Utilities
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const roundToDecimal = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

// Array Utilities
export const groupBy = <T, K extends string | number>(
  array: T[], 
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

export const sortBy = <T>(
  array: T[], 
  keyFn: (item: T) => any, 
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const uniqueBy = <T, K>(array: T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Object Utilities
export const deepMerge = <T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      clonedObj[key] = deepClone(obj[key]);
    }
    return clonedObj as T;
  }
  return obj;
};

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T, 
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Error Handling Utilities
export const handleApiError = (error: any): string => {
  if (error?.message) {
    return error.message;
  } else if (error?.error?.message) {
    return error.error.message;
  } else if (typeof error === 'string') {
    return error;
  } else {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
};

export const showErrorToast = (error: any, fallbackMessage?: string): void => {
  const message = handleApiError(error) || fallbackMessage || ERROR_MESSAGES.SERVER_ERROR;
  toast.error(message);
};

export const showSuccessToast = (message: string): void => {
  toast.success(message);
};

export const createApiResponse = <T>(
  data?: T, 
  error?: any, 
  message?: string
): ApiResponse<T> => {
  return {
    data,
    error: error ? { 
      code: error.code || 'UNKNOWN_ERROR', 
      message: handleApiError(error),
      timestamp: new Date().toISOString(),
      details: error 
    } : undefined,
    success: !error,
    message
  };
};

// Debounce/Throttle Utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Local Storage Utilities
export const setStorageItem = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const getStorageItem = <T>(key: string, defaultValue?: T): T | undefined => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return defaultValue;
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// URL/Route Utilities
export const buildUrl = (base: string, params?: Record<string, string | number>): string => {
  if (!params) return base;
  
  const url = new URL(base, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  return url.toString();
};

export const parseUrlParams = (search: string = window.location.search): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

// Fitness Calculation Utilities
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100;
  return roundToDecimal(weightKg / (heightM * heightM), 1);
};

export const calculateBMR = (weightKg: number, heightCm: number, age: number, sex: 'male' | 'female'): number => {
  // Mifflin-St Jeor Equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'male' ? base + 5 : base - 161);
};

export const calculateCaloriesBurned = (
  durationMinutes: number, 
  averageHeartRate?: number, 
  weight?: number
): number => {
  // Simplified calculation - in a real app, you'd use more sophisticated formulas
  const baseCaloriesPerMinute = 5; // Base estimate
  const heartRateMultiplier = averageHeartRate ? (averageHeartRate / 140) : 1;
  const weightMultiplier = weight ? (weight / 70) : 1; // 70kg baseline
  
  return Math.round(durationMinutes * baseCaloriesPerMinute * heartRateMultiplier * weightMultiplier);
};

// Export utility object for easier importing
export const utils = {
  // UUID
  isValidUUID,
  generateUUID,
  
  // Validation
  validateEmail,
  validatePassword,
  validateForm,
  
  // Date/Time
  formatDate,
  formatTime,
  formatDuration,
  getRelativeTimeString,
  
  // String
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  slugify,
  
  // Number
  formatNumber,
  formatCurrency,
  formatPercentage,
  clamp,
  roundToDecimal,
  
  // Array
  groupBy,
  sortBy,
  unique,
  uniqueBy,
  chunk,
  
  // Object
  deepMerge,
  deepClone,
  pick,
  omit,
  
  // Error Handling
  handleApiError,
  showErrorToast,
  showSuccessToast,
  createApiResponse,
  
  // Performance
  debounce,
  throttle,
  
  // Storage
  setStorageItem,
  getStorageItem,
  removeStorageItem,
  
  // URL
  buildUrl,
  parseUrlParams,
  
  // Fitness
  calculateBMI,
  calculateBMR,
  calculateCaloriesBurned,
};
