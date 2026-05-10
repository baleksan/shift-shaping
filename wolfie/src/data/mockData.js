/**
 * Product catalog and conversation logic for the Shopper Agent prototype.
 *
 * Each product carries `tags` — lowercase keywords used for simple
 * search matching against user messages.
 */

export const productCatalog = [
  {
    id: 'prod-001',
    name: 'Classic Running Shoes',
    description: 'Lightweight and breathable running shoes with premium cushioning for all-day comfort.',
    price: 89.99,
    originalPrice: 119.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=300&fit=crop',
    ],
    features: [
      'Breathable mesh upper',
      'Responsive cushioning technology',
      'Durable rubber outsole',
      'Available in 6 colors',
    ],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Red', isColor: true, color: '#e53e3e' },
          { value: 'Blue', isColor: true, color: '#3182ce' },
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'White', isColor: true, color: '#f7fafc', disabled: true },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        options: [
          { value: '8' },
          { value: '9' },
          { value: '10' },
          { value: '11' },
          { value: '12', disabled: true },
        ],
      },
    ],
    tags: ['shoes', 'running', 'run', 'sneakers', 'workout', 'exercise', 'fitness', 'footwear', 'sport', 'athletic'],
  },
  {
    id: 'prod-002',
    name: 'Urban Backpack Pro',
    description: 'Water-resistant backpack with laptop compartment and ergonomic straps.',
    price: 64.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
    features: ['15" laptop sleeve', 'Water-resistant material', 'Padded shoulder straps'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Navy', isColor: true, color: '#2c5282' },
          { value: 'Charcoal', isColor: true, color: '#4a5568' },
          { value: 'Olive', isColor: true, color: '#556b2f' },
        ],
      },
    ],
    tags: ['backpack', 'bag', 'laptop', 'travel', 'school', 'urban', 'carry', 'accessories'],
  },
  {
    id: 'prod-003',
    name: 'Wireless Earbuds Ultra',
    description: 'Active noise cancelling earbuds with 30-hour battery life.',
    price: 149.99,
    originalPrice: 199.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12f8e4e12?w=400&h=300&fit=crop',
    features: ['Active noise cancelling', '30-hour battery', 'IPX5 water resistance'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'White', isColor: true, color: '#f7fafc' },
        ],
      },
    ],
    tags: ['earbuds', 'headphones', 'wireless', 'audio', 'music', 'bluetooth', 'electronics', 'tech'],
  },
  {
    id: 'prod-004',
    name: 'Premium Watch Band',
    description: 'Genuine Italian leather watch strap compatible with all standard sizes.',
    price: 39.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop',
    outOfStock: true,
    tags: ['watch', 'band', 'strap', 'leather', 'accessories', 'wrist', 'fashion'],
  },
  {
    id: 'prod-005',
    name: 'Performance Yoga Mat',
    description: 'Extra-thick non-slip yoga mat with alignment markers. Perfect for yoga and floor exercises.',
    price: 45.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=300&fit=crop',
    features: ['6mm thick cushioning', 'Non-slip surface', 'Alignment markers', 'Carrying strap included'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Purple', isColor: true, color: '#805ad5' },
          { value: 'Teal', isColor: true, color: '#319795' },
          { value: 'Black', isColor: true, color: '#1a1a1a' },
        ],
      },
    ],
    tags: ['yoga', 'mat', 'fitness', 'exercise', 'workout', 'gym', 'stretch', 'pilates'],
  },
  {
    id: 'prod-006',
    name: 'Stainless Steel Water Bottle',
    description: 'Double-wall insulated bottle that keeps drinks cold 24hrs or hot 12hrs.',
    price: 29.99,
    originalPrice: 34.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop',
    features: ['Double-wall vacuum insulation', 'BPA-free', '32oz capacity', 'Leak-proof lid'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Silver', isColor: true, color: '#cbd5e0' },
          { value: 'Matte Black', isColor: true, color: '#2d3748' },
          { value: 'Rose Gold', isColor: true, color: '#e8a598' },
        ],
      },
    ],
    tags: ['bottle', 'water', 'drink', 'hydration', 'gym', 'fitness', 'workout', 'accessories'],
  },
  {
    id: 'prod-007',
    name: 'Compression Running Socks',
    description: 'Moisture-wicking compression socks designed for long-distance runners.',
    price: 18.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=300&fit=crop',
    features: ['Graduated compression', 'Moisture-wicking', 'Blister prevention pads', 'Arch support'],
    variants: [
      {
        id: 'size',
        label: 'Size',
        options: [
          { value: 'S' },
          { value: 'M' },
          { value: 'L' },
          { value: 'XL' },
        ],
      },
    ],
    tags: ['socks', 'running', 'run', 'compression', 'workout', 'fitness', 'footwear', 'athletic'],
  },
  {
    id: 'prod-008',
    name: 'Lightweight Training Jacket',
    description: 'Windproof and water-repellent jacket with reflective details for outdoor training.',
    price: 79.99,
    originalPrice: 99.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop',
    features: ['Windproof fabric', 'Water-repellent coating', 'Reflective details', 'Packable design'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'Navy', isColor: true, color: '#2c5282' },
          { value: 'Neon Green', isColor: true, color: '#68d391' },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        options: [
          { value: 'S' },
          { value: 'M' },
          { value: 'L' },
          { value: 'XL' },
        ],
      },
    ],
    tags: ['jacket', 'coat', 'training', 'running', 'run', 'workout', 'outdoor', 'clothes', 'clothing', 'apparel', 'wear'],
  },
  {
    id: 'prod-009',
    name: 'Smart Fitness Tracker',
    description: 'Track steps, heart rate, sleep, and workouts with a 7-day battery life.',
    price: 59.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=300&fit=crop',
    features: ['Heart rate monitor', '7-day battery life', 'Sleep tracking', 'Water resistant to 50m'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'White', isColor: true, color: '#f7fafc' },
          { value: 'Blue', isColor: true, color: '#3182ce' },
        ],
      },
    ],
    tags: ['tracker', 'fitness', 'watch', 'smart', 'health', 'heart', 'workout', 'exercise', 'tech', 'electronics', 'wearable'],
  },
  {
    id: 'prod-010',
    name: 'Adjustable Dumbbell Set',
    description: 'Space-saving adjustable dumbbells from 5-50 lbs with quick-change weight system.',
    price: 249.99,
    originalPrice: 299.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=300&fit=crop',
    features: ['5-50 lbs per dumbbell', 'Quick-change selector', 'Compact storage tray', 'Ergonomic grip'],
    tags: ['dumbbell', 'dumbbells', 'weights', 'weight', 'gym', 'fitness', 'workout', 'exercise', 'strength', 'training', 'lift'],
  },
  {
    id: 'prod-011',
    name: 'Polarized Sport Sunglasses',
    description: 'UV400 polarized lenses with lightweight wraparound frame for active lifestyles.',
    price: 34.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop',
    features: ['UV400 protection', 'Polarized lenses', 'Lightweight frame', 'Anti-slip nose pads'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'Blue', isColor: true, color: '#3182ce' },
          { value: 'Red', isColor: true, color: '#e53e3e' },
        ],
      },
    ],
    tags: ['sunglasses', 'glasses', 'shades', 'sport', 'outdoor', 'accessories', 'fashion', 'uv'],
  },
  {
    id: 'prod-012',
    name: 'Cotton Crew T-Shirt',
    description: 'Super-soft 100% organic cotton tee with a relaxed fit.',
    price: 24.99,
    currencyCode: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
    features: ['100% organic cotton', 'Pre-shrunk', 'Relaxed fit', 'Tagless neck label'],
    variants: [
      {
        id: 'color',
        label: 'Color',
        options: [
          { value: 'White', isColor: true, color: '#f7fafc' },
          { value: 'Black', isColor: true, color: '#1a1a1a' },
          { value: 'Heather Grey', isColor: true, color: '#a0aec0' },
          { value: 'Navy', isColor: true, color: '#2c5282' },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        options: [
          { value: 'S' },
          { value: 'M' },
          { value: 'L' },
          { value: 'XL' },
          { value: 'XXL' },
        ],
      },
    ],
    tags: ['tshirt', 'shirt', 't-shirt', 'tee', 'top', 'cotton', 'clothes', 'clothing', 'apparel', 'wear', 'casual'],
  },
];

