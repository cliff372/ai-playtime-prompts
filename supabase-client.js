/* =============================================================================
   Shared Supabase client for the AI Playtime Prompt Library.
   Loaded on both the public page and the admin page.
   Requires: supabase-js (CDN) loaded first, and config.js.
   ========================================================================== */

window.AIP = (function () {
  var cfg = window.AIP_CONFIG || {};
  var configured =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_URL.indexOf("PASTE_") === -1 &&
    cfg.SUPABASE_ANON_KEY.indexOf("PASTE_") === -1;

  var client = null;
  if (configured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  return {
    client: client,
    configured: !!configured,
    cfg: cfg
  };
})();
