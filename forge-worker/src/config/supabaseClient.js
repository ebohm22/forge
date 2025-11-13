// src/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// This function gets the environment variables from Hono's context ('c')
export const getSupabaseClient = (c) => {
  return createClient(
    c.env.SUPABASE_URL, 
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

// This function gets the environment variables from Hono's context ('c')
export const getSupabasePublicClient = (c) => {
  return createClient(
    c.env.SUPABASE_URL, 
    c.env.SUPABASE_ANON_KEY
  );
};