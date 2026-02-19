import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService, type OrderFilter } from '@/services/orders'
import { useToast } from '@/hooks/use-toast'

// Orders list hook
export function useOrdersList(filter?: OrderFilter) {
  return useQuery({
    queryKey: ['orders', 'list', filter],
    queryFn: () => orderService.listOrders(filter),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Single order hook
export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Order status history hook
export function useOrderStatusHistory(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId, 'status-history'],
    queryFn: () => orderService.listStatusHistory(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Order comments hook
export function useOrderComments(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId, 'comments'],
    queryFn: () => orderService.listOrderComments(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

// Create order mutation
export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast({
        title: 'Success',
        description: 'Order created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create order',
        variant: 'destructive',
      })
    },
  })
}

// Update order mutation
export function useUpdateOrder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      orderService.updateOrderInfo(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast({
        title: 'Success',
        description: 'Order updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      })
    },
  })
}

// Update order costs mutation
export function useUpdateOrderCosts() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ orderId, costs }: { orderId: string; costs: any }) => 
      orderService.upsertOrderCosts(orderId, costs),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] })
      toast({
        title: 'Success',
        description: 'Order costs updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order costs',
        variant: 'destructive',
      })
    },
  })
}

// Append status mutation
export function useAppendOrderStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ orderId, status, comment }: { orderId: string; status: string; comment?: string }) => 
      orderService.appendStatus(orderId, status, comment),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId, 'status-history'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] })
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      })
    },
  })
}

// Create comment mutation
export function useCreateOrderComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ orderId, content, isImportant }: { orderId: string; content: string; isImportant?: boolean }) => 
      orderService.createComment(orderId, content, isImportant),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId, 'comments'] })
      toast({
        title: 'Success',
        description: 'Comment added successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      })
    },
  })
}

// Delete comment mutation
export function useDeleteOrderComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ commentId, orderId }: { commentId: string; orderId: string }) => 
      orderService.deleteComment(commentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId, 'comments'] })
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      })
    },
  })
}