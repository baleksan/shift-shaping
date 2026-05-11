/**
 * Shape Up workflow statuses.
 *
 * Shapes move through a linear pipeline from raw idea to shipped.
 * Each status defines its visual treatment and the set of valid
 * transitions it can move to.
 */

// ----------------------------------------------------------------
// Status definitions
// ----------------------------------------------------------------

export const statuses = [
  {
    id: 'raw_idea',
    label: 'Raw Idea',
    color: '#94a3b8',   // slate gray
    emoji: '💡',
    description: 'An unshaped idea or request that needs investigation.',
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    color: '#3b82f6',   // blue
    emoji: '🔵',
    description: 'Actively being shaped — defining problem, solution, and boundaries.',
  },
  {
    id: 'under_review',
    label: 'Under Review',
    color: '#f59e0b',   // amber
    emoji: '🔍',
    description: 'Shape is complete and being reviewed by stakeholders.',
  },
  {
    id: 'completed',
    label: 'Completed',
    color: '#22c55e',   // green
    emoji: '✅',
    description: 'Shaping is done — ready for betting or building.',
  },
];

// ----------------------------------------------------------------
// Lookup map (id → status object)
// ----------------------------------------------------------------

export const statusMap = Object.fromEntries(
  statuses.map((s) => [s.id, s])
);

// ----------------------------------------------------------------
// Valid transitions
// ----------------------------------------------------------------

/**
 * Maps each status id to the set of statuses it can transition to.
 * Movement is mostly forward, but shaped items can return to raw_idea
 * if they need more work, and betting items can go back to shaped.
 */
export const transitions = {
  raw_idea: ['in_progress'],
  in_progress: ['raw_idea', 'under_review'],
  under_review: ['in_progress', 'completed'],
  completed: [],
};

/**
 * Returns true if moving from `fromId` to `toId` is a valid transition.
 */
export function canTransition(fromId, toId) {
  return (transitions[fromId] || []).includes(toId);
}
