import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id?: string;
  user_id: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createProfile: (role?: 'admin' | 'employee') => Promise<Profile | undefined>;
  checkAdminStatus: () => Promise<{ isAdmin: boolean; role: string | null }>;
  forceRefreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Debug logging for state changes
  useEffect(() => {
    console.log('AuthContext: State changed - user:', !!user, 'session:', !!session, 'profile:', !!profile, 'loading:', loading);
    console.log('AuthContext: Profile details:', profile);
    console.log('AuthContext: User details:', user);
  }, [user, session, profile, loading]);

  useEffect(() => {
    console.log('AuthContext: Initializing auth state');
    
    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 seconds timeout (reduced from 10)

    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting initial session:', error);
          setLoading(false);
          return;
        }

        console.log('AuthContext: Initial session:', session ? 'exists' : 'none');
        console.log('AuthContext: Session details:', session);
        
        if (session?.user) {
          console.log('AuthContext: User found, setting session and user');
          setSession(session);
          setUser(session.user);
          
          // Fetch profile for the user
          console.log('AuthContext: Fetching profile for user:', session.user.id);
          try {
            await fetchProfile(session.user.id);
          } catch (profileError) {
            console.error('AuthContext: Failed to fetch profile, keeping user but no profile:', profileError);
            // Keep the user but don't set a profile - this will show as no role
            setProfile(null);
          }
        } else {
          console.log('AuthContext: No session found, setting loading to false');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Exception getting initial session:', error);
        setLoading(false);
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event, session ? 'session exists' : 'no session');
      console.log('AuthContext: Event details:', { event, session });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          console.log('AuthContext: User signed in/refreshed, setting session and user');
          setSession(session);
          setUser(session.user);
          try {
            await fetchProfile(session.user.id);
          } catch (profileError) {
            console.error('AuthContext: Failed to fetch profile on auth change:', profileError);
            setProfile(null);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthContext: User signed out, clearing all state');
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'USER_UPDATED') {
        if (session?.user) {
          console.log('AuthContext: User updated, refreshing profile');
          setUser(session.user);
          try {
            await fetchProfile(session.user.id);
          } catch (profileError) {
            console.error('AuthContext: Failed to fetch profile on user update:', profileError);
            setProfile(null);
          }
        }
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listeners');
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for userId:', userId);
      
      // Check if we have a cached role in localStorage
      const cachedRole = localStorage.getItem(`user_role_${userId}`);
      console.log('AuthContext: Cached role from localStorage:', cachedRole);
      
      if (cachedRole) {
        // Use cached role immediately - no database access needed
        console.log('AuthContext: Using cached role:', cachedRole);
        const profile = {
          user_id: userId,
          role: cachedRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setProfile(profile);
        setLoading(false);
        return;
      }
      
      // If no cached role, check the profiles table to see if user is admin
      console.log('AuthContext: No cached role, checking profiles table for admin status...');
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userId)
          .single();
        
        if (profileError) {
          console.warn('AuthContext: Could not fetch profile from database:', profileError);
          // Fall through to default employee role
        } else if (profileData && profileData.role) {
          console.log('AuthContext: Found role in profiles table:', profileData.role);
          const profile = {
            user_id: userId,
            role: profileData.role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // Cache the role from database
          localStorage.setItem(`user_role_${userId}`, profileData.role);
          console.log('AuthContext: Cached role from database:', profileData.role);
          
          setProfile(profile);
          setLoading(false);
          return;
        }
      } catch (dbError) {
        console.warn('AuthContext: Database access failed, falling back to default role:', dbError);
        // Fall through to default employee role
      }
      
      // If no cached role and no database access, create a default employee profile locally
      console.log('AuthContext: No cached role and no database access, creating default employee profile locally');
      const defaultProfile = {
        user_id: userId,
        role: 'employee', // Default to employee role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Cache the default role
      localStorage.setItem(`user_role_${userId}`, 'employee');
      console.log('AuthContext: Cached default employee role');
      
      setProfile(defaultProfile);
      setLoading(false);
      
    } catch (error) {
      console.error('AuthContext: Error in fetchProfile:', error);
      // Create a default employee profile if anything goes wrong
      const fallbackProfile = {
        user_id: userId,
        role: 'employee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProfile(fallbackProfile);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear cached role before signing out
      if (user) {
        localStorage.removeItem(`user_role_${user.id}`);
        console.log('AuthContext: Cleared cached role for user:', user.id);
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('AuthContext: Refreshing profile (using cached data if available)...');
      await fetchProfile(user.id);
    }
  };

  // Manual profile creation for testing
  const createProfile = async (role: 'admin' | 'employee' = 'employee') => {
    if (!user) return;
    
    try {
      console.log('AuthContext: Manually creating profile with role:', role);
      
      // Create profile locally and cache in localStorage
      const profile = {
        user_id: user.id,
        role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Cache the role in localStorage
      localStorage.setItem(`user_role_${user.id}`, role);
      console.log('AuthContext: Manual profile creation successful, cached role:', role);
      
      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('AuthContext: Manual profile creation error:', error);
      throw error;
    }
  };

  const checkAdminStatus = async () => {
    if (!user) {
      return { isAdmin: false, role: null };
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.warn('AuthContext: Could not check admin status from database:', profileError);
        return { isAdmin: false, role: null };
      }

      if (profileData && profileData.role === 'admin') {
        return { isAdmin: true, role: profileData.role };
      }

      return { isAdmin: false, role: profileData?.role || null };
    } catch (error) {
      console.error('AuthContext: Error checking admin status:', error);
      return { isAdmin: false, role: null };
    }
  };

  const forceRefreshProfile = async () => {
    if (!user) return;
    
    try {
      console.log('AuthContext: Force refreshing profile from database...');
      
      // Clear cached role to force database check
      localStorage.removeItem(`user_role_${user.id}`);
      console.log('AuthContext: Cleared cached role for force refresh');
      
      // Now fetch profile (which will check database since cache is cleared)
      await fetchProfile(user.id);
    } catch (error) {
      console.error('AuthContext: Error in force refresh profile:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    createProfile,
    checkAdminStatus,
    forceRefreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
