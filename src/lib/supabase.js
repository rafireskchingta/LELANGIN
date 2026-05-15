import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key';

// createBrowserClient akan otomatis menyeimbangkan token antara Cookie dan Local Storage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
}