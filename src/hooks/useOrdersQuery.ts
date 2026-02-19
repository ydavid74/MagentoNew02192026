import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { orderService, type OrderFilter } from '@/services/orders'
import { itemService } from '@/services/items'
import { auditService } from '@/services/audit'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

// Enhanced error handler for authentication issues
const handleAuthError = (error: any) => {
  if (error?.message?.includes('Not authenticated') || 
      error?.status === 401 || 
      error?.code === 'PGRST301') {
    return true
  }
  return false
}

export function useOrdersQuery(filter?: OrderFilter, pagination?: { page: number; limit: number }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // SessionStorage cache for orders list to speed up refreshes
  const LIST_CACHE_TTL_MS = 1000 * 60 * 10
  const listCacheKey = `orders:list:${JSON.stringify({ filter, pagination })}`
  const getCachedList = () => {
    try {
      const raw = sessionStorage.getItem(listCacheKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.data || !parsed?.cachedAt) return null
      if (Date.now() - parsed.cachedAt > LIST_CACHE_TTL_MS) {
        sessionStorage.removeItem(listCacheKey)
        return null
      }
      return parsed.data
    } catch { return null }
  }
  const setCachedList = (data: any) => {
    try { sessionStorage.setItem(listCacheKey, JSON.stringify({ data, cachedAt: Date.now() })) } catch {}
  }

  const query = useQuery({
    queryKey: ['orders', filter, pagination],
    queryFn: async () => {
      try {
        return await orderService.listOrders(filter, pagination)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    enabled: !!user, // Only run when user is authenticated
    staleTime: 1000 * 60 * 15, // 15 minutes (optimized for better caching)
    placeholderData: (previousData: any) => previousData ?? getCachedList(), // hydrate from cache
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (handleAuthError(error)) return false
      // Retry up to 3 times for other errors
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: true, // Refetch when network reconnects
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection (optimized for better cache persistence)
    // OPTIMIZED: Cache search results more aggressively
    ...(filter && Object.keys(filter).length > 0 && {
      staleTime: 1000 * 60 * 5, // 5 minutes for search results (shorter than general list)
      gcTime: 1000 * 60 * 15, // 15 minutes for search results
    })
  })

  // Persist latest data to sessionStorage
  useEffect(() => {
    if (query.data) setCachedList(query.data)
  }, [listCacheKey, query.data])

  return query
}

export function useOrderQuery(id: string) {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  
  // Simple sessionStorage cache for super-fast reloads (persists across refresh)
  const CACHE_TTL_MS = 1000 * 60 * 15 // 15 minutes
  const getCachedOrder = () => {
    try {
      const raw = sessionStorage.getItem(`orders:${id}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || !parsed.data || !parsed.cachedAt) return null
      if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(`orders:${id}`)
        return null
      }
      return parsed.data
    } catch {
      return null
    }
  }
  const setCachedOrder = (data: any) => {
    try {
      sessionStorage.setItem(
        `orders:${id}`,
        JSON.stringify({ data, cachedAt: Date.now() })
      )
    } catch {}
  }
  
  const isEnabled = !!id && !!user && !authLoading
  
  // Debug logging
  useEffect(() => {
    console.log('useOrderQuery: enabled state changed', {
      id,
      hasUser: !!user,
      authLoading,
      isEnabled,
    })
  }, [id, user, authLoading, isEnabled])
  
  const result = useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      console.log('useOrderQuery: queryFn called for id:', id)
      try {
        const order = await orderService.getOrder(id)
        console.log('useOrderQuery: order fetched successfully:', !!order)
        return order
      } catch (error) {
        console.error('useOrderQuery: error fetching order:', error)
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    enabled: isEnabled, // Only run when ID exists, user is authenticated, and auth has finished loading
    staleTime: 1000 * 60 * 15, // 15 minutes (optimized for better caching)
    // Show cached data immediately while fetching new data
    placeholderData: (previousData) => {
      // If we have cached data for this order, show it immediately
      return previousData ?? getCachedOrder()
    },
    // Only set initialData if we actually have cached data (not as a function that might return undefined)
    // This prevents React Query from thinking it has data when it doesn't
    initialData: (() => {
      const cachedFromQuery = queryClient.getQueryData(['orders', id])
      const cachedFromStorage = getCachedOrder()
      const initial = cachedFromQuery ?? cachedFromStorage
      if (initial) {
        console.log('useOrderQuery: Using initialData from cache')
      }
      return initial
    })(),
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection (optimized for better cache persistence)
  })

  // Persist to sessionStorage when data changes (v5: no onSuccess callback)
  useEffect(() => {
    if (result.data) setCachedOrder(result.data)
  }, [id, result.data])

  // Debug: Log query state changes
  useEffect(() => {
    console.log('useOrderQuery: query state', {
      id,
      isEnabled,
      isLoading: result.isLoading,
      isFetching: result.isFetching,
      isFetched: result.isFetched,
      hasData: !!result.data,
      error: result.error?.message,
    })
  }, [id, isEnabled, result.isLoading, result.isFetching, result.isFetched, result.data, result.error])

  // Fallback: If query is enabled but not fetching/loaded after a delay, manually trigger it
  useEffect(() => {
    if (isEnabled && !result.isLoading && !result.isFetching && !result.isFetched && !result.data && !result.error) {
      const timeoutId = setTimeout(() => {
        console.log('useOrderQuery: Fallback - manually triggering fetch for id:', id)
        result.refetch()
      }, 500) // Wait 500ms before manual trigger
      
      return () => clearTimeout(timeoutId)
    }
  }, [id, isEnabled, result.isLoading, result.isFetching, result.isFetched, result.data, result.error, result.refetch])

  return result
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      try {
        return await orderService.createOrder(data)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('orders', data.id, 'create', null, data)
      toast({
        title: 'Success',
        description: 'Order created successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create order',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useUpdateOrderMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        return await orderService.updateOrderInfo(id, data)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('orders', variables.id, 'update', null, data)
      toast({
        title: 'Success',
        description: 'Order updated successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update order',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useOrderCostsMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ orderId, costs }: { orderId: string; costs: any }) => {
      try {
        return await orderService.upsertOrderCosts(orderId, costs)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] })
      auditService.writeAudit('order_costs', variables.orderId, 'upsert', null, data)
      toast({
        title: 'Success',
        description: 'Order costs updated successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update order costs',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useAddItemMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      try {
        return await itemService.addItem(data)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.order_id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('order_items', data.id, 'create', null, data)
      toast({
        title: 'Success',
        description: 'Item added successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add item',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      try {
        return await itemService.updateItem(id, data)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', data.order_id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('order_items', variables.id, 'update', null, data)
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update item',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useRemoveItemMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (itemId: string) => {
      try {
        return await itemService.removeItem(itemId)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('order_items', variables, 'delete', null, null)
      toast({
        title: 'Success',
        description: 'Item removed successfully',
      })
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to remove item',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}

export function useDeleteOrderMutation(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (orderId: string) => {
      try {
        return await orderService.deleteOrder(orderId)
      } catch (error) {
        if (handleAuthError(error)) {
          throw new Error('Authentication required')
        }
        throw error
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      auditService.writeAudit('orders', variables, 'delete', null, null)
      toast({
        title: 'Success',
        description: 'Order deleted successfully',
      })
      onSuccess?.()
    },
    onError: (error: any) => {
      if (error.message === 'Authentication required') {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete order',
          variant: 'destructive',
        })
      }
    },
    retry: (failureCount, error) => {
      if (handleAuthError(error)) return false
      return failureCount < 2
    },
  })
}