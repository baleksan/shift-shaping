/**
 * Sessions Store
 *
 * localStorage CRUD for shaping sessions — conversations between
 * the user and the shaping agent about a particular shape.
 */

import { generateId } from '../utils/ids';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const STORAGE_KEY = 'shapie_sessions';

// ----------------------------------------------------------------
// Low-level persistence
// ----------------------------------------------------------------

/**
 * Load all sessions from localStorage.
 * @returns {object[]} Array of session objects.
 */
export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[sessionsStore] Failed to load sessions:', err);
    return [];
  }
}

/**
 * Persist the full sessions array to localStorage.
 * @param {object[]} sessions
 */
export function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('[sessionsStore] Failed to save sessions:', err);
  }
}

// ----------------------------------------------------------------
// CRUD operations
// ----------------------------------------------------------------

/**
 * Create a new shaping session linked to a shape.
 *
 * @param {string} shapeId - The shape this session belongs to.
 * @param {string} [title] - Optional title (defaults to "Shaping session").
 * @returns {object} The newly created session (already persisted).
 */
export function createSession(shapeId, title = 'Shaping session') {
  const now = new Date().toISOString();
  const session = {
    id: generateId(),
    shapeId,
    title,
    status: 'active', // active | paused | completed
    messages: [],
    notes: '',
    decisions: [],
    startedAt: now,
    endedAt: null,
  };

  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);

  return session;
}

/**
 * Update an existing session by id.
 *
 * @param {string} id - Session id.
 * @param {object} updates - Fields to merge.
 * @returns {object|null} Updated session, or null if not found.
 */
export function updateSession(id, updates) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === id);

  if (idx === -1) {
    console.warn('[sessionsStore] Session not found:', id);
    return null;
  }

  sessions[idx] = {
    ...sessions[idx],
    ...updates,
    id, // prevent id override
  };

  saveSessions(sessions);
  return sessions[idx];
}

/**
 * Get a single session by id.
 *
 * @param {string} id
 * @returns {object|null}
 */
export function getSession(id) {
  const sessions = loadSessions();
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Get all sessions belonging to a specific shape.
 *
 * @param {string} shapeId
 * @returns {object[]} Sessions for that shape, newest first.
 */
export function getSessionsForShape(shapeId) {
  const sessions = loadSessions();
  return sessions
    .filter((s) => s.shapeId === shapeId)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

/**
 * Append a message to a session's message history.
 *
 * @param {string} sessionId - Session to append to.
 * @param {object} message - { role, content, annotation? }
 * @returns {object|null} The full message object (with id/timestamp), or null on failure.
 */
export function addMessage(sessionId, message) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);

  if (idx === -1) {
    console.warn('[sessionsStore] Session not found for message:', sessionId);
    return null;
  }

  const fullMessage = {
    id: generateId(),
    role: message.role,       // 'user' | 'assistant'
    content: message.content,
    timestamp: new Date().toISOString(),
    annotation: message.annotation || null,
  };

  sessions[idx].messages.push(fullMessage);
  saveSessions(sessions);

  return fullMessage;
}
