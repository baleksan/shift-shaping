/**
 * Relative time formatting utility.
 *
 * Converts a timestamp (ISO string or Date) into a human-friendly
 * relative label like "2 hours ago" or "just now".
 */

// ----------------------------------------------------------------
// Time thresholds (in seconds)
// ----------------------------------------------------------------

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;   // ~30 days
const YEAR = 31536000;   // ~365 days

// ----------------------------------------------------------------
// Formatter
// ----------------------------------------------------------------

/**
 * Returns a human-readable relative time string.
 *
 * @param {string|Date|number} timestamp - ISO string, Date object, or epoch ms
 * @returns {string} e.g. "just now", "5 minutes ago", "2 days ago"
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = Date.now();
  const seconds = Math.floor((now - date.getTime()) / 1000);

  // Future dates (clock skew)
  if (seconds < 0) return 'just now';

  if (seconds < 30) return 'just now';
  if (seconds < MINUTE) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / MINUTE);
  if (minutes === 1) return '1 minute ago';
  if (minutes < HOUR / MINUTE) return `${minutes} minutes ago`;

  const hours = Math.floor(seconds / HOUR);
  if (hours === 1) return '1 hour ago';
  if (hours < DAY / HOUR) return `${hours} hours ago`;

  const days = Math.floor(seconds / DAY);
  if (days === 1) return 'yesterday';
  if (days < WEEK / DAY) return `${days} days ago`;

  const weeks = Math.floor(seconds / WEEK);
  if (weeks === 1) return '1 week ago';
  if (weeks < 4) return `${weeks} weeks ago`;

  const months = Math.floor(seconds / MONTH);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;

  const years = Math.floor(seconds / YEAR);
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}
