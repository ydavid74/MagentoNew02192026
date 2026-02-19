import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { documentService } from '@/services/documents'
import { useToast } from '@/hooks/use-toast'

// Documents list hook
export function useDocumentsList(orderId?: string) {
  const TTL = 1000 * 60 * 10
  const key = `documents:list:${orderId ?? 'all'}`
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
    queryKey: ['documents', 'list', orderId],
    queryFn: () => documentService.listDocuments(orderId),
    staleTime: TTL,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev ?? getCached(),
  })
  useEffect(() => { if (q.data) setCached(q.data) }, [key, q.data])
  return q
}

// Upload document mutation
export function useUploadDocument() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ file, metadata, userId }: { 
      file: File; 
      metadata: any;
      userId: string;
    }) => {
      // First upload file to storage
      const filePath = await documentService.uploadToBucket(file, userId)
      
      // Then create document metadata
      const documentMetadata = {
        ...metadata,
        file_url: filePath,
        filename: file.name,
        size: file.size,
        content_type: file.type,
      }
      
      return documentService.createDocumentMetadata(documentMetadata)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      if (variables.metadata.order_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['orders', 'detail', variables.metadata.order_id] 
        })
      }
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      })
    },
  })
}

// Get signed URL mutation
export function useGetSignedUrl() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: documentService.createSignedUrl,
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get document URL',
        variant: 'destructive',
      })
    },
  })
}