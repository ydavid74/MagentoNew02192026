import { supabase } from '@/integrations/supabase/client'
import { z } from 'zod'

export const DocumentCreateSchema = z.object({
  order_id: z.string().uuid().optional(),
  type: z.enum(['invoice', 'appraisal', 'label', '3d', 'other']),
  filename: z.string(),
  size: z.number(),
  content_type: z.string(),
  file_url: z.string(),
})

export interface DocumentService {
  uploadToBucket(file: File, userId: string): Promise<string>
  createDocumentMetadata(input: z.infer<typeof DocumentCreateSchema>): Promise<any>
  listDocuments(orderId?: string): Promise<any[]>
  createSignedUrl(fileUrl: string): Promise<string>
}

export const documentService: DocumentService = {
  async uploadToBucket(file: File, userId: string) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file)
    
    if (error) throw error
    return data.path
  },

  async createDocumentMetadata(input: z.infer<typeof DocumentCreateSchema>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const validatedFields = {
      ...DocumentCreateSchema.parse(input),
      uploaded_by: user.id
    }
    
    const { data, error } = await supabase
      .from('documents')
      .insert(validatedFields)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async listDocuments(orderId?: string) {
    let query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async createSignedUrl(fileUrl: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileUrl, 60 * 60) // 1 hour expiry
    
    if (error) throw error
    return data.signedUrl
  }
}