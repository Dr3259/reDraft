
"use client";

import { useState, useEffect, useCallback } from 'react';

function debounce<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export function useAutosave<T>(
  storageKey: string,
  initialValue: T,
  saveDelay: number = 1000
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });

  const debouncedSave = useCallback(
    debounce((currentValue: T) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(currentValue));
        } catch (error) {
          console.error(`Error setting localStorage key "${storageKey}":`, error);
        }
      }
    }, saveDelay),
    [storageKey, saveDelay]
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      debouncedSave(value);
    }
  }, [value, debouncedSave]);

  return [value, setValue];
}

