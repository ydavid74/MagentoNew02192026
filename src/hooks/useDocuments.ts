import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export function useDocuments() {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const uploadDocument = async (
    file: File, 
    orderId?: string, 
    type: 'invoice' | 'appraisal' | 'label' | '3d' | 'other' = 'other'
  ) => {
    try {
      setUploading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create file path with user ID folder
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          order_id: orderId,
          type,
          file_url: uploadData.path,
          filename: file.name,
          size: file.size,
          content_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      })

      return data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive'
      })
      throw error
    } finally {
      setUploading(false)
    }
  }

  const getSignedUrl = async (fileUrl: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileUrl, 60 * 60) // 1 hour expiry

      if (error) throw error

      return data.signedUrl
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate download URL',
        variant: 'destructive'
      })
      throw error
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      // Get document info first
      const { data: document } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .single()

      if (document?.file_url) {
        // Delete from storage
        await supabase.storage
          .from('documents')
          .remove([document.file_url])
      }

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Document deleted successfully'
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete document',
        variant: 'destructive'
      })
      throw error
    }
  }

  return {
    uploading,
    uploadDocument,
    getSignedUrl,
    deleteDocument
  }
}