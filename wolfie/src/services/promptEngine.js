/**
 * Prompt Engine
 *
 * Processes search results through customizable prompt templates to produce:
 *   1. Explanation — a 3-sentence human-friendly summary of what was found
 *   2. Best Pick — selects the single best product for the user's query
 *   3. Query Reformulations — narrows down the search with alternative queries
 *
 * The engine operates in two modes:
 *   - LLM mode: sends prompts to an OpenAI-compatible API (configurable)
 *   - Local mode: uses heuristic logic (no API key required)
 *
 * Prompts are fully editable by the user through the Prompt Settings panel.
 */

// ----------------------------------------------------------------
// Default Prompt Templates (user-editable)
// ----------------------------------------------------------------

export const DEFAULT_PROMPTS = {
  explanation: {
    id: 'explanation',
    label: 'Explanation Prompt',
    description: 'Generates a 3-sentence summary explaining the search results to the user.',
    template: `You are a helpful shopping assistant. The user searched for: "{{query}}"

Here are the search results:
{{results}}

Write exactly 3 sentences explaining what you found. Be specific about the products, mention price ranges, and highlight anything noteworthy (deals, popular brands, variety). Keep it friendly and concise. Do NOT use bullet points or lists — just 3 flowing sentences.`,
  },

  bestPick: {
    id: 'bestPick',
    label: 'Best Pick Prompt',
    description: 'Analyzes results and selects the single best product for the user\'s query.',
    template: `You are a shopping expert. The user asked for: "{{query}}"

Here are the available products:
{{results}}

Pick the SINGLE best product for this query. Consider:
- Relevance to what the user asked for
- Value for money (price vs features)
- Ratings and reviews if available
- Availability (skip out-of-stock items)

Respond with ONLY a JSON object (no markdown, no explanation):
{"index": <0-based index of best product>, "reason": "<one sentence why this is the best pick>"}`,
  },

  reformulations: {
    id: 'reformulations',
    label: 'Query Reformulations Prompt',
    description: 'Generates alternative search queries to help the user narrow down results.',
    template: `You are a search query optimizer for a shopping assistant. The user originally searched for: "{{query}}"

Here are the results they got:
{{results}}

Generate 4-5 alternative search queries that would help the user narrow down or refine their search. Consider:
- More specific variants (size, color, brand, price range)
- Related but different product categories
- Common refinements shoppers use

IMPORTANT: Each label MUST end with the core search term in parentheses so the user sees the context.
For example if the original query was "I want running shoes", labels should look like:
  "Under $100 (running shoes)", "Nike (running shoes)", "Trail (running shoes)"

Respond with ONLY a JSON array of objects (no markdown):
[{"query": "<refined search query>", "label": "<short refinement> (<core term from original query>)"}]`,
  },
};

// ----------------------------------------------------------------
// Prompt rendering (template interpolation)
// ----------------------------------------------------------------

function renderPrompt(template, variables) {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return rendered;
}

function formatResultsForPrompt(products) {
  return products
    .map((p, i) => {
      const parts = [`${i + 1}. "${p.name}" - $${p.price?.toFixed(2) || '?'}`];
      if (p.originalPrice && p.originalPrice > p.price) {
        parts.push(`(was $${p.originalPrice.toFixed(2)})`);
      }
      if (p.seller) parts.push(`from ${p.seller}`);
      if (p.rating) parts.push(`${p.rating}/5 stars`);
      if (p.reviewCount) parts.push(`(${p.reviewCount} reviews)`);
      if (p.description) parts.push(`— ${p.description.slice(0, 100)}`);
      if (p.outOfStock) parts.push('[OUT OF STOCK]');
      return parts.join(' ');
    })
    .join('\n');
}

// ----------------------------------------------------------------
// LLM API call (OpenAI-compatible — works with SF AI Model Gateway)
// ----------------------------------------------------------------

// Default: Salesforce AI Model Gateway (OpenAI-compatible endpoint)
export const DEFAULT_LLM_GATEWAY = 'https://eng-ai-model-gateway.sfproxy.devx-preprod.aws-esvc1-useast2.aws.sfdc.cl/v1/chat/completions';
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

