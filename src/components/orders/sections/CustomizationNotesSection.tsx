import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomizationNotesSectionProps {
  order: any;
  onUpdateOrder: (data: any) => Promise<void>;
  onRefreshOrder?: () => void;
}

export function CustomizationNotesSection({ order, onUpdateOrder, onRefreshOrder }: CustomizationNotesSectionProps) {
  const { toast } = useToast();
  const [customizationNotes, setCustomizationNotes] = useState(order?.customization_notes || "");
  const [isEditingCustomizationNotes, setIsEditingCustomizationNotes] = useState(false);

  const handleSaveCustomizationNotes = async () => {
    try {
      await onUpdateOrder({ 
        customization_notes: customizationNotes 
      });
      
      setIsEditingCustomizationNotes(false);
      toast({
        title: "Success",
        description: "Customization notes saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customization notes",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customization Notes</CardTitle>
          {!isEditingCustomizationNotes && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingCustomizationNotes(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditingCustomizationNotes ? (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter customization notes..."
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveCustomizationNotes}>
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditingCustomizationNotes(false);
                  setCustomizationNotes(order.customization_notes || "");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(customizationNotes || order.customization_notes) ? (
              <div className="p-4 bg-transparent rounded-lg">
                <div className="flex items-center justify-center gap-4">
                  {/* Left side stars */}
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={`left-${i}`}
                        className="text-red-500 text-3xl animate-pulse"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1s'
                        }}
                      >
                        ★
                      </div>
                    ))}
                  </div>
                  
                  {/* Customization notes text */}
                  <div className="text-center">
                    <p className="text-red-500 font-bold text-xl whitespace-pre-wrap">
                      {customizationNotes || order.customization_notes}
                    </p>
                  </div>
                  
                  {/* Right side stars */}
                  <div className="flex gap-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={`right-${i}`}
                        className="text-red-500 text-3xl animate-pulse"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '1s'
                        }}
                      >
                        ★
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No customization notes added yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
