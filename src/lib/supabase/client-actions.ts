// Client-side actions for Vite React app (NOT Next.js server actions)
import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

// Validation schemas
export const OrderSchema = z.object({
  customer_id: z.string().uuid(),
  purchase_from: z.string().optional(),
  order_date: z.string(),
  total_amount: z.number().default(0),
  current_status: z.string(),
})

export const OrderItemSchema = z.object({
  order_id: z.string().uuid(),
  sku: z.string(),
  size: z.string(),
  metal_type: z.string(),
  details: z.string(),
  price: z.number(),
  qty: z.number().default(1),
})

export const OrderCommentSchema = z.object({
  order_id: z.string().uuid(),
  content: z.string(),
  is_important: z.boolean().default(false),
})

// Client-side functions (equivalent to server actions)
export async function createOrder(input: z.infer<typeof OrderSchema>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validatedFields = OrderSchema.parse(input)
  
  const { data, error } = await supabase
    .from('orders')
    .insert(validatedFields)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'orders', data.id, 'create', null, data)
  return data
}

export async function updateOrder(id: string, input: Partial<z.infer<typeof OrderSchema>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current order for audit
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()
  
  const { data, error } = await supabase
    .from('orders')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'orders', id, 'update', currentOrder, data)
  return data
}

export async function addOrderItem(input: z.infer<typeof OrderItemSchema>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validatedFields = OrderItemSchema.parse(input)
  
  const { data, error } = await supabase
    .from('order_items')
    .insert(validatedFields)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'order_items', data.id, 'create', null, data)
  return data
}

export async function addOrderComment(input: z.infer<typeof OrderCommentSchema>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validatedFields = {
    ...OrderCommentSchema.parse(input),
    created_by: user.id,
  }
  
  const { data, error } = await supabase
    .from('order_customer_notes')
    .insert(validatedFields)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'order_customer_notes', data.id, 'create', null, data)
  return data
}

export async function updateOrderCosts(orderId: string, costs: { casting?: number; diamond?: number; labor?: number }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current costs for audit
  const { data: currentCosts } = await supabase
    .from('order_costs')
    .select('*')
    .eq('order_id', orderId)
    .single()
  
  const { data, error } = await supabase
    .from('order_costs')
    .upsert({ order_id: orderId, ...costs })
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  const action = currentCosts ? 'update' : 'create'
  await logAudit(user.id, 'order_costs', orderId, action, currentCosts, data)
  return data
}

// Diamond management (admin only)
export async function createDiamondParcel(input: {
  parcel_code: string;
  name: string;
  shape: string;
  color: string;
  clarity: string;
  carat_total: number;
  min_level: number;
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (profile?.role !== 'admin') throw new Error('Admin access required')

  const { data, error } = await supabase
    .from('diamond_parcels')
    .insert(input)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'diamond_parcels', data.id, 'create', null, data)
  return data
}

export async function addDiamondMovement(input: {
  parcel_id: string;
  subparcel_id?: string;
  direction: 'add' | 'reduce';
  amount: number;
  reason: string;
  related_order?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (profile?.role !== 'admin') throw new Error('Admin access required')

  const { data, error } = await supabase
    .from('diamond_movements')
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'diamond_movements', data.id, 'create', null, data)
  return data
}

// User management (admin only)
export async function updateUserRole(userId: string, role: 'admin' | 'employee') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (profile?.role !== 'admin') throw new Error('Admin access required')

  // Get current profile for audit
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('user_id', userId)
    .select()
    .single()
  
  if (error) throw error

  // Log audit
  await logAudit(user.id, 'profiles', userId, 'update', currentProfile, data)
  return data
}

// File signed URL (client-side equivalent)
export async function getSignedDocumentUrl(docId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get document info
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('file_url, filename')
    .eq('id', docId)
    .single()
  
  if (docError || !document) throw new Error('Document not found')

  // Generate signed URL
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_url, 60 * 60) // 1 hour expiry
  
  if (error) throw error

  return {
    signedUrl: data.signedUrl,
    filename: document.filename
  }
}

// Audit logging helper
async function logAudit(
  userId: string,
  entity: string,
  entityId: string,
  action: string,
  before: any,
  after: any
) {
  try {
    await supabase
      .from('audit_log')
      .insert({
        user_id: userId,
        entity,
        entity_id: entityId,
        action,
        before,
        after,
      })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}