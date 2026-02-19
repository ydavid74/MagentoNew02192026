import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Save, X } from "lucide-react";
import { DiamondInventory } from "@/services/diamonds";
import { useToast } from "@/hooks/use-toast";

interface AddReduceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  diamond: DiamondInventory | null;
  mode: 'add' | 'reduce';
  onSubmit: (data: { stones: number; ctWeight: number; comment: string }) => Promise<void>;
}

export function AddReduceDialog({
  isOpen,
  onOpenChange,
  diamond,
  mode,
  onSubmit
}: AddReduceDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    stones: 1,
    ctWeight: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (diamond) {
      setFormData({
        stones: 1,
        ctWeight: 0,
        comment: ''
      });
    }
  }, [diamond]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diamond) return;

    if (formData.stones <= 0 || formData.ctWeight < 0) {
      toast({
        title: "Error",
        description: "Please enter valid values for stones (must be > 0) and CT weight (must be >= 0)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log(`📝 Submitting ${mode} form data:`, formData);
      await onSubmit(formData);
      console.log(`✅ ${mode} operation completed successfully`);
      toast({
        title: "Success",
        description: `Diamond ${mode === 'add' ? 'increased' : 'decreased'} successfully`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error(`❌ Error ${mode}ing diamond:`, error);
      toast({
        title: "Error",
        description: `Failed to ${mode} diamond`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!diamond) return null;

  const isAdd = mode === 'add';
  const Icon = isAdd ? Plus : Minus;
  const title = isAdd ? 'Add to Diamond' : 'Reduce from Diamond';
  const description = isAdd 
    ? `Add stones and weight to ${diamond.parcel_name}`
    : `Reduce stones and weight from ${diamond.parcel_name}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isAdd ? 'text-green-600' : 'text-red-600'}`} />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {description}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stones">Number of Stones</Label>
                <Input
                  id="stones"
                  type="number"
                  min="1"
                  value={formData.stones}
                  onChange={(e) => setFormData(prev => ({ ...prev, stones: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="ctWeight">CT Weight</Label>
                <Input
                  id="ctWeight"
                  type="number"
                  step="0.01"
                  min={mode === 'reduce' ? "0" : "0.01"}
                  value={formData.ctWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, ctWeight: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  rows={3}
                  placeholder={`Reason for ${mode}ing this diamond...`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className={isAdd ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
