'use client'

import { useMemo } from 'react'

/**
 * Custom hook to safely work with array state
 * Automatically handles conversion of non-array values to arrays
 * Useful for data from APIs that might return undefined, null, or non-array values
 *
 * @example
 * const inventoryArray = useArrayState(inventory)
 * const recipesArray = useArrayState(recipes, [])
 * // Both will always return arrays, never null/undefined
 */
export function useArrayState<T>(
  data: T[] | T | undefined | null,
  defaultValue: T[] = []
): T[] {
  return useMemo(() => {
    // If data is already an array, return it
    if (Array.isArray(data)) {
      return data
    }

    // If data is null or undefined, return default
    if (data === null || data === undefined) {
      return defaultValue
    }

    // If data is a single item (not array), wrap it in an array
    return [data]
  }, [data, defaultValue])
}
