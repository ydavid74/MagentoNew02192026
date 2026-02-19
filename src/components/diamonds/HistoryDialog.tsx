import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Diamond, History } from "lucide-react";
import { DiamondInventory, DiamondHistory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";
import { diamondService } from "@/services/diamonds";

interface HistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  diamond: DiamondInventory | null;
}

// Function to determine carat group based on carat weight
const getCaratGroup = (ctWeight: number): string => {
  if (ctWeight >= 0.5 && ctWeight < 1.0) return "0.5-1.0";
  if (ctWeight >= 1.0 && ctWeight < 1.5) return "1.0-1.5";
  if (ctWeight >= 1.5 && ctWeight < 2.0) return "1.5-2.0";
  if (ctWeight >= 2.0 && ctWeight < 3.0) return "2.0-3.0";
  if (ctWeight >= 3.0) return "3.0+";
  return "0.5-1.0"; // Default fallback
};

// Function to display comments - now simplified since we only save user comments
const displayComment = (comment: string): string | null => {
  if (!comment || !comment.trim()) return null;
  return comment.trim();
};

export function HistoryDialog({
  isOpen,
  onOpenChange,
  diamond
}: HistoryDialogProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<DiamondHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComment, setSelectedComment] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && diamond) {
      loadHistory();
    }
  }, [isOpen, diamond]);

  const loadHistory = async () => {
    if (!diamond) return;
    
    console.log('🔍 HistoryDialog: Loading history for diamond:', diamond);
    console.log('🔍 HistoryDialog: Using parcel_id:', diamond.parcel_id);
    
    setLoading(true);
    try {
      const historyData = await diamondService.getDiamondHistory(diamond.parcel_id);
      console.log('📊 HistoryDialog: Retrieved history data:', historyData);
      
      // Filter history to only show the three required types: deduction, addition, edit
      const filteredHistory = historyData.filter(entry => {
        const type = entry.type?.toLowerCase();
        return type === 'deduction' || type === 'addition' || type === 'edit' ||
               type === 'add' || type === 'reduce' || type === 'purchase' || type === 'sale' ||
               type === 'manual edition';
      }).map(entry => {
        // Normalize the type names
        let normalizedType = entry.type?.toLowerCase();
        if (normalizedType === 'add' || normalizedType === 'purchase') {
          normalizedType = 'addition';
        } else if (normalizedType === 'reduce' || normalizedType === 'sale') {
          normalizedType = 'deduction';
        } else if (normalizedType === 'edit' || normalizedType === 'manual edition') {
          normalizedType = 'edit';
        }
        
        return {
          ...entry,
          type: normalizedType
        };
      });
      
      console.log('📊 HistoryDialog: Filtered history data:', filteredHistory);
      setHistory(filteredHistory);
    } catch (error) {
      console.error("Error loading history:", error);
      toast({
        title: "Error",
        description: "Failed to load diamond history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!diamond) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-8xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Diamond History: {diamond.parcel_id} - {diamond.parcel_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Transaction History Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Transaction History</h3>
          </div>


          {/* History Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-2">No history found</p>
                  <p className="text-sm text-muted-foreground">This diamond has no transaction history yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Employee</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Total Weight</th>
                        <th className="text-left p-3 font-medium">Stones</th>
                        <th className="text-left p-3 font-medium">Carat Group</th>
                        <th className="text-left p-3 font-medium">CT Weight</th>
                        <th className="text-left p-3 font-medium">CT Price</th>
                        <th className="text-left p-3 font-medium">Order ID</th>
                        <th className="text-left p-3 font-medium">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{formatDate(entry.date)}</td>
                          <td className="p-3 text-sm">{entry.employee || '-'}</td>
                           <td className="p-3">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               entry.type === 'addition' ? 'bg-green-100 text-green-800' :
                               entry.type === 'deduction' ? 'bg-red-100 text-red-800' :
                               entry.type === 'edit' ? 'bg-blue-100 text-blue-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {entry.type?.charAt(0).toUpperCase() + entry.type?.slice(1)}
                             </span>
                           </td>
                          <td className="p-3 text-sm">{entry.total_weight || 0} ct</td>
                          <td className="p-3 text-sm">{entry.stones || 0}</td>
                          <td className="p-3 text-sm">{getCaratGroup(entry.ct_weight || 0)}</td>
                          <td className="p-3 text-sm">{entry.ct_weight || 0} ct</td>
                          <td className="p-3 text-sm">
                            {(() => {
                              const pricePerCt = entry.ct_price || 0;
                              const ctWeight = entry.ct_weight || 0;
                              const totalPrice = pricePerCt * Math.abs(ctWeight);
                              const isDeduction = entry.type === 'deduction';
                              const finalPrice = isDeduction ? -totalPrice : totalPrice;
                              return `$${finalPrice.toLocaleString()}`;
                            })()}
                          </td>
                          <td className="p-3 text-sm">{entry.order_id || '-'}</td>
                          <td className="p-3 text-sm max-w-xs">
                            {(() => {
                              const comment = displayComment(entry.comments || '');
                              
                              return comment ? (
                                <button
                                  className="truncate text-left hover:text-blue-600 hover:underline cursor-pointer"
                                  onClick={() => setSelectedComment(comment)}
                                  title="Click to view full comment"
                                >
                                  {comment}
                                </button>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
      
      {/* Comment View Dialog */}
      <Dialog open={!!selectedComment} onOpenChange={() => setSelectedComment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Full Comment</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="whitespace-pre-wrap text-sm">{selectedComment}</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedComment(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
