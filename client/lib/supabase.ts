import { createBrowserClient } from '@supabase/ssr';

// Next.js automatically makes NEXT_PUBLIC_* variables available in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug logging (only in development, client-side)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 Supabase Config (Client-side):');
  console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 40)}...` : 'MISSING');
  console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'MISSING');
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('❌ Supabase environment variables not found!');
    console.error('Please ensure .env.local exists in the client directory with:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    console.error('Then restart the dev server with: npm run dev');
  }
}

// Create browser client with proper cookie handling
// createBrowserClient handles cookies automatically for SSR
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}