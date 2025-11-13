// config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// NOTE: We initialize clients using env vars from the Hono context (c)

export const getSupabaseClient = (c) => {
  return createClient(
    c.env.SUPABASE_URL, 
    c.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export const getSupabasePublicClient = (c) => {
  return createClient(
    c.env.SUPABASE_URL, 
    c.env.SUPABASE_ANON_KEY
  );
};