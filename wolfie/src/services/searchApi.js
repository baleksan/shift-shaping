/**
 * Search API Service
 *
 * Abstracts product search. Currently supports:
 *   - Cimulate Search API — fast, real product catalog search (cephora, nto)
 *   - AI Product Search — LLM-generated product results (fallback)
 *
 * The returned shape is normalised so downstream components don't care
 * which backend produced the results.
 */

import { DEFAULT_LLM_GATEWAY, DEFAULT_LLM_MODEL } from './promptEngine';

// ----------------------------------------------------------------
// Normalised product shape (what we return regardless of source)
// ----------------------------------------------------------------
// {
//   id: string,
//   name: string,
//   description: string,
//   price: number,
//   originalPrice?: number,
//   currencyCode: string,
//   imageUrl: string,
//   source: 'cimulate' | 'llm',
//   link?: string,
//   seller?: string,           // brand name
//   rating?: number,           // 0-5 stars
//   reviewCount?: number,
//   features?: string[],
//   variants?: array,
//   tags?: string[],
//   outOfStock?: boolean,
// }

// ----------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------

const CIMULATE_API_URL = 'https://api.demo.search.cimulate.ai/api/v1/search';
const CIMULATE_API_KEY = 'b268b30c-303e-14cd-61d9-b6af971a45d2';

/**
 * Available catalogs for the Cimulate search provider.
 */
export const CATALOGS = [
  { id: 'cephora', name: 'Cephora (beauty & skincare)' },
  { id: 'nto', name: 'NTO (outdoor & apparel)' },
];

/**
 * Available search providers for the settings UI.
 */
export const SEARCH_PROVIDERS = [
  { id: 'cimulate', name: 'Catalog Search (Cimulate)' },
  { id: 'llm', name: 'AI Product Search (LLM gateway)' },
];

// ----------------------------------------------------------------
// Cimulate Search API
// ----------------------------------------------------------------

/**
 * Search products via the Cimulate API.
 *
 * @param {string} query - User search query
 * @param {object} config - { catalog, maxResults }
 * @returns {Promise<object[]>} normalised products
 */
