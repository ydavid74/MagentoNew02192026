import { useMutation, useQueryClient } from '@tanstack/react-query'
import { itemService } from '@/services/items'
import { useToast } from '@/hooks/use-toast'

// Add order item mutation
export function useAddOrderItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: itemService.addItem,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', data.order_id] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast({
        title: 'Success',
        description: 'Item added successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item',
        variant: 'destructive',
      })
    },
  })
}

// Update order item mutation
export function useUpdateOrderItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data, orderId }: { id: string; data: any; orderId: string }) => 
      itemService.updateItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      })
    },
  })
}

// Remove order item mutation
export function useRemoveOrderItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, orderId }: { id: string; orderId: string }) => 
      itemService.removeItem(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] })
      toast({
        title: 'Success',
        description: 'Item removed successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item',
        variant: 'destructive',
      })
    },
  })
}