'use client'

import { useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

/**
 * Custom hook for managing data loading with built-in deduplication
 * Prevents multiple simultaneous requests for the same data
 *
 * @example
 * const { load, isLoading, error } = useDataLoader()
 * 
 * const loadInventory = useCallback(async () => {
 *   await load('inventory', async () => {
 *     const { data } = await supabase.from('inventory').select()
 *     setInventory(data)
 *   })
 * }, [load])
 */
export function useDataLoader() {
  const loadingRefs = useRef<Record<string, boolean>>({})
  const loadedRefs = useRef<Record<string, boolean>>({})

  const load = useCallback(
    async (
      key: string,
      loadFn: () => Promise<void>,
      options: {
        forceReload?: boolean
        onError?: (error: Error) => void
      } = {}
    ) => {
      const { forceReload = false, onError } = options

      // Skip if already loaded and not forcing reload
      if (loadedRefs.current[key] && !forceReload) {
        logger.debug(`Data "${key}" already loaded, skipping`)
        return
      }

      // Skip if already loading
      if (loadingRefs.current[key]) {
        logger.debug(`Data "${key}" is already loading, skipping duplicate request`)
        return
      }

      try {
        loadingRefs.current[key] = true
        logger.info(`Loading data: ${key}`)

        await loadFn()

        loadedRefs.current[key] = true
        logger.info(`Loaded data: ${key}`)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error(`Failed to load data: ${key}`, {}, err)

        if (onError) {
          onError(err)
        }
      } finally {
        loadingRefs.current[key] = false
      }
    },
    []
  )

  const isLoading = (key: string): boolean => {
    return loadingRefs.current[key] ?? false
  }

  const isLoaded = (key: string): boolean => {
    return loadedRefs.current[key] ?? false
  }

  const reset = useCallback((key?: string) => {
    if (key) {
      delete loadedRefs.current[key]
      delete loadingRefs.current[key]
    } else {
      loadingRefs.current = {}
      loadedRefs.current = {}
    }
  }, [])

  return {
    load,
    isLoading,
    isLoaded,
    reset
  }
}
