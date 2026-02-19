import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { orderService } from '@/services/orders'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'

export function useOrderDetailQuery(id: string) {
  const CACHE_TTL_MS = 1000 * 60 * 15
  const getCached = () => {
    try {
      const raw = sessionStorage.getItem(`orders:${id}`)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.data || !parsed?.cachedAt) return null
      if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
        sessionStorage.removeItem(`orders:${id}`)
        return null
      }
      return parsed.data
    } catch { return null }
  }
  const setCached = (data: any) => {
    try { sessionStorage.setItem(`orders:${id}`, JSON.stringify({ data, cachedAt: Date.now() })) } catch {}
  }

  const q = useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
    initialData: () => getCached(),
  })

  useEffect(() => { if (q.data) setCached(q.data) }, [id, q.data])
  return q
}

export function useOrderCommentsQuery(orderId: string) {
  const TTL = 1000 * 60 * 10
  const key = `order:comments:${orderId}`
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
    queryKey: ['order-comments', orderId],
    queryFn: () => orderService.listOrderComments(orderId),
    enabled: !!orderId,
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

export function useOrderStatusHistoryQuery(orderId: string) {
  const TTL = 1000 * 60 * 10
  const key = `order:statusHistory:${orderId}`
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
    queryKey: ['order-status-history', orderId],
    queryFn: () => orderService.listStatusHistory(orderId),
    enabled: !!orderId,
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

export function useOrderDocumentsQuery(orderId: string) {
  const TTL = 1000 * 60 * 10
  const key = `order:documents:${orderId}`
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
    queryKey: ['order-documents', orderId],
    queryFn: () => documentService.listDocuments(orderId),
    enabled: !!orderId,
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ orderId, content, isImportant }: { 
      orderId: string; 
      content: string; 
      isImportant?: boolean;
    }) => orderService.createComment(orderId, content, isImportant),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-comments', variables.orderId] })
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    },
  })
}

export function useAppendStatusMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ orderId, status, comment }: { 
      orderId: string; 
      status: string; 
      comment?: string;
    }) => orderService.appendStatus(orderId, status, comment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-status-history', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] })
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    },
  })
}