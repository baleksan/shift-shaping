/**
 * Wolfie Config Bridge
 *
 * Reads the Wolfie config from the Wolfie tab's localStorage.
 * Since Wolfie runs on a different port (different origin), we can't
 * read its localStorage directly. Instead we open an invisible iframe
 * to the Wolfie origin and use postMessage to request the config.
 *
 * Fallback: if Wolfie is unreachable, returns null.
 */

const WOLFIE_STORAGE_KEY = 'shopperAgentConfig';

/**
 * Fetch Wolfie's current config from its running instance.
 * Uses an iframe + postMessage to read localStorage cross-origin.
 *
 * @param {number} port - Wolfie port (default 3099)
 * @param {number} timeout - Max wait in ms (default 3000)
 * @param {object} [options]
 * @param {boolean} [options.fresh=false] - Skip proxy cache and always
 *   read directly from Wolfie's localStorage via iframe bridge. Use this
 *   when you need the latest config (e.g. after the user edits prompts).
 * @returns {Promise<object|null>} Wolfie config or null
 */
export async function fetchWolfieConfig(port = 3099, timeout = 3000, { fresh = false } = {}) {
  const wolfieOrigin = `http://localhost:${port}`;

  // When fresh is requested, skip the server-side cache entirely
  if (fresh) {
    return fetchViaIframe(wolfieOrigin, timeout);
  }

  return new Promise((resolve) => {
    // Try fetching from our proxy cache first
    fetch('/api/wolfie/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.config) {
          resolve(data.config);
        } else {
          // Fall back to iframe approach
          resolve(fetchViaIframe(wolfieOrigin, timeout));
        }
      })
      .catch(() => resolve(fetchViaIframe(wolfieOrigin, timeout)));
  });
}

function fetchViaIframe(wolfieOrigin, timeout) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeout);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${wolfieOrigin}/__shapie_bridge.html`;

    function handleMessage(event) {
      if (event.origin !== wolfieOrigin) return;
      if (event.data?.type === 'wolfie-config') {
        clearTimeout(timer);
        cleanup();
        // Cache it on the server for spec generation
        fetch('/api/wolfie/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event.data.config),
        }).catch(() => {});
        resolve(event.data.config);
      }
    }

    function cleanup() {
      window.removeEventListener('message', handleMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }

    window.addEventListener('message', handleMessage);
    document.body.appendChild(iframe);

    // If the bridge HTML doesn't exist, try reading directly
    // (works if Wolfie is on the same origin during dev)
    iframe.onerror = () => {
      clearTimeout(timer);
      cleanup();
      tryDirectRead(wolfieOrigin, resolve);
    };
  });
}

function tryDirectRead(wolfieOrigin, resolve) {
  // Last resort: try fetching Wolfie's index and checking if same origin
  try {
    const raw = localStorage.getItem(WOLFIE_STORAGE_KEY);
    if (raw) {
      resolve(JSON.parse(raw));
      return;
    }
  } catch {
    // Different origin, can't read
  }
  resolve(null);
}

/**
 * Default Wolfie prompts — used as fallback if we can't reach Wolfie.
 */
export const DEFAULT_WOLFIE_PROMPTS = {
  explanation: `You are a helpful shopping assistant. The user searched for: "{{query}}"

Here are the search results:
{{results}}

Write exactly 3 sentences explaining what you found. Be specific about the products, mention price ranges, and highlight anything noteworthy (deals, popular brands, variety). Keep it friendly and concise. Do NOT use bullet points or lists — just 3 flowing sentences.`,

  bestPick: `You are a shopping expert. The user asked for: "{{query}}"

Here are the available products:
{{results}}

Pick the SINGLE best product for this query. Consider:
- Relevance to what the user asked for
- Value for money (price vs features)
- Ratings and reviews if available
- Availability (skip out-of-stock items)

Respond with ONLY a JSON object (no markdown, no explanation):
{"index": <0-based index of best product>, "reason": "<one sentence why this is the best pick>"}`,

  reformulations: `You are a search query optimizer for a shopping assistant. The user originally searched for: "{{query}}"

Here are the results they got:
{{results}}

Generate 4-5 alternative search queries that would help the user narrow down or refine their search. Consider:
- More specific variants (size, color, brand, price range)
- Related but different product categories
- Common refinements shoppers use

Respond with ONLY a JSON array of objects (no markdown):
[{"query": "<refined search query>", "label": "<short refinement> (<core term from original query>)"}]`,
};
