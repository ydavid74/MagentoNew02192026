import { supabase } from '@/integrations/supabase/client'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthService {
  getSession(): Promise<{ session: Session | null; user: User | null }>
  signInWithPassword(email: string, password: string): Promise<{ error: any }>
  signOut(): Promise<{ error: any }>
  getProfileRole(userId: string): Promise<string | null>
}

export const authService: AuthService = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, user: session?.user || null }
  },

  async signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getProfileRole(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error getting profile role:', error)
      return null
    }
    
    return data.role
  }
}