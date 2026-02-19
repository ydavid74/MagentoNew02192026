import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  User,
  Save,
  Users,
  Plus,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserProfileDialog } from "@/components/users/UserProfileDialog";
import { userService } from "@/services/users";

interface UserAccount {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  updated_at: string;
  email: string;
  last_sign_in_at?: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    role: string;
    created_at: string;
    last_login_at?: string;
  };
}

export function SettingsPage() {
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [settings, setSettings] = useState({
    // Profile settings
    firstName: "",
    lastName: "",
    email: "",
    role: "",
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [showMyProfileDialog, setShowMyProfileDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee" as "admin" | "employee",
  });

  // Load profile information when component mounts
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log("🔍 SettingsPage: Loading profile for user:", user?.id);

      // Try to fetch profile directly from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("user_id", user?.id)
        .single();

      console.log("📊 SettingsPage: Profile query result:", {
        profileData,
        profileError,
      });

      if (!profileError && profileData) {
        const profile = profileData as any; // Type assertion to handle missing columns
        console.log("👤 SettingsPage: First Name:", profile.first_name);
        console.log("👤 SettingsPage: Last Name:", profile.last_name);
        console.log("👤 SettingsPage: Role:", profile.role);

        setSettings((prev) => ({
          ...prev,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: user?.email || "",
          role: profile.role || "No role assigned",
        }));

        // Show success message only if we loaded actual profile data
        if (profile.first_name || profile.last_name) {
          toast({
            title: "Profile Loaded",
            description:
              "Your profile information has been loaded successfully",
          });
        }
      } else {
        console.log(
          "❌ SettingsPage: Could not fetch profile data:",
          profileError
        );
        // Fallback to basic user info
        setSettings((prev) => ({
          ...prev,
          email: user?.email || "",
          role: profile?.role || "No role assigned",
          firstName: user?.email?.split("@")[0]?.split(".")[0] || "",
          lastName: user?.email?.split("@")[0]?.split(".")[1] || "",
        }));
      }
    } catch (error) {
      console.error("❌ SettingsPage: Error loading profile:", error);
      // Fallback to basic user info
      setSettings((prev) => ({
        ...prev,
        email: user?.email || "",
        role: profile?.role || "No role assigned",
        firstName: user?.email?.split("@")[0]?.split(".")[0] || "",
        lastName: user?.email?.split("@")[0]?.split(".")[1] || "",
      }));
    } finally {
      setLoading(false);
    }
  };

  // Load user accounts when component mounts
  useEffect(() => {
    if (profile?.role === "admin") {
      loadUserAccounts();
    }
  }, [profile?.role]);

  const loadUserAccounts = async () => {
    try {
      setLoading(true);

      // Fetch profiles with user data
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Fetched profiles:", profiles);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw new Error("Failed to load user profiles");
      }

      // Transform profiles to match UserAccount interface
      const userAccounts = (profiles || []).map((profile: any) => ({
        id: profile.user_id,
        user_id: profile.user_id,
        role: profile.role,
        created_at: profile.created_at,
        updated_at: profile.updated_at || profile.created_at,
        email: "", // Will be filled from auth if available
        last_sign_in_at: profile.last_login_at,
        profiles: {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          role: profile.role,
          created_at: profile.created_at,
          last_login_at: profile.last_login_at,
        },
      }));

      console.log("📊 Transformed user accounts:", userAccounts);

      // Try to get user emails from auth using Edge Function
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.users) {
            console.log(
              "✅ Successfully fetched users via Edge Function:",
              result.users.length
            );

            // Merge auth user data with profiles
            const enrichedAccounts = userAccounts.map((account) => {
              const authUser = result.users.find(
                (u: any) => u.id === account.user_id
              );
              const enrichedAccount = {
                ...account,
                email: authUser?.email || "Email not available",
                last_sign_in_at:
                  authUser?.last_sign_in_at || account.last_sign_in_at,
              };
              console.log(
                `📧 User ${account.user_id}: email = ${enrichedAccount.email}`
              );
              return enrichedAccount;
            });
            setUserAccounts(enrichedAccounts);
          } else {
            console.warn("❌ Edge Function returned no users:", result);
            setUserAccounts(userAccounts);
          }
        } else {
          console.warn("❌ Edge Function failed:", response.status);
          setUserAccounts(userAccounts);
        }
      } catch (authError) {
        console.warn("❌ Could not fetch users via Edge Function:", authError);
        setUserAccounts(userAccounts);
      }
    } catch (error) {
      console.error("SettingsPage: Error loading user accounts:", error);
      toast({
        title: "Warning",
        description: "Failed to load user accounts. Please try again.",
        variant: "destructive",
      });
      setUserAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Validate input
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Call the Supabase Edge Function to create user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      if (result.success) {
        // User created successfully
        toast({
          title: "Success",
          description: `User account created successfully for ${newUser.email} with role: ${newUser.role}`,
        });

        // Add to local state for immediate display
        const newUserAccount: UserAccount = {
          id: result.user.id,
          user_id: result.user.id,
          role: newUser.role,
          created_at: result.user.created_at,
          updated_at: result.user.created_at,
          email: result.user.email,
          last_sign_in_at: undefined,
          profiles: {
            first_name: "",
            last_name: "",
            role: newUser.role,
            created_at: result.user.created_at,
            last_login_at: undefined,
          },
        };

        setUserAccounts((prev) => [newUserAccount, ...prev]);
      } else if (result.warning) {
        // User created but profile creation failed
        toast({
          title: "Partial Success",
          description: result.warning,
          variant: "default",
        });

        // Still add to local state
        const newUserAccount: UserAccount = {
          id: result.user.id,
          user_id: result.user.id,
          role: newUser.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: result.user.email,
          last_sign_in_at: undefined,
          profiles: {
            first_name: "",
            last_name: "",
            role: newUser.role,
            created_at: new Date().toISOString(),
            last_login_at: undefined,
          },
        };

        setUserAccounts((prev) => [newUserAccount, ...prev]);
      }

      // Reset form and close dialog
      setNewUser({
        email: "",
        password: "",
        confirmPassword: "",
        role: "employee",
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create user account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      console.log("🔍 SettingsPage: Deleting user:", userToDelete.user_id);

      // Call the Supabase Edge Function to delete user
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: userToDelete.user_id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      console.log("✅ SettingsPage: User deleted successfully:", result);

      // Remove from local state
      setUserAccounts((prev) =>
        prev.filter((account) => account.id !== userToDelete.id)
      );

      toast({
        title: "User Deleted",
        description: `User account for ${userToDelete.email} has been deleted successfully`,
      });

      // Close dialog and reset state
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("❌ SettingsPage: Error deleting user:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete user account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteUser = (account: UserAccount) => {
    setUserToDelete(account);
    setShowDeleteDialog(true);
  };

  const handleEditUser = (account: UserAccount) => {
    console.log("🔍 Editing user account:", account);
    console.log("📧 User email:", account.email);
    console.log("👤 User profiles:", account.profiles);
    setSelectedUser(account);
    setShowProfileDialog(true);
  };

  const handleEditMyProfile = () => {
    setShowMyProfileDialog(true);
  };

  const handleUserUpdated = () => {
    loadUserAccounts();
    // Refresh current user profile if needed
    if (profile) {
      // You might want to refresh the auth context here
    }
  };

  const handleSave = async (category: string) => {
    if (category === "Profile") {
      // Validate profile data
      if (!settings.firstName.trim() || !settings.lastName.trim()) {
        toast({
          title: "Validation Error",
          description: "First name and last name are required",
          variant: "destructive",
        });
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 SettingsPage: Updating profile for user:", user?.id);
        console.log("🔍 SettingsPage: Update data:", {
          first_name: settings.firstName,
          last_name: settings.lastName,
        });

        // Update profile directly in Supabase
        const { data: updateData, error: updateError } = await supabase
          .from("profiles")
          .update({
            first_name: settings.firstName,
            last_name: settings.lastName,
          } as any) // Type assertion to handle missing columns
          .eq("user_id", user?.id)
          .select();

        console.log("📊 SettingsPage: Update result:", {
          updateData,
          updateError,
        });

        if (updateError) {
          console.error(
            "❌ SettingsPage: Error updating profile:",
            updateError
          );
          throw new Error(updateError.message || "Failed to update profile");
        }

        if (updateData && updateData.length > 0) {
          console.log("✅ SettingsPage: Profile updated successfully");
          toast({
            title: "Profile Updated",
            description:
              "Your profile information has been updated successfully",
          });

          // Reload profile to get updated data
          await loadProfile();
        } else {
          throw new Error("No data returned from update operation");
        }
      } catch (error) {
        console.error("❌ SettingsPage: Error updating profile:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast({
        title: "Settings saved",
        description: `${category} settings have been updated successfully`,
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          {profile?.role === "admin" ? "Admin" : "Employee"}
        </Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Your personal information and account details
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                      Loading profile...
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditMyProfile}
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadProfile}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={settings.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                    disabled={loading}
                    className={loading ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={settings.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                    disabled={loading}
                    className={loading ? "bg-muted" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-muted"
                  placeholder="Email address cannot be changed"
                />
                <p className="text-sm text-muted-foreground">
                  Email address is managed by your authentication provider
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={settings.role}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Your role is managed by administrators
                </p>
              </div>

              <Button
                onClick={() => handleSave("Profile")}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          {profile?.role === "admin" ? (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    User Management
                  </h2>
                  <p className="text-muted-foreground">
                    Manage team members and their access permissions
                  </p>
                </div>
                <Dialog
                  open={showCreateDialog}
                  onOpenChange={setShowCreateDialog}
                >
                  <DialogTrigger asChild>
                    <Button className="h-10">
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Team Member</DialogTitle>
                      <DialogDescription>
                        Create a new user account with email and password
                        authentication.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleCreateUser();
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-email">Email Address</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="colleague@company.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role-select">Role</Label>
                          <select
                            id="role-select"
                            value={newUser.role}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                role: e.target.value as "admin" | "employee",
                              }))
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="employee">Employee</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                            placeholder="Enter password"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={newUser.confirmPassword}
                            onChange={(e) =>
                              setNewUser((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            placeholder="Confirm password"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Creating..." : "Create User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold">
                          {userAccounts.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Shield className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Admins
                        </p>
                        <p className="text-2xl font-bold">
                          {
                            userAccounts.filter((u) => u.role === "admin")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Employees
                        </p>
                        <p className="text-2xl font-bold">
                          {
                            userAccounts.filter((u) => u.role === "employee")
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Users List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>
                        Manage user accounts and permissions
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={loadUserAccounts}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">
                          Loading users...
                        </p>
                      </div>
                    </div>
                  ) : userAccounts.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium mb-2">
                        No users found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first team member.
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First User
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">
                                  {account.profiles?.first_name &&
                                  account.profiles?.last_name
                                    ? `${account.profiles.first_name} ${account.profiles.last_name}`
                                    : "No name set"}
                                </p>
                                <Badge
                                  variant={getRoleBadgeVariant(account.role)}
                                  className="text-xs"
                                >
                                  {account.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {account.email || "Email not available"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Joined {formatDate(account.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {account.last_sign_in_at
                                    ? `Last seen ${formatDate(
                                        account.last_sign_in_at
                                      )}`
                                    : "Never logged in"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(account)}
                              disabled={loading}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmDeleteUser(account)}
                              disabled={loading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  User management is only available to administrators. Contact
                  your administrator to manage user accounts.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user account for{" "}
              <strong>{userToDelete?.email}</strong>? This action cannot be
              undone and will permanently remove all user data from the profiles
              table.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Edit Dialog */}
      <UserProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
        isCurrentUser={false}
      />

      {/* My Profile Edit Dialog */}
      <UserProfileDialog
        open={showMyProfileDialog}
        onOpenChange={setShowMyProfileDialog}
        user={
          user
            ? {
                id: user.id,
                email: user.email,
                profiles: profile,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
              }
            : null
        }
        onUserUpdated={handleUserUpdated}
        isCurrentUser={true}
      />
    </div>
  );
}
