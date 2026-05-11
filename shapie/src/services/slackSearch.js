/**
 * Slack User Search
 *
 * Calls the local dev proxy which forwards to the MCP Slack server.
 * Returns structured user objects from the corporate Slack directory.
 */

let debounceTimer = null;

/**
 * Search Slack users by name, email, or title.
 * Debounced — only fires after the user stops typing for 250ms.
 *
 * @param {string} query - Search text (min 2 chars)
 * @returns {Promise<Array<{name: string, userId: string, email: string, title: string}>>}
 */
export function searchSlackUsers(query) {
  return new Promise((resolve, reject) => {
    clearTimeout(debounceTimer);
    if (!query || query.trim().length < 2) {
      return resolve([]);
    }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slack/search-users?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error(`Slack search failed (${res.status})`);
        const data = await res.json();
        resolve(data.users || []);
      } catch (err) {
        console.error('[slackSearch]', err);
        reject(err);
      }
    }, 250);
  });
}
