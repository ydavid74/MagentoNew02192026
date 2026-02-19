import { supabase } from '@/integrations/supabase/client'

const BUCKET_NAME = 'documents'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  path: string,
  bucket: string = BUCKET_NAME
): Promise<UploadResult> {
  console.log('uploadFile called with:', { fileName: file.name, path, bucket });
  
  try {
    console.log('Starting Supabase upload...');
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: '', path: '', error: error.message }
    }

    console.log('Upload successful, getting public URL...');
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    console.log('Public URL generated:', urlData.publicUrl);
    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return { url: '', path: '', error: 'Upload failed' }
  }
}

/**
 * Upload a product image to the documents bucket
 */
export async function uploadProductImage(
  file: File,
  orderId: string,
  sku: string
): Promise<UploadResult> {
  console.log('uploadProductImage called with:', { file: file.name, orderId, sku, size: file.size });
  
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()
  const fileName = `${sku}_${timestamp}.${fileExtension}`
  const path = `product-images/${orderId}/${fileName}`
  
  console.log('Generated path:', path);
  
  return uploadFile(file, path, BUCKET_NAME)
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  path: string,
  bucket: string = BUCKET_NAME
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return { error: error.message }
    }

    return {}
  } catch (error) {
    console.error('Delete failed:', error)
    return { error: 'Delete failed' }
  }
}

/**
 * Get a list of files in a folder
 */
export async function listFiles(
  folder: string,
  bucket: string = BUCKET_NAME
): Promise<{ data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) {
      console.error('List error:', error)
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    console.error('List failed:', error)
    return { data: [], error: 'List failed' }
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(
  path: string,
  bucket: string = BUCKET_NAME
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}
