import { supabase } from '@/integrations/supabase/client';

export interface OrderEmployeeComment {
  id: string;
  order_id: string;
  content: string;
  video_url?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
  is_important?: boolean;
  created_by?: string;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface CreateOrderEmployeeCommentData {
  order_id: string;
  content: string;
  video_url?: string;
  file_url?: string;
  filename?: string;
  file_size?: number;
  content_type?: string;
  is_important?: boolean;
  created_by?: string;
}

export const orderEmployeeCommentService = {
  // Get all comments for an order
  async getCommentsByOrderId(orderId: string): Promise<OrderEmployeeComment[]> {
    console.log('🔍 orderEmployeeCommentService.getCommentsByOrderId called with orderId:', orderId);
    
    try {
      // First, fetch the comments
      const { data: comments, error: commentsError } = await (supabase as any)
        .from('order_employee_comments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('❌ Error fetching order employee comments:', commentsError);
        throw commentsError;
      }

      console.log('📋 Raw comments from database:', comments);

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get unique user IDs from comments
      const userIds = [...new Set(comments.map(c => c.created_by).filter(Boolean))] as string[];
      console.log('👥 Unique user IDs:', userIds);

      // Fetch profile data for all unique user IDs
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
          // Continue with empty profiles map if there's an error
        } else {
          console.log('👥 Profiles fetched from database:', profiles);
          profilesMap = profiles.reduce((acc: Record<string, any>, profile: any) => {
            acc[profile.user_id] = {
              first_name: profile.first_name,
              last_name: profile.last_name
            };
            return acc;
          }, {} as Record<string, any>);
        }
      }

      console.log('👥 Profiles map created:', profilesMap);

      // Combine comments with profile data
      const result = comments.map(comment => ({
        ...comment,
        profiles: comment.created_by ? profilesMap[comment.created_by] || null : null
      })) as OrderEmployeeComment[];

      console.log('📋 Processed comments with profiles:', result);
      return result;

    } catch (error) {
      console.error('❌ Error in getCommentsByOrderId:', error);
      throw error;
    }
  },

  // Create a new comment
  async createComment(commentData: CreateOrderEmployeeCommentData): Promise<OrderEmployeeComment> {
    try {
      console.log('Creating comment with data:', commentData);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const commentWithUser = {
        ...commentData,
        created_by: user.id
      };
      
      const { data, error } = await (supabase as any)
        .from('order_employee_comments')
        .insert([commentWithUser])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Comment created successfully:', data);
      return data as OrderEmployeeComment;
    } catch (error) {
      console.error('Error in createComment function:', error);
      throw error;
    }
  },

  // Update a comment
  async updateComment(id: string, updates: Partial<CreateOrderEmployeeCommentData>): Promise<OrderEmployeeComment> {
    console.log('🔄 orderEmployeeCommentService.updateComment called with:', { id, updates });
    
    const { data, error } = await (supabase as any)
      .from('order_employee_comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating order employee comment:', error);
      throw error;
    }

    console.log('✅ Comment updated successfully:', data);
    return data as OrderEmployeeComment;
  },

  // Delete a comment
  async deleteComment(id: string): Promise<void> {
    console.log('🗑️ orderEmployeeCommentService.deleteComment called with id:', id);
    
    // First, let's check if the comment exists and get its details
    const { data: commentData, error: fetchError } = await (supabase as any)
      .from('order_employee_comments')
      .select('id, created_by')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('❌ Error fetching comment for deletion:', fetchError);
      throw new Error(`Comment not found: ${fetchError.message}`);
    }
    
    console.log('🔍 Comment found for deletion:', commentData);
    
    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user ID:', user.id);
    console.log('👤 Comment created_by:', commentData.created_by);
    console.log('🔐 User can delete comment:', user.id === commentData.created_by);
    
    if (user.id !== commentData.created_by) {
      throw new Error('You can only delete your own comments');
    }
    
    // Try to delete the comment
    const { data, error } = await (supabase as any)
      .from('order_employee_comments')
      .delete()
      .eq('id', id)
      .select(); // Add select to get the deleted data

    if (error) {
      console.error('❌ Error deleting order employee comment:', error);
      
      // If RLS is blocking the deletion, try a different approach
      if (error.code === '42501' || error.message.includes('permission denied')) {
        console.log('🔄 RLS blocked deletion, trying alternative approach...');
        
        // Try to delete using the service role (if available) or handle gracefully
        throw new Error(`Permission denied: ${error.message}. You may not have permission to delete this comment.`);
      }
      
      throw error;
    }

    // Check if any rows were actually deleted
    if (!data || data.length === 0) {
      console.warn('⚠️ No rows were deleted - comment may not exist or RLS blocked deletion');
      throw new Error('No rows were deleted. The comment may not exist or you may not have permission to delete it.');
    }

    console.log('✅ Comment deleted successfully, deleted data:', data);
  },

  // Upload video to Supabase Storage
  async uploadVideo(orderId: string, videoBlob: Blob): Promise<string> {
    try {
      console.log('Starting video upload for order:', orderId);
      console.log('Video blob size:', videoBlob.size, 'bytes');
      
      const fileName = `order-${orderId}-${Date.now()}.webm`;
      const filePath = `order-videos/${fileName}`;
      
      console.log('Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from('order-videos')
        .upload(filePath, videoBlob, {
          contentType: 'video/webm',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('Video uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('order-videos')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadVideo function:', error);
      throw error;
    }
  },

  // Delete video from Supabase Storage
  async deleteVideo(videoUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = videoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `order-videos/${fileName}`;

    const { error } = await supabase.storage
      .from('order-videos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  },

  // Upload any file type to Supabase Storage
  async uploadFile(orderId: string, file: File): Promise<{ fileUrl: string; filename: string; fileSize: number; contentType: string }> {
    try {
      console.log('Starting file upload for order:', orderId);
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Generate unique filename
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `order-${orderId}-${Date.now()}.${fileExtension}`;
      const filePath = `order-files/${fileName}`;
      
      console.log('Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from('order-files')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('order-files')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      
      return {
        fileUrl: urlData.publicUrl,
        filename: file.name,
        fileSize: file.size,
        contentType: file.type
      };
    } catch (error) {
      console.error('Error in uploadFile function:', error);
      throw error;
    }
  },

  // Delete file from Supabase Storage
  async deleteFile(fileUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `order-files/${fileName}`;

    const { error } = await supabase.storage
      .from('order-files')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};