async function callLLM(prompt, config = {}) {
  const {
    apiKey,
    apiUrl = DEFAULT_LLM_GATEWAY,
    model = DEFAULT_LLM_MODEL,
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
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ----------------------------------------------------------------
// Local heuristic fallback (no LLM)
// ----------------------------------------------------------------

function localExplanation(query, products) {
  const count = products.length;
  const prices = products.filter((p) => p.price).map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const onSale = products.filter((p) => p.originalPrice && p.originalPrice > p.price);
  const sources = [...new Set(products.map((p) => p.seller).filter(Boolean))];

  let sentence1 = `I found ${count} product${count !== 1 ? 's' : ''} matching "${query}".`;
  let sentence2 = prices.length > 1
    ? `Prices range from $${minPrice.toFixed(2)} to $${maxPrice.toFixed(2)}.`
    : prices.length === 1
    ? `Priced at $${prices[0].toFixed(2)}.`
    : `Check individual listings for pricing details.`;
  let sentence3 = onSale.length > 0
    ? `${onSale.length} item${onSale.length !== 1 ? 's are' : ' is'} currently on sale — great time to buy!`
    : sources.length > 0
    ? `Available from ${sources.slice(0, 3).join(', ')}${sources.length > 3 ? ' and others' : ''}.`
    : `Scroll through the options to find your perfect match.`;

  return `${sentence1} ${sentence2} ${sentence3}`;
}

function localBestPick(query, products) {
  // Simple heuristic: prefer in-stock, on-sale, highest rated, cheapest
  const scored = products
    .filter((p) => !p.outOfStock)
    .map((p) => {
      let score = 0;
      if (p.originalPrice && p.originalPrice > p.price) score += 3; // on sale
      if (p.rating) score += p.rating; // rating contributes directly
      if (p.reviewCount && p.reviewCount > 100) score += 2;
      // Penalise very expensive items slightly
      if (p.price > 200) score -= 1;
      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { product: products[0], reason: 'This is the top result for your search.' };
  }

  const best = scored[0].product;
  const reasons = [];
  if (best.originalPrice && best.originalPrice > best.price) {
    const pct = Math.round((1 - best.price / best.originalPrice) * 100);
    reasons.push(`${pct}% off`);
  }
  if (best.rating) reasons.push(`rated ${best.rating}/5`);
  if (best.reviewCount) reasons.push(`${best.reviewCount} reviews`);

  const reason = reasons.length > 0
    ? `Best value — ${reasons.join(', ')}.`
    : `Top match for "${query}" at a great price.`;

  return { product: best, reason };
}

/**
 * Extract a short "core" noun from the original query to use as the
 * parenthetical context.  e.g. "I want running shoes" → "running shoes"
 */
function extractCoreNoun(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !REFORMULATION_STRIP.has(w))
    .join(' ')
    || query;
}

const REFORMULATION_STRIP = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'some', 'any', 'to', 'for',
  'want', 'need', 'looking', 'buy', 'purchase', 'get', 'find', 'show',
  'search', 'shop', 'can', 'you', 'do', 'have', 'got', 'am', 'im',
  "i'm", 'please', 'recommend', 'suggest', 'of', 'with', 'and', 'or',
]);

