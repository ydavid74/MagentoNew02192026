import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Clock, Edit, Trash2, FileText, X, Play, User, Maximize2, Upload, Star, FileIcon, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/storage";
import { useParams } from "react-router-dom";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { orderEmployeeCommentService, OrderEmployeeComment, CreateOrderEmployeeCommentData } from "@/services/orderEmployeeComments";
import { supabase } from "@/integrations/supabase/client";

interface CommentWithProfile extends OrderEmployeeComment {
  // profiles is now included in OrderEmployeeComment from the service
}

export function EmployeeCommentsTab() {
  const { id: orderId } = useParams();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showAddComment, setShowAddComment] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentWithProfile | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<CommentWithProfile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoPopup, setVideoPopup] = useState<{ url: string; title: string } | null>(null);

  // Form state for add/edit comment
  const [formData, setFormData] = useState({
    content: "",
    is_important: false,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load comments when component mounts or orderId changes
  useEffect(() => {
    if (orderId) {
      loadComments();
    }
  }, [orderId]);

  const loadComments = async (deletedCommentId?: string) => {
    if (!orderId) return;
    
    console.log('🔄 Loading comments for order:', orderId);
    setIsLoading(true);
    try {
      const data = await orderEmployeeCommentService.getCommentsByOrderId(orderId);
      console.log('📋 Loaded comments from database:', data);
      
      // Profile data is now included from the service query
      const commentsWithProfiles = data.map((comment) => ({
        ...comment,
        // profiles data is already included from the service
      }));
      
      console.log('📋 Comments with profiles:', commentsWithProfiles);
      
      // Debug profile data
      commentsWithProfiles.forEach((comment, index) => {
        console.log(`👤 Comment ${index + 1} profile data:`, {
          id: comment.id,
          created_by: comment.created_by,
          profiles: comment.profiles,
          displayName: getUserDisplayName(comment)
        });
      });
      
      // Check if the deleted comment is still in the results
      if (deletedCommentId) {
        const deletedCommentStillExists = commentsWithProfiles.some(c => c.id === deletedCommentId);
        console.log('🔍 Deleted comment still exists in results:', deletedCommentStillExists);
        if (deletedCommentStillExists) {
          console.log('⚠️ WARNING: The deleted comment is still being returned from the database!');
          console.log('🔍 Deleted comment ID:', deletedCommentId);
          console.log('🔍 Current comment IDs:', commentsWithProfiles.map(c => c.id));
        }
      }
      
      setComments([...commentsWithProfiles]); // Create new array reference to force re-render
      console.log('✅ Comments state updated with new array reference');
    } catch (error) {
      console.error('❌ Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 100 * 1024 * 1024) { // 100MB limit
      toast({
        title: "File too large",
        description: "File size must be less than 100MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleAddComment = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the comment",
        variant: "destructive",
      });
      return;
    }

    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID not found",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file if any
      let fileData = null;
      if (selectedFile) {
        fileData = await orderEmployeeCommentService.uploadFile(orderId, selectedFile);
      }

      const commentData: CreateOrderEmployeeCommentData = {
        order_id: orderId,
        content: formData.content.trim(),
        is_important: formData.is_important,
        file_url: fileData?.fileUrl,
        filename: fileData?.filename,
        file_size: fileData?.fileSize,
        content_type: fileData?.contentType,
      };

      await orderEmployeeCommentService.createComment(commentData);
      
      setShowAddComment(false);
      resetForm();
      loadComments(); // Reload comments to get the new one with profile data

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditComment = async () => {
    if (!editingComment || !formData.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in the comment",
        variant: "destructive",
      });
      return;
    }

    console.log('🔄 Starting edit comment:', editingComment.id, formData.content);
    setIsUploading(true);

    try {
      // Upload new video if any
      let videoUrl = editingComment.video_url;
      
      for (const file of [selectedFile].filter(Boolean)) {
        if (file.type.startsWith('video/')) {
          if (file.size > 50 * 1024 * 1024) {
            toast({
              title: "Video too large",
              description: `${file.name} is larger than 50MB`,
              variant: "destructive",
            });
            continue;
          }

          // Delete old video if exists
          if (editingComment.video_url) {
            console.log('🗑️ Deleting old video:', editingComment.video_url);
            await orderEmployeeCommentService.deleteVideo(editingComment.video_url);
          }

          console.log('📹 Uploading new video for order:', editingComment.order_id);
          const videoBlob = new Blob([file], { type: file.type });
          videoUrl = await orderEmployeeCommentService.uploadVideo(editingComment.order_id, videoBlob);
          console.log('✅ Video uploaded:', videoUrl);
        }
      }

      const updates: Partial<CreateOrderEmployeeCommentData> = {
        content: formData.content.trim(),
        is_important: formData.is_important,
        video_url: videoUrl
      };

      console.log('💾 Updating comment with data:', updates);
      const updatedComment = await orderEmployeeCommentService.updateComment(editingComment.id, updates);
      console.log('✅ Comment updated successfully:', updatedComment);
      
      setEditingComment(null);
      resetForm();
      loadComments(); // Reload comments

      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error) {
      console.error('❌ Error updating comment:', error);
      toast({
        title: "Error",
        description: `Failed to update comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    console.log('🗑️ Starting delete comment:', commentToDelete.id);
    
    try {
      // Delete video if exists
      if (commentToDelete.video_url) {
        console.log('🗑️ Deleting video:', commentToDelete.video_url);
        await orderEmployeeCommentService.deleteVideo(commentToDelete.video_url);
        console.log('✅ Video deleted successfully');
      }

      // Delete comment from database
      console.log('🗑️ Deleting comment from database:', commentToDelete.id);
      await orderEmployeeCommentService.deleteComment(commentToDelete.id);
      console.log('✅ Comment deleted from database successfully');
      
      // Store the deleted comment ID before clearing state
      const deletedCommentId = commentToDelete.id;
      setCommentToDelete(null);
      
      // Small delay to ensure database has processed the deletion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔄 Reloading comments after deletion...');
      loadComments(deletedCommentId); // Reload comments with deleted ID for checking
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      toast({
        title: "Error",
        description: `Failed to delete comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const startEdit = (comment: CommentWithProfile) => {
    console.log('✏️ Starting edit for comment:', comment.id, comment.content);
    setEditingComment(comment);
    setFormData({
      content: comment.content,
      is_important: comment.is_important || false,
    });
    setSelectedFile(null);
  };

  const resetForm = () => {
    setFormData({
      content: "",
      is_important: false,
    });
    setSelectedFile(null);
  };

  const getUserDisplayName = (comment: CommentWithProfile) => {
    if (comment.profiles) {
      if (comment.profiles.first_name && comment.profiles.last_name) {
        return `${comment.profiles.first_name} ${comment.profiles.last_name}`;
      } else if (comment.profiles.first_name) {
        return comment.profiles.first_name;
      }
    }
    
    // Fallback using user ID - create a readable name from the UUID
    if (comment.created_by) {
      // Take first 8 characters of the UUID and format it nicely
      const shortId = comment.created_by.substring(0, 8);
      return `User ${shortId.toUpperCase()}`;
    }
    
    // Final fallback
    return "Employee";
  };

  const openVideoPopup = (videoUrl: string, commentContent: string) => {
    setVideoPopup({
      url: videoUrl,
      title: `Video - ${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Employee Comments</h2>
          <p className="text-sm text-muted-foreground">Internal notes and communication</p>
        </div>
        <Button onClick={() => setShowAddComment(true)} size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Comment
        </Button>
      </div>

      {/* Comments List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-sm">Loading comments...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-3 bg-card">
                  {/* Header with user info and actions */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{getUserDisplayName(comment)}</span>
                      {comment.is_important && (
                        <Badge variant="destructive" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Important
                        </Badge>
                      )}
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(comment)}
                        className="h-7 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCommentToDelete(comment)}
                        className="h-7 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Comment Content and Attachments */}
                  <div className="space-y-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                    </div>
                    
                    {/* File Attachment */}
                    {comment.file_url && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{comment.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {comment.file_size && `${(comment.file_size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(comment.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Thumbnail */}
                  <div className="flex gap-3">
                    
                    {/* Video Thumbnail */}
                    {comment.video_url && (
                      <div className="flex-shrink-0">
                        <div 
                          className="relative w-24 h-16 bg-muted rounded-md border cursor-pointer hover:bg-muted/80 transition-colors group"
                          onClick={() => openVideoPopup(comment.video_url!, comment.content)}
                        >
                          <video
                            className="w-full h-full object-cover rounded-md"
                            preload="metadata"
                            muted
                          >
                            <source src={comment.video_url} type="video/webm" />
                            <source src={comment.video_url} type="video/mp4" />
                          </video>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-colors">
                            <div className="bg-white/90 rounded-full p-1.5 group-hover:bg-white transition-colors">
                              <Play className="h-3 w-3 text-black ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute top-1 right-1 bg-black/50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="h-2.5 w-2.5 text-white" />
                          </div>
              </div>
            </div>
                    )}
            </div>
          </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs">Add your first comment using the button above</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Comment Dialog */}
      <Dialog open={showAddComment || !!editingComment} onOpenChange={(open) => {
        if (!open) {
          setShowAddComment(false);
          setEditingComment(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {editingComment ? 'Edit Comment' : 'Add New Comment'}
            </DialogTitle>
            <DialogDescription>
              {editingComment ? 'Update the comment content and file attachment.' : 'Add a new comment with optional file attachment.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Comment Content */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Comment *</Label>
              <Textarea 
                placeholder="Enter your comment or note..." 
                rows={4}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="resize-none"
              />
            </div>

            {/* Important Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="important"
                checked={formData.is_important}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_important: !!checked }))}
              />
              <Label htmlFor="important" className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Mark as important
              </Label>
            </div>
            
            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Attach File (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      Any file format up to 100MB
                    </p>
                  </div>
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept="*/*"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              </div>
              
              {selectedFile && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddComment(false);
                setEditingComment(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingComment ? handleEditComment : handleAddComment}
              disabled={isUploading || !formData.content.trim()}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {editingComment ? 'Update Comment' : 'Add Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!commentToDelete}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleDeleteComment}
      />

      {/* Video Popup Modal */}
      <Dialog open={!!videoPopup} onOpenChange={(open) => !open && setVideoPopup(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{videoPopup?.title}</DialogTitle>
            <DialogDescription>
              Click the video controls to play, pause, or adjust volume.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <video
              controls
              className="w-full h-auto max-h-[70vh] rounded-lg"
              autoPlay
            >
              <source src={videoPopup?.url} type="video/webm" />
              <source src={videoPopup?.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
                    </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

