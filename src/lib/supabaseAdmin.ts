// src/lib/supabaseAdmin.ts
//
// ⚠️  SERVICE ROLE KEY must NEVER be used in a React frontend.
//     It bypasses all RLS — anyone can read it from the browser DevTools.
//     All admin operations must go through Supabase Edge Functions (server-side).
//
//     For now, re-export the anon client so existing imports don't break.
//     Move any service-role operations to Edge Functions before going to production.

export { supabase as supabaseAdmin } from './supabase';