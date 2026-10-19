import { useState, useEffect, useCallback, useRef } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const initializedRef = useRef(false)
  const storedValueRef = useRef(storedValue)
  storedValueRef.current = storedValue

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value
      setStoredValue(valueToStore)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (initializedRef.current) return
    initializedRef.current = true
    
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  // Listen for storage changes from other tabs/components
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error)
        }
      }
    }
    
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail?.key === key && e.detail?.value !== undefined) {
        setStoredValue(e.detail.value)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('theme-storage-change', handleCustomStorageChange as EventListener)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-storage-change', handleCustomStorageChange as EventListener)
    }
  }, [key])

  return [storedValue, setValue]
}