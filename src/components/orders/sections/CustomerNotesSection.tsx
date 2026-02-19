import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/StatusBadge";

import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StatusService, StatusOption } from "@/services/statuses";
import { formatDateTimeToEST } from "@/utils/timezone";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerNotesSectionProps {
  order: any;
  onRefreshOrder?: () => void;
  onStatusUpdate?: () => void;
}

export function CustomerNotesSection({
  order,
  onRefreshOrder,
  onStatusUpdate,
}: CustomerNotesSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [newNoteStatus, setNewNoteStatus] = useState("");
  const [orderStatusOptions, setOrderStatusOptions] = useState<StatusOption[]>(
    []
  );
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [employeeNames, setEmployeeNames] = useState<any>({});
  const [isLoadingNames, setIsLoadingNames] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch status options from statuses_model table
  useEffect(() => {
    const fetchStatusOptions = async () => {
      setIsLoadingStatuses(true);
      try {
        const statuses = await StatusService.getAllStatuses();
        setOrderStatusOptions(statuses);

        // Set default status to first option if available
        if (statuses.length > 0 && !newNoteStatus) {
          setNewNoteStatus(statuses[0].value);
        }
      } catch (error) {
        console.error("Error fetching status options:", error);
        toast({
          title: "Error",
          description: "Failed to load status options",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };

    fetchStatusOptions();
  }, []);

  // Fetch employee names from profiles table
  useEffect(() => {

    const fetchEmployeeNames = async () => {
      if (
        !order.order_customer_notes ||
        order.order_customer_notes.length === 0
      ) {
        return;
      }

      setIsLoadingNames(true);
      try {
        // Get unique user IDs from notes, filtering out null values
        const userIds = [
          ...new Set(
            order.order_customer_notes
              .map((note: any) => note.created_by)
              .filter((id: any) => id !== null && id !== undefined)
          ),
        ];

        if (userIds.length === 0) {
          console.log("No valid user IDs found in notes");
          return;
        }
        console.log(`👩👩userIds: ${userIds}`);
        console.log(`👩👩Notes data:`, order.order_customer_notes);
        // Fetch profiles for these user IDs
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds as string[]);

        if (error) {
          console.error("Error fetching employee profiles:", error);
          // Set fallback names for all user IDs
          const fallbackMap: any = {};
          userIds.forEach((userId: string) => {
            fallbackMap[userId] = "Unknown Employee";
          });
          setEmployeeNames(fallbackMap);
          return;
        }

        console.log("Fetched profiles:", profiles);

        // Create a mapping of user ID to full name
        const nameMap: any = {};

        // Initialize all user IDs with fallback names
        userIds.forEach((userId: string) => {
          nameMap[userId] = "Unknown Employee";
        });

        (profiles as any[])?.forEach((profile: any) => {
          console.log(
            `👩👩profile: ${profile.first_name} ${profile.last_name} for user_id: ${profile.user_id}`
          );

          if (profile.first_name && profile.last_name) {
            const fullName =
              `${profile.first_name} ${profile.last_name}`.trim();
            nameMap[profile.user_id] = fullName;
            console.log(
              `👩👩nameMap: ${nameMap[profile.user_id]} for ${profile.user_id}`
            );
          } else if (profile.first_name) {
            nameMap[profile.user_id] = profile.first_name;
          } else if (profile.last_name) {
            nameMap[profile.user_id] = profile.last_name;
          } else {
            nameMap[profile.user_id] = "Unknown Employee";
          }
        });

        setEmployeeNames(nameMap);
      } catch (error) {
        console.error("Error fetching employee names:", error);
      } finally {
        setIsLoadingNames(false);
      }
    };

    fetchEmployeeNames();
  }, [order.order_customer_notes]);

  const handleSubmitNote = async () => {
    if (!newNoteStatus) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }

    if (isSubmittingNote) return; // Prevent multiple submissions

    setIsSubmittingNote(true);
    try {
      const { orderCustomerNotesService } = await import("@/services/orderCustomerNotes");
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      await orderCustomerNotesService.create({
        order_id: order.id,
        content: newNote.trim() || "", // Allow empty notes
        status: newNoteStatus,
        created_by: user.id,
      });

      toast({
        title: "Success",
        description: "Customer note added successfully",
      });

      setNewNote("");
      setNewNoteStatus(
        orderStatusOptions.length > 0 ? orderStatusOptions[0].value : ""
      );
      setIsAddingNote(false);

      // Invalidate and refetch the order query to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      
      if (onRefreshOrder) {
        onRefreshOrder();
      }

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error adding customer note:", error);
      toast({
        title: "Error",
        description: "Failed to add customer note",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isDeletingNote === noteId) return; // Prevent multiple deletions

    setIsDeletingNote(noteId);
    try {
      const { orderCustomerNotesService } = await import("@/services/orderCustomerNotes");
      await orderCustomerNotesService.delete(noteId);

      toast({
        title: "Success",
        description: "Customer note deleted successfully",
      });

      // Invalidate and refetch the order query to get fresh data
      await queryClient.invalidateQueries({ queryKey: ['orders', order.id] });

      if (onRefreshOrder) {
        onRefreshOrder();
      }

      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error("Error deleting customer note:", error);
      toast({
        title: "Error",
        description: "Failed to delete customer note",
        variant: "destructive",
      });
    } finally {
      setIsDeletingNote(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Notes</CardTitle>
          <Button
            onClick={() => {
              setIsAddingNote(true);
              setNewNote("");
              setNewNoteStatus(
                orderStatusOptions.length > 0 ? orderStatusOptions[0].value : ""
              );
            }}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* New Note Form - Only show when adding */}
          {isAddingNote && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium">Add New Customer Note</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Note Content</Label>
                  <Textarea
                    placeholder="Enter customer note (optional)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Order Status *</Label>
                  <Select
                    value={newNoteStatus}
                    onValueChange={setNewNoteStatus}
                    disabled={isLoadingStatuses}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingStatuses
                            ? "Loading statuses..."
                            : "Select status"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingStatuses ? (
                        <SelectItem value="loading" disabled>
                          Loading statuses...
                        </SelectItem>
                      ) : (
                        orderStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitNote}
                  disabled={
                    !newNoteStatus || isSubmittingNote || isLoadingStatuses
                  }
                >
                  {isSubmittingNote ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Note"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewNote("");
                    setNewNoteStatus(
                      orderStatusOptions.length > 0
                        ? orderStatusOptions[0].value
                        : ""
                    );
                    setIsAddingNote(false);
                  }}
                  disabled={isSubmittingNote}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Customer Notes Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Customer Notes History</h4>
              {isLoadingNames && (
                <span className="text-sm text-muted-foreground">
                  Loading employee names...
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date Added</th>
                    <th className="text-left p-2">Order Status</th>
                    <th className="text-left p-2">Employee Name</th>
                    <th className="text-left p-2">Comment</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_customer_notes &&
                  order.order_customer_notes.length > 0 ? (
                    order.order_customer_notes
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((note: any) => (
                        <tr key={note.id} className="border-b">
                          <td className="p-2">
                            <div className="text-sm">
                              {note.created_at &&
                                formatDateTimeToEST(note.created_at)}
                            </div>
                          </td>
                          <td className="p-2">
                            <StatusBadge status={note.status || "pending"} />
                          </td>
                          <td className="p-2">
                            <div className="text-sm font-medium">
                              {isLoadingNames ? (
                                <span className="text-muted-foreground">
                                  Loading...
                                </span>
                              ) : note.created_by ? (
                                employeeNames[note.created_by] ||
                                "Unknown Employee"
                              ) : (
                                <span className="text-muted-foreground">
                                  System Generated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm max-w-xs">
                              {note.content}
                            </div>
                          </td>
                          <td className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={isDeletingNote === note.id}
                            >
                              {isDeletingNote === note.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No customer notes yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
