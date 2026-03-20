import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;
let _publicSupabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Uses the service role key to bypass RLS — server-side only, never exposed to the browser
export function getPublicSupabase(): SupabaseClient {
  if (!_publicSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your .env.local and Vercel env vars."
      );
    }
    _publicSupabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _publicSupabase;
}

export type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  excerpt: string | null;
  created_at: string;
  updated_at: string;
};
