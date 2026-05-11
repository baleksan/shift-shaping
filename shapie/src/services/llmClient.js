/**
 * LLM Client
 *
 * Shared client for calling the Salesforce AI Model Gateway (OpenAI-compatible).
 * Wraps the fetch call with proper auth, error handling, and configuration.
 *
 * Accepts a full messages array (system + user + assistant turns) rather than
 * a single prompt string, making it suitable for multi-turn conversations.
 */

// ----------------------------------------------------------------
// Gateway Configuration
// ----------------------------------------------------------------

/** Salesforce AI Model Gateway endpoint (OpenAI-compatible) */
export const DEFAULT_LLM_GATEWAY =
  'https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl/v1/chat/completions';

/** Default model for Shapie interactions */
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

/**
 * Available models on the Salesforce AI Model Gateway.
 * Grouped by provider for the settings UI.
 */
export const GATEWAY_MODELS = [
  // GPT
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', tier: 'fast' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'standard' },
  { id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', tier: 'fast' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', tier: 'premium' },
  { id: 'gpt-5.5', name: 'GPT-5.5', provider: 'OpenAI', tier: 'premium' },
  // Claude
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'Anthropic', tier: 'fast' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic', tier: 'standard' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', tier: 'standard' },
  { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', provider: 'Anthropic', tier: 'premium' },
  // Gemini
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', tier: 'fast' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', tier: 'standard' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (preview)', provider: 'Google', tier: 'fast' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (preview)', provider: 'Google', tier: 'standard' },
];

// ----------------------------------------------------------------
// Core LLM Call
// ----------------------------------------------------------------

/**
 * Send a chat completion request to the AI Model Gateway.
 *
 * @param {Array<{role: string, content: string}>} messages - Full conversation messages array
 * @param {object} config - LLM configuration
 * @param {string} config.apiKey - Bearer token for the gateway (required)
 * @param {string} [config.apiUrl] - Override gateway URL
 * @param {string} [config.model] - Model ID (defaults to gpt-4o-mini)
 * @param {number} [config.temperature] - Sampling temperature (defaults to 0.7)
 * @param {number} [config.maxTokens] - Max tokens in response (defaults to 2048)
 * @returns {Promise<string>} The assistant's response content
 */
export async function callLLM(messages, config = {}) {
  const {
    apiKey,
    apiUrl = DEFAULT_LLM_GATEWAY,
    model = DEFAULT_LLM_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
  } = config;

  if (!apiKey) {
    throw new Error('LLM API key not configured');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}
