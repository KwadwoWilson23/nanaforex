const { createClient } = supabase;

const supabaseClient = createClient(
  window.NANA_FOREX_ENV.SUPABASE_URL,
  window.NANA_FOREX_ENV.SUPABASE_ANON_KEY
);
