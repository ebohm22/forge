// config/supabaseClient.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// The Admin client (uses SERVICE_ROLE_KEY)
const supabase = createClient(supabaseUrl, serviceKey);

// The Public client (uses ANON_KEY)
const supabasePublic = createClient(supabaseUrl, anonKey);

module.exports = { supabase, supabasePublic };