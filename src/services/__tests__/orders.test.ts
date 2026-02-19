import { describe, it, expect, vi, beforeEach } from 'vitest'
import { orderService } from '../orders'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockOrder, error: null }))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockOrder, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockOrder, error: null }))
        }))
      }))
    })),
    upsert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: mockOrderCosts, error: null }))
      }))
    }))
  })),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'user-123' } }
    }))
  }
}

const mockOrder = {
  id: 'order-123',
  customer_id: 'customer-123',
  current_status: 'pending',
  total_amount: 1500
}

const mockOrderCosts = {
  order_id: 'order-123',
  casting: 100,
  diamond: 800,
  labor: 200
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrder', () => {
    it('should fetch order by id', async () => {
      const result = await orderService.getOrder('order-123')
      expect(result).toEqual(mockOrder)
      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
    })
  })

  describe('createOrder', () => {
    it('should create new order', async () => {
      const orderData = {
        customer_id: 'customer-123',
        order_date: '2024-01-15',
        current_status: 'pending',
        total_amount: 1500
      }

      const result = await orderService.createOrder(orderData)
      expect(result).toEqual(mockOrder)
      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
    })
  })

  describe('upsertOrderCosts', () => {
    it('should upsert order costs', async () => {
      const costs = { casting: 100, diamond: 800, labor: 200 }
      
      const result = await orderService.upsertOrderCosts('order-123', costs)
      expect(result).toEqual(mockOrderCosts)
      expect(mockSupabase.from).toHaveBeenCalledWith('order_costs')
    })
  })
})