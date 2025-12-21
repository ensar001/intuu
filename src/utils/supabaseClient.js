import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Store the client in global scope to prevent multiple instances during HMR
if (!window.__supabase) {
  window.__supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-auth-token'
    }
  });
}

export const supabase = window.__supabase;

// Auth helpers
export const authHelpers = {
  // Sign up new user
  signUp: async (email, password, username) => {
    // First, sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) throw error;
    
    // Create profile immediately after signup
    if (data.user) {
      // Profile creation logging (development only)
      if (import.meta.env.DEV) {
        console.log('Creating profile for user:', data.user.id);
      }
      
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            username,
            current_streak: 0,
            last_study_date: new Date().toISOString().split('T')[0]
          }
        ]);
      
      if (profileError) {
        if (import.meta.env.DEV) {
          console.error('Profile creation error:', profileError);
        }
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
      
      if (import.meta.env.DEV) {
        console.log('Profile created successfully');
      }
    }
    
    return data;
  },

  // Sign in existing user
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Get user profile
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update profile
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  }
};
