// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Find these in your Supabase project settings under "API"
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);