async function searchCimulate(query, config = {}) {
  const { catalog = 'cephora', maxResults = 8 } = config;

  const response = await fetch(CIMULATE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cimulate-api-key': CIMULATE_API_KEY,
      'x-cimulate-customer-id': catalog,
    },
    body: JSON.stringify({
      query,
      page_size: maxResults,
      include_facets: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Cimulate API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Cimulate error: ${data.error}`);
  }

  const hits = data.hits || [];
  return hits.map((hit) => normalizeCimulateHit(hit));
}

function normalizeCimulateHit(hit) {
  const price = hit.price_numeric || 0;

  // Build variants array from Cimulate variant data
  const variants = (hit.variants || []).map((v) => ({
    skuId: v.skuId,
    name: v.variantName,
    imageUrl: v.primary_image_url,
    isDefault: v.is_default_variant,
  }));

  return {
    id: hit.product_id || `cim-${Date.now()}`,
    name: hit.product_name || 'Unknown Product',
    description: hit.quick_look_description || hit.short_description || '',
    price,
    originalPrice: hit.on_markdown ? Math.round(price * 1.2 * 100) / 100 : undefined,
    currencyCode: 'USD',
    imageUrl: hit.primary_image_url || 'https://via.placeholder.com/400x300?text=No+Image',
    source: 'cimulate',
    link: hit.product_url || '',
    seller: hit.brand_name || '',
    rating: hit.rating ? Math.round(hit.rating * 10) / 10 : undefined,
    reviewCount: hit.review_count || undefined,
    features: hit.highlights || [],
    variants,
    tags: hit.tags || [],
    outOfStock: hit.is_out_of_stock || false,
    isNew: hit.is_new || false,
    isLimitedEdition: hit.is_limited_edition || false,
    lovesCount: hit.loves_count || undefined,
    category: hit.category_hierarchy || '',
    size: hit.size || '',
  };
}

// ----------------------------------------------------------------
// LLM-Powered Product Search (fallback)
// ----------------------------------------------------------------

const PRODUCT_SEARCH_PROMPT = `You are a product search engine. Generate realistic shopping results for the query below.

Query: "{{query}}"

Generate exactly {{num}} product results that would appear on Google Shopping for this query.
Each product must be realistic — use real brand names, realistic prices, and believable product descriptions.

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {
    "name": "Full product name with brand",
    "description": "One-sentence product description",
    "price": 79.99,
    "originalPrice": 99.99,
    "seller": "Store name (e.g. Amazon, Nike, Walmart, Target, REI)",
    "rating": 4.5,
    "reviewCount": 1234,
    "features": ["feature1", "feature2"]
  }
]

Rules:
- Prices must be realistic USD amounts
- originalPrice should only be set if the item is on sale (about 30% of items should be on sale)
- rating should be 3.0-5.0
- reviewCount should be realistic (10-50000)
- seller should be a real retailer
- features should be 2-3 short attributes
- Include a mix of price points (budget, mid-range, premium)
- Make 1-2 items slightly out of stock for realism`;

async function searchViaLLM(query, config = {}) {
  const { maxResults = 8, llmApiKey, llmApiUrl, llmModel } = config;

  if (!llmApiKey || !llmApiKey.startsWith('sk-')) {
    throw new Error('LLM API key not configured or invalid (must start with sk-)');
  }

  const prompt = PRODUCT_SEARCH_PROMPT
    .replace('{{query}}', query)
    .replace('{{num}}', String(maxResults));

  const apiUrl = llmApiUrl || DEFAULT_LLM_GATEWAY;
  const model = llmModel || DEFAULT_LLM_MODEL;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${llmApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM search error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '[]';

  // Parse JSON from response (handle markdown code blocks if present)
  let jsonStr = content;
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  const products = JSON.parse(jsonStr);

  if (!Array.isArray(products)) {
    throw new Error('LLM did not return an array');
  }

  return products.map((p, idx) => ({
    id: `llm-${Date.now()}-${idx}`,
    name: p.name || 'Unknown Product',
    description: p.description || '',
    price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || 0,
    originalPrice: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : undefined,
    currencyCode: 'USD',
    imageUrl: `https://picsum.photos/seed/${Math.abs(hashCode(p.name + idx))}/400/400`,
    source: 'llm',
    link: '',
    seller: p.seller || '',
    rating: p.rating || undefined,
    reviewCount: p.reviewCount || undefined,
    features: p.features || [],
    outOfStock: p.outOfStock || false,
    tags: (p.name || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2),
  }));
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Search for products. Routes to the configured provider.
 *
 * @param {string} query - Natural language search query
 * @param {object} config - { provider?, catalog?, llmApiKey?, llmApiUrl?, llmModel?, maxResults? }
 * @returns {Promise<{ products: object[], source: string }>}
 */
export async function searchProducts(query, config = {}) {
  const { provider = 'cimulate', catalog, llmApiKey, llmApiUrl, llmModel, maxResults = 8 } = config;

  // Cimulate catalog search (default)
  if (provider === 'cimulate') {
    try {
      const products = await searchCimulate(query, { catalog, maxResults });
      if (products.length > 0) {
        return { products, source: 'cimulate' };
      }
      console.warn('[SearchAPI] Cimulate returned 0 results');
    } catch (err) {
      console.error('[SearchAPI] Cimulate search failed:', err.message);
    }
  }

  // LLM-powered search
  if (provider === 'llm' || provider === 'cimulate') {
    try {
      const products = await searchViaLLM(query, { maxResults, llmApiKey, llmApiUrl, llmModel });
      if (products.length > 0) {
        return { products, source: 'llm' };
      }
    } catch (err) {
      console.error('[SearchAPI] LLM search failed:', err.message);
    }
  }

  return { products: [], source: 'none' };
}
