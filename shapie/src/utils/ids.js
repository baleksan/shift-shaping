/**
 * Simple UUID generator.
 *
 * Produces v4-style random UUIDs using crypto.getRandomValues when
 * available, falling back to Math.random.
 */

export function generateId() {
  // Use crypto API if available (browser & modern Node)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: manual v4 UUID construction
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
