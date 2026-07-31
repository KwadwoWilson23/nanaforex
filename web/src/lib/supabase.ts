import { createClient } from "@supabase/supabase-js";

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xjmakedoqdbfafhbhjsj.supabase.co";

// Anon key is safe to ship to the browser. RLS gates access at the table level.
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbWFrZWRvcWRiZmFmaGJoanNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjQxNjksImV4cCI6MjA5NjYwMDE2OX0.301vOBOwx_Srai3mKlLAzBDCztKWOL5LTN5-v1_xklc";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