// ----------------------------------------------------------------
// Intent detection & product search
// ----------------------------------------------------------------

/**
 * Phrases that signal a product-search intent.
 * Each entry is tested as a case-insensitive prefix / substring.
 */
const SEARCH_INTENT_PATTERNS = [
  /^(i\s+want|i\s+need|i'm\s+looking\s+for|i\s+am\s+looking\s+for|looking\s+for)/i,
  /^(buy|purchase|get\s+me|find\s+me|find|show\s+me|search\s+for|search|shop\s+for|shop)/i,
  /^(can\s+you\s+(show|find|get|recommend))/i,
  /^(do\s+you\s+have|got\s+any|have\s+any)/i,
  /^(recommend|suggest)/i,
];

/**
 * Returns true when the message looks like a product search request.
 */
export function isProductSearchRequest(text) {
  const trimmed = text.trim();
  return SEARCH_INTENT_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Tokenise & strip common stop-words so "I want some running shoes" becomes
 * ["running", "shoes"].
 */
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'a', 'an', 'the', 'some', 'any', 'to', 'for',
  'want', 'need', 'looking', 'buy', 'purchase', 'get', 'find', 'show',
  'search', 'shop', 'can', 'you', 'do', 'have', 'got', 'am', 'im',
  "i'm", 'please', 'recommend', 'suggest', 'of', 'with', 'and', 'or',
  'good', 'nice', 'great', 'best', 'new',
]);

