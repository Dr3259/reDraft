"use client";

import { useState, useEffect, useCallback } from 'react';

function debounce<F extends (...args: any[]) => any>(func: F, delay: number): (...args: Parameters<F>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

export function useAutosave(
  storageKey: string,
  initialValue: string,
  saveDelay: number = 1000
): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(storageKey);
      return item ? item : initialValue; // Assuming string content, no JSON.parse initially
    } catch (error) {
      console.error(`Error reading localStorage key "${storageKey}":`, error);
      return initialValue;
    }
  });

  const debouncedSave = useCallback(
    debounce((currentValue: string) => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, currentValue);
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
