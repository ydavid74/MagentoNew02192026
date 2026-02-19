import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { orderVerificationService, OrderVerification, CreateOrderVerificationData, UpdateOrderVerificationData } from "@/services/orderVerification";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  verification?: OrderVerification | null;
  onSuccess: (verification?: OrderVerification) => void;
}

export function VerificationModal({ 
  isOpen, 
  onClose, 
  orderId, 
  verification, 
  onSuccess 
}: VerificationModalProps) {
  const { toast } = useToast();
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!verification;

  // Initialize form data when modal opens or verification changes
  useEffect(() => {
    if (isOpen) {
      if (verification) {
        setComment(verification.comment);
      } else {
        setComment("");
      }
    }
  }, [isOpen, verification]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a verification comment",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let result: OrderVerification;
      
      if (isEditing && verification) {
        // Update existing verification
        result = await orderVerificationService.update(verification.id, {
          comment: comment.trim(),
        });
        
        toast({
          title: "Success",
          description: "Verification updated successfully",
        });
      } else {
        // Create new verification
        result = await orderVerificationService.create({
          order_id: orderId,
          comment: comment.trim(),
        });
        
        toast({
          title: "Success",
          description: "Verification added successfully",
        });
      }

      onSuccess(result);
      onClose();
    } catch (error) {
      console.error("Error saving verification:", error);
      toast({
        title: "Error",
        description: "Failed to save verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setComment("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Verification" : "Add Verification"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">Verification Comment</Label>
            <Textarea
              id="comment"
              placeholder="Enter verification details, notes, or comments..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !comment.trim()}
          >
            {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
