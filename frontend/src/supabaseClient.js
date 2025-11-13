// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Find these in your Supabase project settings under "API"
const supabaseUrl = 'https://hjdsgjcnmzdxymtilljm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZHNnamNubXpkeHltdGlsbGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNDkwMTAsImV4cCI6MjA3NzcyNTAxMH0.aCwzqeFWqBEo--LE1qU-Jd3kFg1LH3ImvqIK7Nl9Ow4'; // This key is safe to expose

export const supabase = createClient(supabaseUrl, supabaseAnonKey);