import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Video, Play, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VideoRecorder } from "@/components/ui/VideoRecorder";
import { orderEmployeeCommentService, OrderEmployeeComment } from "@/services/orderEmployeeComments";
import { useAuth } from "@/contexts/AuthContext";

interface OrderEmployeeCommentsTabProps {
  orderId: string;
}

export function OrderEmployeeCommentsTab({ orderId }: OrderEmployeeCommentsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<OrderEmployeeComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoRecorderOpen, setIsVideoRecorderOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<OrderEmployeeComment | null>(null);

  // Load comments on component mount
  useEffect(() => {
    loadComments();
  }, [orderId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await orderEmployeeCommentService.getCommentsByOrderId(orderId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveComment = async (content: string, videoBlob: Blob) => {
    try {
      // Upload video to Supabase Storage
      const videoUrl = await orderEmployeeCommentService.uploadVideo(orderId, videoBlob);
      
      // Create comment in database
      const newComment = await orderEmployeeCommentService.createComment({
        order_id: orderId,
        content,
        video_url: videoUrl,
      });

      // Add to local state
      setComments(prev => [newComment, ...prev]);
      
      // Close video recorder
      setIsVideoRecorderOpen(false);
      
      toast({
        title: "Success",
        description: "Comment and video saved successfully!",
      });
    } catch (error) {
      console.error('Error saving comment:', error);
      toast({
        title: "Error",
        description: "Failed to save comment and video",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string, videoUrl?: string) => {
    try {
      // Delete from database
      await orderEmployeeCommentService.deleteComment(commentId);
      
      // Delete video from storage if exists
      if (videoUrl) {
        await orderEmployeeCommentService.deleteVideo(videoUrl);
      }
      
      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Record Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Employee Comments</h3>
          <p className="text-sm text-muted-foreground">
            Record video comments and notes for this order
          </p>
        </div>
        
        <Dialog open={isVideoRecorderOpen} onOpenChange={setIsVideoRecorderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Video className="h-4 w-4 mr-2" />
              Record Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Record Employee Comment</DialogTitle>
            </DialogHeader>
            <VideoRecorder
              orderId={orderId}
              onSave={handleSaveComment}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No comments yet</h4>
            <p className="text-muted-foreground text-center mb-4">
              Start by recording a video comment to document important details about this order.
            </p>
            <Button onClick={() => setIsVideoRecorderOpen(true)}>
              <Video className="h-4 w-4 mr-2" />
              Record First Comment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Employee Comment</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(comment.created_at)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingComment(comment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id, comment.video_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Comment Content */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Comment:</p>
                  <p className="text-sm">{comment.content}</p>
                </div>

                {/* Video Player */}
                {comment.video_url && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Video Recording:</p>
                    <div className="relative">
                      <video
                        src={comment.video_url}
                        controls
                        className="w-full max-w-md rounded-lg border"
                        preload="metadata"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Comment Dialog */}
      {editingComment && (
        <Dialog open={!!editingComment} onOpenChange={() => setEditingComment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Comment:</label>
                <textarea
                  value={editingComment.content}
                  onChange={(e) => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="w-full mt-2 p-3 border rounded-md"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingComment(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await orderEmployeeCommentService.updateComment(editingComment.id, {
                        content: editingComment.content,
                      });
                      
                      // Update local state
                      setComments(prev => prev.map(c => 
                        c.id === editingComment.id 
                          ? { ...c, content: editingComment.content }
                          : c
                      ));
                      
                      setEditingComment(null);
                      toast({
                        title: "Success",
                        description: "Comment updated successfully",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to update comment",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
