/* =============================================================================
   AI PLAYTIME PROMPT LIBRARY — CONFIG
   =============================================================================
   Paste your two Supabase values below (from the SETUP guide, Step 4).
   The anon key is SAFE to expose publicly — that's what it's designed for.
   Your database is protected by the security rules in schema.sql, not by
   hiding this key.
   ========================================================================== */

window.AIP_CONFIG = {
  // Supabase → Project Settings → API → "Project URL"
  SUPABASE_URL: "https://knpoinnjkcqazbiujvlt.supabase.co",

  // Supabase → Project Settings → API → "Project API keys" → "anon public"
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtucG9pbm5qa2NxYXpiaXVqdmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDE0NzUsImV4cCI6MjA5ODYxNzQ3NX0.bSOT7rh7KVLsprgKA-jm_hpbT4icsYm8w4iiuOqWBwI",

  // Preferred order of the category filter chips. Any category you use that
  // isn't listed here still appears — it just gets added to the end
  // automatically. To pin a new category's position, add its name here.
  CATEGORY_ORDER: ["Writing", "Productivity", "Fun", "Goal-Setting"]
};
