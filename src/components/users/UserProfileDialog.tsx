import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userService } from "@/services/users";
import { User, Mail, Lock, UserCheck, Calendar } from "lucide-react";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onUserUpdated: () => void;
  isCurrentUser?: boolean;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  user,
  onUserUpdated,
  isCurrentUser = false,
}: UserProfileDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "employee",
    password: "",
  });

  useEffect(() => {
    if (user) {
      console.log("🔍 UserProfileDialog received user:", user);
      console.log("📧 User email:", user.email);
      console.log("👤 User profiles:", user.profiles);
      setFormData({
        first_name: user.profiles?.first_name || "",
        last_name: user.profiles?.last_name || "",
        email: user.email || "",
        role: user.profiles?.role || "employee",
        password: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isCurrentUser) {
        // Update current user's profile
        await userService.updateCurrentUserProfile({
          first_name: formData.first_name,
          last_name: formData.last_name,
        });
      } else {
        // Update other user's profile (admin only)
        const updates = [];

        // Always update name and role
        await userService.updateUserProfile(user.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
        });
        updates.push("name");

        // Update role if changed
        if (formData.role !== user.profiles?.role) {
          await userService.updateUserRole(
            user.id,
            formData.role as "admin" | "employee"
          );
          updates.push("role");
        }

        // Try to update email if changed (may fail due to permissions)
        if (formData.email !== user.email) {
          try {
            await userService.updateUserEmail(user.id, formData.email);
            updates.push("email");
          } catch (emailError) {
            console.warn("Email update failed:", emailError);
            toast({
              title: "Partial Success",
              description:
                "Profile updated, but email change failed due to insufficient permissions. Contact your system administrator.",
              variant: "destructive",
            });
          }
        }

        // Try to update password if provided (may fail due to permissions)
        if (formData.password) {
          try {
            await userService.updateUserPassword(user.id, formData.password);
            updates.push("password");
          } catch (passwordError) {
            console.warn("Password update failed:", passwordError);
            toast({
              title: "Partial Success",
              description:
                "Profile updated, but password change failed due to insufficient permissions. Contact your system administrator.",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatLastLogin = (lastLogin: string) => {
    if (!lastLogin) return "Never";
    return new Date(lastLogin).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            {isCurrentUser ? "My Profile" : "Edit Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isCurrentUser
              ? "Update your personal information and profile details."
              : "Manage user information, role, and account settings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder="Enter first name"
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder="Enter last name"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Account Information
            </h3>

            {isCurrentUser && (
              <div className="space-y-2">
                <Label htmlFor="my-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="my-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                  disabled={true}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Email changes require admin assistance
                </p>
              </div>
            )}

            {!isCurrentUser && (
              <>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-role"
                    className="flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-email"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email changes may require system administrator privileges
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit-password"
                    className="flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    New Password (optional)
                  </Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter new password (leave blank to keep current)"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Password changes may require system administrator privileges
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Account Details */}
          {user && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Login:</span>
                  <p className="font-medium">
                    {formatLastLogin(
                      user.last_sign_in_at || user.profiles?.last_login_at
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[100px]">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