function localReformulations(query, products) {
  const core = extractCoreNoun(query);
  const reformulations = [];

  // Price-based
  const prices = products.filter((p) => p.price).map((p) => p.price);
  if (prices.length > 0) {
    const median = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    reformulations.push({
      query: `${core} under $${Math.ceil(median)}`,
      label: `Under $${Math.ceil(median)} (${core})`,
    });
  }

  // Brand / seller based
  const sellers = [...new Set(products.map((p) => p.seller).filter(Boolean))];
  if (sellers.length > 0) {
    reformulations.push({
      query: `${sellers[0]} ${core}`,
      label: `${sellers[0]} (${core})`,
    });
  }

  // Feature-based (from product names)
  const adjectives = ['premium', 'lightweight', 'wireless', 'waterproof', 'professional'];
  const usedAdj = adjectives.find((adj) =>
    products.some((p) => p.name.toLowerCase().includes(adj) || (p.description || '').toLowerCase().includes(adj))
  );
  if (usedAdj) {
    const cap = usedAdj.charAt(0).toUpperCase() + usedAdj.slice(1);
    reformulations.push({
      query: `${usedAdj} ${core}`,
      label: `${cap} (${core})`,
    });
  }

  // On sale
  if (products.some((p) => p.originalPrice && p.originalPrice > p.price)) {
    reformulations.push({ query: `${core} on sale`, label: `On sale (${core})` });
  }

  // Top rated
  if (products.some((p) => p.rating && p.rating >= 4)) {
    reformulations.push({ query: `best rated ${core}`, label: `Top rated (${core})` });
  }

  // Generic refinements as filler
  const fillers = [
    { query: `best ${core} 2024`, label: `Best of 2024 (${core})` },
    { query: `${core} for beginners`, label: `For beginners (${core})` },
    { query: `${core} gift`, label: `As a gift (${core})` },
  ];

  while (reformulations.length < 5) {
    const filler = fillers.shift();
    if (filler) reformulations.push(filler);
    else break;
  }

  return reformulations.slice(0, 5);
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Process search results through the prompt engine.
 *
 * @param {string} query - Original user query
 * @param {object[]} products - Search results
 * @param {object} prompts - Custom prompt templates (falls back to defaults)
 * @param {object} llmConfig - { apiKey?, apiUrl?, model? }
 * @returns {Promise<{ explanation: string, bestPick: { product, reason }, reformulations: array }>}
 */
export async function processSearchResults(query, products, prompts = {}, llmConfig = {}) {
  const mergedPrompts = {
    explanation: prompts.explanation || DEFAULT_PROMPTS.explanation.template,
    bestPick: prompts.bestPick || DEFAULT_PROMPTS.bestPick.template,
    reformulations: prompts.reformulations || DEFAULT_PROMPTS.reformulations.template,
  };

  const resultsText = formatResultsForPrompt(products);
  const variables = { query, results: resultsText };

  const useLLM = !!llmConfig.apiKey;

  if (!useLLM) {
    // Fast path: no LLM, use local heuristics (instant)
    return {
      explanation: localExplanation(query, products),
      bestPick: localBestPick(query, products),
      reformulations: localReformulations(query, products),
    };
  }

  // --- Explanation first (shows as text bubble immediately) ---
  let explanation;
  try {
    const prompt = renderPrompt(mergedPrompts.explanation, variables);
    explanation = await callLLM(prompt, llmConfig);
  } catch (err) {
    console.warn('[PromptEngine] LLM explanation failed:', err.message);
    explanation = localExplanation(query, products);
  }

  // --- Best Pick + Reformulations in parallel ---
  const [bestPick, reformulations] = await Promise.all([
    (async () => {
      try {
        const prompt = renderPrompt(mergedPrompts.bestPick, variables);
        const raw = await callLLM(prompt, llmConfig);
        let jsonStr = raw;
        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
        const parsed = JSON.parse(jsonStr);
        const idx = parsed.index;
        if (idx >= 0 && idx < products.length) {
          return { product: products[idx], reason: parsed.reason };
        }
        return localBestPick(query, products);
      } catch (err) {
        console.warn('[PromptEngine] LLM best pick failed:', err.message);
        return localBestPick(query, products);
      }
    })(),

    (async () => {
      try {
        const prompt = renderPrompt(mergedPrompts.reformulations, variables);
        const raw = await callLLM(prompt, llmConfig);
        let jsonStr = raw;
        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
        const result = JSON.parse(jsonStr);
        if (!Array.isArray(result)) throw new Error('Not an array');
        return result;
      } catch (err) {
        console.warn('[PromptEngine] LLM reformulations failed:', err.message);
        return localReformulations(query, products);
      }
    })(),
  ]);

  return { explanation, bestPick, reformulations };
}

/**
 * Validate that a prompt template contains required variables.
 */
export function validatePrompt(template, requiredVars = ['query', 'results']) {
  const missing = requiredVars.filter((v) => !template.includes(`{{${v}}}`));
  if (missing.length > 0) {
    return { valid: false, error: `Missing required variables: ${missing.map((v) => `{{${v}}}`).join(', ')}` };
  }
  return { valid: true, error: null };
}
