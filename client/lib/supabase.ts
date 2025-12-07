import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    console.error('❌ Missing Supabase environment variables:', missing.join(', '));
    console.error('Please create a .env.local file in the client directory with:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    return false;
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl);
    return false;
  }
  
  return true;
}

const isValid = validateSupabaseConfig();

// Create client with fallback to prevent crashes
export const supabase = isValid && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}