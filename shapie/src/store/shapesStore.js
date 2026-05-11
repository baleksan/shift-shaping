/**
 * Shapes Store
 *
 * localStorage CRUD for shapes — the core domain objects in Shapie.
 * Each shape represents a product idea moving through the Shape Up
 * pipeline from raw idea to shipped.
 */

import { generateId } from '../utils/ids';
import { defaultShapeTemplate } from '../data/templates';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const STORAGE_KEY = 'shapie_shapes';

// ----------------------------------------------------------------
// Low-level persistence
// ----------------------------------------------------------------

/**
 * Load all shapes from localStorage.
 * @returns {object[]} Array of shape objects (empty array if none stored).
 */
export function loadShapes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[shapesStore] Failed to load shapes:', err);
    return [];
  }
}

/**
 * Persist the full shapes array to localStorage.
 * @param {object[]} shapes
 */
export function saveShapes(shapes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shapes));
  } catch (err) {
    console.error('[shapesStore] Failed to save shapes:', err);
  }
}

// ----------------------------------------------------------------
// CRUD operations
// ----------------------------------------------------------------

/**
 * Create a new shape with sensible defaults.
 * Accepts partial overrides — anything not provided uses the template.
 *
 * @param {object} overrides - Partial shape fields to set.
 * @returns {object} The newly created shape (already persisted).
 */
export function createShape(overrides = {}) {
  const now = new Date().toISOString();
  const shape = {
    ...defaultShapeTemplate(),
    ...overrides,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };

  const shapes = loadShapes();
  shapes.push(shape);
  saveShapes(shapes);

  return shape;
}

/**
 * Update an existing shape by id.
 * Merges provided fields into the existing shape and bumps updatedAt.
 *
 * @param {string} id - Shape id to update.
 * @param {object} updates - Fields to merge.
 * @returns {object|null} Updated shape, or null if not found.
 */
export function updateShape(id, updates) {
  const shapes = loadShapes();
  const idx = shapes.findIndex((s) => s.id === id);

  if (idx === -1) {
    console.warn('[shapesStore] Shape not found:', id);
    return null;
  }

  shapes[idx] = {
    ...shapes[idx],
    ...updates,
    id, // prevent id override
    updatedAt: new Date().toISOString(),
  };

  saveShapes(shapes);
  return shapes[idx];
}

/**
 * Delete a shape by id.
 *
 * @param {string} id - Shape id to remove.
 * @returns {boolean} True if shape was found and deleted.
 */
export function deleteShape(id) {
  const shapes = loadShapes();
  const filtered = shapes.filter((s) => s.id !== id);

  if (filtered.length === shapes.length) {
    console.warn('[shapesStore] Shape not found for deletion:', id);
    return false;
  }

  saveShapes(filtered);
  return true;
}

/**
 * Get a single shape by id.
 *
 * @param {string} id
 * @returns {object|null} The shape, or null if not found.
 */
export function getShape(id) {
  const shapes = loadShapes();
  return shapes.find((s) => s.id === id) || null;
}
