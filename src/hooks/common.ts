/**
 * Custom Hooks for Improved State Management
 * Reusable hooks to reduce code duplication and improve component logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce, setStorageItem, getStorageItem } from '@/lib/utils-extended';
import type { LoadingState, ApiResponse } from '@/types';

// Generic Loading State Hook
export const useLoadingState = <T = any>(initialData?: T) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: initialData });
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset
  };
};

// Async Operation Hook
export const useAsyncOperation = <T = any>() => {
  const { isLoading, error, data, setLoading, setError, setData } = useLoadingState<T>();

  const execute = useCallback(async (operation: () => Promise<T>) => {
    setLoading(true);
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    }
  }, [setLoading, setError, setData]);

  return {
    isLoading,
    error,
    data,
    execute
  };
};

// API Hook with Retry Logic
export const useApiCall = <T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    retries?: number;
    retryDelay?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  } = {}
) => {
  const {
    immediate = true,
    retries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options;

  const { isLoading, error, data, setLoading, setError, setData } = useLoadingState<T>();
  const retryCountRef = useRef(0);

  const makeRequest = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
        onSuccess?.(response.data);
        retryCountRef.current = 0;
      } else {
        throw new Error(response.error?.message || 'API call failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      
      if (retryCountRef.current < retries) {
        retryCountRef.current++;
        setTimeout(makeRequest, retryDelay * retryCountRef.current);
      } else {
        setError(errorMessage);
        onError?.(errorMessage);
        retryCountRef.current = 0;
      }
    }
  }, [apiCall, retries, retryDelay, setLoading, setError, setData, onSuccess, onError]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    makeRequest();
  }, [makeRequest]);

  useEffect(() => {
    if (immediate) {
      makeRequest();
    }
  }, dependencies);

  return {
    isLoading,
    error,
    data,
    retry,
    refetch: makeRequest
  };
};

// Local Storage Hook with Sync
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    return getStorageItem(key, initialValue) ?? initialValue;
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      setStorageItem(key, valueToStore);
    } catch (error) {
      console.error('Error setting localStorage value:', error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage value:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Debounced Value Hook
export const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedValue(value);
    }, delay);

    handler();

    return () => {
      clearTimeout(handler as any);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Previous Value Hook
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// Toggle Hook
export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return {
    value,
    toggle,
    setTrue,
    setFalse,
    setValue
  };
};

// Counter Hook
export const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback((step: number = 1) => {
    setCount(c => c + step);
  }, []);

  const decrement = useCallback((step: number = 1) => {
    setCount(c => c - step);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return {
    count,
    increment,
    decrement,
    reset,
    setCount
  };
};

// Array State Hook
export const useArray = <T>(initialValue: T[] = []) => {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((element: T) => {
    setArray(arr => [...arr, element]);
  }, []);

  const filter = useCallback((callback: (item: T, index: number) => boolean) => {
    setArray(arr => arr.filter(callback));
  }, []);

  const update = useCallback((index: number, newElement: T) => {
    setArray(arr => arr.map((item, i) => i === index ? newElement : item));
  }, []);

  const remove = useCallback((index: number) => {
    setArray(arr => arr.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const reset = useCallback(() => {
    setArray(initialValue);
  }, [initialValue]);

  return {
    array,
    set: setArray,
    push,
    filter,
    update,
    remove,
    clear,
    reset
  };
};

// Intersection Observer Hook
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options]);

  return [setNode, entry] as const;
};

// Media Query Hook
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

// Online Status Hook
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Form State Hook
export const useFormState = <T extends Record<string, any>>(
  initialState: T,
  validationRules?: Record<keyof T, any>
) => {
  const [values, setValues] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors]);

  const setError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const setTouched = useCallback((name: keyof T, isTouched: boolean = true) => {
    setTouchedState(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  const handleChange = useCallback((name: keyof T) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked
      : event.target.value;
    setValue(name, value);
  }, [setValue]);

  const handleBlur = useCallback((name: keyof T) => () => {
    setTouched(name, true);
  }, [setTouched]);

  const reset = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouchedState({});
  }, [initialState]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched,
    handleChange,
    handleBlur,
    reset,
    isValid
  };
};

// Clipboard Hook
export const useClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  }, []);

  return {
    copied,
    copy
  };
};
