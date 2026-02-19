import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { orderVerificationService, OrderVerification } from "@/services/orderVerification";
import { Edit, Trash2, Calendar, User } from "lucide-react";

interface VerificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onEdit: (verification: OrderVerification) => void;
  onRefresh: () => void;
  onVerificationUpdated?: (verification: OrderVerification) => void;
  onVerificationAdded?: (verification: OrderVerification) => void;
}

export interface VerificationHistoryModalRef {
  refresh: () => void;
  updateVerification: (verification: OrderVerification) => void;
  addVerification: (verification: OrderVerification) => void;
}

export const VerificationHistoryModal = forwardRef<VerificationHistoryModalRef, VerificationHistoryModalProps>(({ 
  isOpen, 
  onClose, 
  orderId, 
  onEdit, 
  onRefresh,
  onVerificationUpdated,
  onVerificationAdded
}, ref) => {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<OrderVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Expose refresh method to parent component
  useImperativeHandle(ref, () => ({
    refresh: loadVerificationHistory,
    updateVerification: updateVerificationInList,
    addVerification: addVerificationToList
  }));

  // Load verification history when modal opens
  useEffect(() => {
    if (isOpen) {
      loadVerificationHistory();
    }
  }, [isOpen, orderId]);

  const loadVerificationHistory = async () => {
    setIsLoading(true);
    try {
      const data = await orderVerificationService.getByOrderId(orderId);
      setVerifications(data);
    } catch (error) {
      console.error("Error loading verification history:", error);
      toast({
        title: "Error",
        description: "Failed to load verification history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update verification in local state
  const updateVerificationInList = (updatedVerification: OrderVerification) => {
    setVerifications(prev => 
      prev.map(verification => 
        verification.id === updatedVerification.id ? updatedVerification : verification
      )
    );
  };

  // Add new verification to local state
  const addVerificationToList = (newVerification: OrderVerification) => {
    setVerifications(prev => [newVerification, ...prev]);
  };

  const handleDelete = async (verification: OrderVerification) => {
    if (!confirm("Are you sure you want to delete this verification record?")) {
      return;
    }

    try {
      await orderVerificationService.delete(verification.id);
      toast({
        title: "Success",
        description: "Verification deleted successfully",
      });
      loadVerificationHistory();
      onRefresh();
    } catch (error) {
      console.error("Error deleting verification:", error);
      toast({
        title: "Error",
        description: "Failed to delete verification",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getUserDisplayName = (verification: OrderVerification) => {
    if (verification.profile) {
      return `${verification.profile.first_name} ${verification.profile.last_name}`;
    }
    return "Unknown User";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Verification History</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading verification history...</div>
            </div>
          ) : verifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No verification records found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.map((verification, index) => {
                const isUpdated = verification.updated_at !== verification.created_at;
                const isNew = !isUpdated; // New verification if not updated
                
                return (
                  <div key={verification.id}>
                    <div 
                      className="border rounded-lg p-4 space-y-3"
                      style={{
                        backgroundColor: isNew ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
                        borderColor: isNew ? 'hsl(var(--success) / 0.3)' : 'hsl(var(--destructive) / 0.3)'
                      }}
                    >
                      {/* Header with date and user */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(verification.date_added)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{getUserDisplayName(verification)}</span>
                          </div>
                          {isUpdated && (
                            <div 
                              className="flex items-center space-x-1 font-medium"
                              style={{ color: 'hsl(var(--destructive))' }}
                            >
                              <span>⚠ Updated</span>
                            </div>
                          )}
                          {isNew && (
                            <div 
                              className="flex items-center space-x-1 font-medium"
                              style={{ color: 'hsl(var(--success))' }}
                            >
                              <span>✓ New</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(verification)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(verification)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comment content */}
                      <div className="bg-background rounded-md p-3 border">
                        <p 
                          className="text-sm whitespace-pre-wrap font-medium"
                          style={{
                            color: isNew ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
                          }}
                        >
                          {verification.comment}
                        </p>
                      </div>

                      {/* Latest badge */}
                      {index === 0 && (
                        <div className="flex justify-end">
                          <Badge variant="secondary" className="text-xs">
                            Latest
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Separator between items */}
                    {index < verifications.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
});

VerificationHistoryModal.displayName = "VerificationHistoryModal";
