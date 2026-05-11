import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client initialization for Vite/React projects.
 * 
 * Uses Vite environment variables:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_ANON_KEY
 * 
 * Make sure these are set in your .env file at the project root:
 *   VITE_SUPABASE_URL=your-supabase-url
 *   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);