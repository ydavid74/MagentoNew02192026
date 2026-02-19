import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

interface Order {
  id: string
  customer_id: string
  purchase_from: string
  order_date: string
  total_amount: number
  current_status: string
  created_at: string
  customers: {
    id: string
    name: string
    email: string
  } | null
  order_items: Array<{
    id: string
    sku: string
    price: number
    qty: number
  }>
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchOrders = async (filters?: { status?: string; customer?: string }) => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            email
          ),
          order_items (
            id,
            sku,
            price,
            qty
          )
        `)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('current_status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error

      setOrders(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch orders',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return {
    orders,
    loading,
    fetchOrders,
    refetch: fetchOrders
  }
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchOrder = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (*),
          order_items (*),
          order_status_history (
            *,
            created_by
          ),
          order_customer_notes (
            *,
            created_by
          ),
          order_costs (*),
          documents (*),
          employee_notes (
            *,
            created_by
          ),
          shipping_entries (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setOrder(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch order',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchOrder()
    }
  }, [id])

  return {
    order,
    loading,
    refetch: fetchOrder
  }
}