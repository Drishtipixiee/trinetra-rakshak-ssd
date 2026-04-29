/**
 * Supabase Client for Trinetra Rakshak
 * Connects to the real Supabase database for persistent threat logging.
 * Credentials come from VITE_ env vars (exposed to Vite client builds).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if credentials are configured
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Log a threat event to the Supabase threat_logs table.
 *
 * Table schema (create in Supabase SQL editor):
 *   CREATE TABLE threat_logs (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     module TEXT NOT NULL,
 *     score FLOAT NOT NULL,
 *     details TEXT,
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   );
 *
 * @param {string} module - Module name (e.g., 'BORDER-SENTRY', 'GEO-EYE')
 * @param {number} score - Risk score (0-100)
 * @param {string} details - Human-readable alert details
 * @returns {Promise<boolean>} - True if insert succeeded
 */
export async function logThreatEvent(module, score, details) {
  if (!supabase) {
    console.warn('[Supabase] Not configured. Skipping threat log.');
    return false;
  }

  try {
    const { error } = await supabase
      .from('threat_logs')
      .insert([{ module, score, details }]);

    if (error) {
      console.error('[Supabase] Insert error:', error.message);
      return false;
    }

    console.log('[Supabase] Threat event logged:', module, score);
    return true;
  } catch (err) {
    console.error('[Supabase] Failed to log threat event:', err);
    return false;
  }
}

/**
 * Fetch recent threat logs from Supabase.
 *
 * @param {number} limit - Max rows to return (default 50)
 * @returns {Promise<Array>} - Array of threat log rows
 */
export async function fetchThreatLogs(limit = 50) {
  if (!supabase) {
    console.warn('[Supabase] Not configured. Returning empty logs.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('threat_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Supabase] Fetch error:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[Supabase] Failed to fetch threat logs:', err);
    return [];
  }
}
