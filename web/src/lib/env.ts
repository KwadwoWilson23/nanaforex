// ============================================================
// Shared, safe-to-ship env constants.
// All values here are PUBLIC (Supabase anon key + Google OAuth
// Client ID are meant to be shipped to browsers). Secrets belong
// in server-only env vars, not here.
// ============================================================

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xjmakedoqdbfafhbhjsj.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbWFrZWRvcWRiZmFmaGJoanNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQxNjksImV4cCI6MjA5NjYwMDE2OX0.301vOBOwx_Srai3mKlLAzBDCztKWOL5LTN5-v1_xklc";

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1021915020366-jl8clfmjpe5vbu1k7e16dc3usupen91m.apps.googleusercontent.com";