function extractSearchTerms(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Search the catalog. Returns products sorted by relevance (number of tag
 * matches), best first. If nothing matches the terms, returns a random
 * selection so the user always sees something.
 */
export function searchProducts(query, maxResults = 6) {
  const terms = extractSearchTerms(query);

  if (terms.length === 0) {
    // No meaningful keywords — return a curated selection
    return shuffled(productCatalog).slice(0, maxResults);
  }

  // Score each product: how many search terms hit its tag list or name
  const scored = productCatalog.map((product) => {
    const haystack = [
      ...product.tags,
      ...product.name.toLowerCase().split(/\s+/),
      ...product.description.toLowerCase().split(/\s+/),
    ];
    const score = terms.reduce((s, term) => {
      // Check for exact match or substring match in tags
      const hit = haystack.some(
        (h) => h === term || h.includes(term) || term.includes(h)
      );
      return s + (hit ? 1 : 0);
    }, 0);
    return { product, score };
  });

  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.product)
    .slice(0, maxResults);

  // Fallback: if no tags matched, return random products
  if (matches.length === 0) {
    return shuffled(productCatalog).slice(0, Math.min(4, maxResults));
  }

  return matches;
}

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build suggested-action pills based on what the user searched for.
 */
export function buildSuggestedActions(query) {
  const terms = extractSearchTerms(query);

  // Generic refinement suggestions
  const refinements = [
    { displayValue: 'Under $50', utterance: 'Show me products under $50' },
    { displayValue: 'On sale', utterance: 'Show me items on sale' },
    { displayValue: 'Best sellers', utterance: 'Show me best sellers' },
  ];

  // Category-aware suggestions
  const categoryMap = {
    shoes: [
      { displayValue: 'Running shoes', utterance: 'I want running shoes' },
      { displayValue: 'Sneakers', utterance: 'Show me sneakers' },
    ],
    fitness: [
      { displayValue: 'Gym equipment', utterance: 'I want gym equipment' },
      { displayValue: 'Yoga gear', utterance: 'I am looking for yoga gear' },
    ],
    clothing: [
      { displayValue: 'Jackets', utterance: 'Show me jackets' },
      { displayValue: 'T-shirts', utterance: 'I want t-shirts' },
    ],
    electronics: [
      { displayValue: 'Earbuds', utterance: 'Buy earbuds' },
      { displayValue: 'Fitness trackers', utterance: 'I want a fitness tracker' },
    ],
  };

  // Pick contextual suggestions based on search terms
  let contextual = [];
  for (const [category, suggestions] of Object.entries(categoryMap)) {
    if (terms.some((t) => category.includes(t) || t.includes(category))) {
      contextual = suggestions;
      break;
    }
  }

  const options = [...contextual, ...refinements].slice(0, 5);

  return [
    {
      description: 'Want to narrow it down?',
      options,
      multiSelect: false,
    },
  ];
}

// ----------------------------------------------------------------
// Initial conversation (just a welcome — user drives from here)
// ----------------------------------------------------------------

export const initialConversation = [
  {
    id: 1,
    sender: 'Agent',
    type: 'text',
    content:
      "Hi there! Welcome to our store. I'm your shopping assistant. Try asking me for products — for example:\n\n" +
      '**\"I want running shoes\"**\n' +
      '**\"Buy a jacket\"**\n' +
      '**\"I\'m looking for earbuds\"**',
  },
];
