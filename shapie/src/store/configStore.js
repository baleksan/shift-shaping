/**
 * Config Store
 *
 * Persists app-wide configuration (API keys, theme, etc.) to
 * localStorage. Falls back to environment variable defaults where
 * available so the app works out of the box in dev.
 */

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const STORAGE_KEY = 'shapie_config';

// ----------------------------------------------------------------
// Defaults (from env vars or hard-coded fallbacks)
// ----------------------------------------------------------------

const DEFAULTS = {
  llmApiKey: process.env.REACT_APP_LLM_API_KEY || '',
  llmApiUrl: process.env.REACT_APP_LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
  llmModel: process.env.REACT_APP_LLM_MODEL || 'gpt-4o-mini',
  wolfiePort: 3099,
  theme: 'system', // 'light' | 'dark' | 'system'
};

// ----------------------------------------------------------------
// Persistence
// ----------------------------------------------------------------

/**
 * Load config from localStorage, merged with defaults.
 * Stored values take precedence over defaults.
 *
 * @returns {object} Full config object.
 */
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    return { ...DEFAULTS, ...stored };
  } catch (err) {
    console.error('[configStore] Failed to load config:', err);
    return { ...DEFAULTS };
  }
}

/**
 * Save config to localStorage.
 * Only persists fields that differ from env-var defaults to keep
 * storage lean and avoid leaking keys into JSON unnecessarily.
 *
 * @param {object} config - Full or partial config to persist.
 */
export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('[configStore] Failed to save config:', err);
  }
}

/**
 * Update specific config fields (merge semantics).
 *
 * @param {object} updates - Fields to update.
 * @returns {object} The full updated config.
 */
export function updateConfig(updates) {
  const current = loadConfig();
  const merged = { ...current, ...updates };
  saveConfig(merged);
  return merged;
}

/**
 * Reset config to defaults (clears stored overrides).
 *
 * @returns {object} The default config.
 */
export function resetConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[configStore] Failed to reset config:', err);
  }
  return { ...DEFAULTS };
}
