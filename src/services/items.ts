import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

export const OrderItemSchema = z.object({
  order_id: z.string().uuid(),
  sku: z.string(),
  size: z.string(),
  metal_type: z.string(),
  details: z.string(),
  price: z.number(),
  qty: z.number().default(1),
})

export const OrderItemUpdateSchema = z.object({
  sku: z.string().optional(),
  size: z.string().optional(),
  metal_type: z.string().optional(),
  details: z.string().optional(),
  price: z.number().optional(),
  qty: z.number().optional(),
})

export interface ItemService {
  addItem(input: z.infer<typeof OrderItemSchema>): Promise<any>
  updateItem(id: string, input: z.infer<typeof OrderItemUpdateSchema>): Promise<any>
  removeItem(id: string): Promise<void>
}

export const itemService: ItemService = {
  async addItem(input: z.infer<typeof OrderItemSchema>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const validatedFields = OrderItemSchema.parse(input)
    
    const { data, error } = await supabase
      .from('order_items')
      .insert(validatedFields)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateItem(id: string, input: z.infer<typeof OrderItemUpdateSchema>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const validatedFields = OrderItemUpdateSchema.parse(input)
    
    const { data, error } = await supabase
      .from('order_items')
      .update(validatedFields)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async removeItem(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}