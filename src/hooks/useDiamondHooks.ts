import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { diamondService } from '@/services/diamonds'
import { useToast } from '@/hooks/use-toast'

// Diamond parcels hook
export function useDiamondParcels(filter?: any) {
  const TTL = 1000 * 60 * 15
  const key = `diamonds:parcels:${JSON.stringify(filter ?? {})}`
  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.data || !parsed?.cachedAt) return null
      if (Date.now() - parsed.cachedAt > TTL) { sessionStorage.removeItem(key); return null }
      return parsed.data
    } catch { return null }
  }
  const setCached = (data: any) => { try { sessionStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() })) } catch {} }

  const q = useQuery({
    queryKey: ['diamonds', 'parcels', filter],
    queryFn: () => (diamondService as any).listParcels(filter),
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

// Diamond movements hook
export function useDiamondMovements(parcelId?: string) {
  const TTL = 1000 * 60 * 10
  const key = `diamonds:movements:${parcelId ?? 'none'}`
  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.data || !parsed?.cachedAt) return null
      if (Date.now() - parsed.cachedAt > TTL) { sessionStorage.removeItem(key); return null }
      return parsed.data
    } catch { return null }
  }
  const setCached = (data: any) => { try { sessionStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() })) } catch {} }

  const q = useQuery({
    queryKey: ['diamonds', 'movements', parcelId],
    queryFn: () => (diamondService as any).listMovements(parcelId),
    enabled: !!parcelId,
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

// Diamond balances hook
export function useDiamondBalances() {
  const TTL = 1000 * 60 * 15
  const key = `diamonds:balances`
  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.data || !parsed?.cachedAt) return null
      if (Date.now() - parsed.cachedAt > TTL) { sessionStorage.removeItem(key); return null }
      return parsed.data
    } catch { return null }
  }
  const setCached = (data: any) => { try { sessionStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() })) } catch {} }

  const q = useQuery({
    queryKey: ['diamonds', 'balances'],
    queryFn: () => (diamondService as any).computeBalances(),
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

// Add diamond movement mutation
export function useAddDiamondMovement() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (diamondService as any).addMovement,
    onSuccess: (data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['diamonds', 'movements', variables?.parcel_id] })
      queryClient.invalidateQueries({ queryKey: ['diamonds', 'balances'] })
      toast({
        title: 'Success',
        description: 'Diamond movement added successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add diamond movement',
        variant: 'destructive',
      })
    },
  })
}

// Create diamond subparcel mutation
export function useCreateDiamondSubparcel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (diamondService as any).createSubparcel,
    onSuccess: (data, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['diamonds', 'parcels'] })
      queryClient.invalidateQueries({ queryKey: ['diamonds', 'movements', variables?.parcel_id] })
      toast({
        title: 'Success',
        description: 'Diamond subparcel created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create diamond subparcel',
        variant: 'destructive',
      })
    },
  })
}