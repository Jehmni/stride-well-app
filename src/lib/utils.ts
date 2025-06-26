import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { VALIDATION_PATTERNS } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates if a string is a valid UUID
 * @param uuid The string to test
 * @returns True if the string is a valid UUID
 * @deprecated Use utils.isValidUUID from @/lib/utils-extended instead
 */
export const isValidUUID = (uuid: string): boolean => {
  return VALIDATION_PATTERNS.UUID.test(uuid);
};

// Re-export commonly used utilities for backward compatibility
export { 
  isValidUUID as validateUUID,
  validateEmail,
  formatDate,
  formatTime,
  capitalizeFirst,
  debounce,
  throttle
} from './utils-extended';
