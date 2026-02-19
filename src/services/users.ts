import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const UserRoleUpdateSchema = z.object({
  role: z.enum(["admin", "employee"]),
});

export const UserProfileCreateSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "employee"]).default("employee"),
});

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  profiles: {
    role: string;
    first_name?: string;
    last_name?: string;
    created_at: string;
    last_login_at?: string;
  } | null;
}

export interface UserService {
  listUsersWithProfiles(): Promise<UserWithProfile[]>;
  createUserProfile(
    input: z.infer<typeof UserProfileCreateSchema>
  ): Promise<any>;
  updateUserRole(userId: string, role: "admin" | "employee"): Promise<any>;
  updateUserProfile(
    userId: string,
    updates: { first_name?: string; last_name?: string }
  ): Promise<any>;
  updateUserEmail(userId: string, newEmail: string): Promise<any>;
  updateUserPassword(userId: string, newPassword: string): Promise<any>;
  getCurrentUserProfile(): Promise<any>;
  updateCurrentUserProfile(updates: {
    first_name?: string;
    last_name?: string;
  }): Promise<any>;
}

export const userService: UserService = {
  async listUsersWithProfiles() {
    // Note: This would typically require admin access to auth.users
    // For now, we'll return profiles only
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform to match expected format
    return (data || []).map((profile) => ({
      id: profile.user_id,
      email: "", // Would need to be fetched separately
      created_at: profile.created_at,
      profiles: {
        role: profile.role,
        created_at: profile.created_at,
      },
    }));
  },

  async createUserProfile(input: z.infer<typeof UserProfileCreateSchema>) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const validatedFields = UserProfileCreateSchema.parse(input);

    const { data, error } = await supabase
      .from("profiles")
      .insert(validatedFields)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: "admin" | "employee") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    // Cache the updated role in localStorage
    localStorage.setItem(`user_role_${userId}`, role);
    console.log("UserService: Cached updated role in localStorage:", role);

    return data;
  },

  async updateUserProfile(
    userId: string,
    updates: { first_name?: string; last_name?: string }
  ) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserEmail(userId: string, newEmail: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      // Update email in auth.users table (requires admin privileges)
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        email: newEmail,
      });

      if (error) {
        console.error("Auth admin error:", error);
        throw new Error(
          "Insufficient permissions to update user email. Please contact your system administrator."
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating user email:", error);
      throw new Error(
        "Failed to update user email. This feature requires admin privileges."
      );
    }
  },

  async updateUserPassword(userId: string, newPassword: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      // Update password in auth.users table (requires admin privileges)
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        console.error("Auth admin error:", error);
        throw new Error(
          "Insufficient permissions to update user password. Please contact your system administrator."
        );
      }
      return data;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw new Error(
        "Failed to update user password. This feature requires admin privileges."
      );
    }
  },

  async getCurrentUserProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return {
      ...data,
      email: user.email,
      last_sign_in_at: user.last_sign_in_at,
    };
  },

  async updateCurrentUserProfile(updates: {
    first_name?: string;
    last_name?: string;
  }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
