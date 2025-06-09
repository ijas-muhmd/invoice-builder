"use client"

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    return initialValue
  })

  // Load initial value from IndexedDB
  useEffect(() => {
    const loadValue = async () => {
    try {
        const value = await db.get('settings', key)
        if (value !== undefined) {
          setStoredValue(value)
        }
    } catch (error) {
        console.warn(`Error reading from IndexedDB key "${key}":`, error)
      }
    }
    loadValue()
  }, [key])

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to IndexedDB.
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to IndexedDB
      if (typeof window !== 'undefined') {
        await db.set('settings', key, valueToStore)
      }
    } catch (error) {
      console.warn(`Error setting IndexedDB key "${key}":`, error)
    }
  }

  return [storedValue, setValue] as const
} 