import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('Auth users fetch error:', authError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch auth users: ${authError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all profiles from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError)
      return new Response(
        JSON.stringify({ error: `Failed to fetch profiles: ${profilesError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a map of user_id to email
    const emailMap = new Map()
    if (authUsers?.users) {
      authUsers.users.forEach((user) => {
        emailMap.set(user.id, user.email)
      })
    }

    // Transform the data to include emails
    const transformedData = profiles?.map(profile => ({
      id: profile.user_id,
      user_id: profile.user_id,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.created_at, // Use created_at as fallback
      email: emailMap.get(profile.user_id) || 'Email not available'
    })) || []

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        users: transformedData
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
