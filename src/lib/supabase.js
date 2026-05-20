import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars tidak ditemukan. Pastikan .env.local sudah dibuat.');
}

// createBrowserClient akan otomatis menyeimbangkan token antara Cookie dan Local Storage
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_key'
);

if (typeof window !== 'undefined') {
  window.supabaseClient = supabase;
}