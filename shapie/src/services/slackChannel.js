/**
 * Slack Channel Service
 *
 * Helps create and link Slack channels for shaping sessions.
 * Since the MCP Slack plugin doesn't support channel creation,
 * we generate a channel name, open Slack's channel creation page,
 * then once the user confirms, we find the channel and post an
 * intro message tagging all participants.
 */

/**
 * Generate a Slack-friendly channel name from a shape name.
 * Lowercase, hyphens, no special chars, prefixed with "shapie-".
 *
 * @param {string} shapeName
 * @returns {string}
 */
export function generateChannelName(shapeName) {
  const slug = (shapeName || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `shapie-${slug}`;
}

/**
 * Build the Slack deep link URL to create a new channel.
 * Opens the Slack app to the "create channel" modal.
 *
 * @param {string} channelName - Suggested channel name
 * @returns {string} slack:// URL
 */
export function getSlackCreateUrl(channelName) {
  // Slack doesn't have a direct "create channel with name" deep link,
  // so we link to the workspace with the channel browse page
  return `https://slack.com/get-started#/createnew`;
}

/**
 * Search for a channel by name to verify it exists.
 *
 * @param {string} channelName
 * @returns {Promise<{name: string, channelId: string}|null>}
 */
export async function findChannel(channelName) {
  try {
    const res = await fetch(`/api/slack/search-channels?q=${encodeURIComponent(channelName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    // Find exact match
    const match = (data.channels || []).find(
      (ch) => ch.name === channelName || ch.name === channelName.replace(/^#/, '')
    );
    return match || null;
  } catch (err) {
    console.error('[slackChannel] Find channel error:', err);
    return null;
  }
}

/**
 * Send a message to a Slack channel.
 *
 * @param {string} channelId
 * @param {string} message - Markdown message
 * @returns {Promise<boolean>}
 */
export async function sendChannelMessage(channelId, message) {
  try {
    const res = await fetch('/api/slack/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, message }),
    });
    return res.ok;
  } catch (err) {
    console.error('[slackChannel] Send message error:', err);
    return false;
  }
}

/**
 * Build the intro message for a shape's Slack channel.
 *
 * @param {object} shape - The shape object
 * @param {Array<{name: string, userId: string, role: string}>} participants
 * @returns {string} Markdown message
 */
export function buildIntroMessage(shape, participants) {
  const mentions = participants
    .filter((p) => p.userId)
    .map((p) => `<@${p.userId}>`)
    .join(' ');

  const participantList = participants
    .map((p) => {
      const mention = p.userId ? `<@${p.userId}>` : p.name;
      const role = p.role ? ` _(${p.role})_` : '';
      return `- ${mention}${role}`;
    })
    .join('\n');

  return `**Shape Up: ${shape.name || 'Untitled'}**

This channel was created for shaping **${shape.name || 'Untitled'}**.

**Problem:**
> ${shape.problem || '_No problem statement yet._'}

**Participants:**
${participantList}

${mentions ? `\nHeads up ${mentions} — let's shape this!` : ''}

_Created by Shapie_`;
}
