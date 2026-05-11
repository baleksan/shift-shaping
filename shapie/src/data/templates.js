/**
 * Templates for shapes and the shaping-agent prompts.
 *
 * The default shape template provides empty structure for all fields.
 * The system prompt drives the LLM shaping collaborator that helps
 * users refine scope, identify rabbit holes, and push back on creep.
 */

// ----------------------------------------------------------------
// Default shape template
// ----------------------------------------------------------------

/**
 * Returns a fresh shape object with all fields initialized to defaults.
 * Caller must supply `id` and `createdAt`.
 */
export function defaultShapeTemplate() {
  return {
    id: null,
    name: '',
    description: '',
    appetite: 'small_batch', // 'small_batch' (1-2 weeks) or 'big_batch' (6 weeks)
    status: 'raw_idea',
    problem: '',
    solution: {
      sketch: '',        // rough concept — words, not wireframes
      boundaries: '',    // what's in scope
      rabbitHoles: '',   // known risks and complexity traps
      noGos: '',         // explicitly out of scope
    },
    scope: [],           // array of { id, title, done }
    sessions: [],        // array of session ids linked to this shape
    createdAt: null,
    updatedAt: null,
    report: null,        // generated spec/pitch document (markdown)
  };
}

// ----------------------------------------------------------------
// Shaping agent system prompt
// ----------------------------------------------------------------

export const SHAPING_AGENT_SYSTEM_PROMPT = `You are Shapie, a Shape Up methodology collaborator.

Your role is to help the user shape product ideas into well-defined pitches ready for the betting table. You follow the Shape Up framework by Ryan Singer (Basecamp).

## How you help

1. **Clarify the problem** — Ask "what's the pain?" before jumping to solutions.
2. **Set appetite** — Push the user to commit: is this a Small Batch (1-2 weeks) or Big Batch (6 weeks)?
3. **Sketch the solution** — Help describe the approach at the right level of abstraction (fat-marker sketch, not wireframes).
4. **Define boundaries** — What's in, what's out? Keep scope tight.
5. **Identify rabbit holes** — Surface complexity traps, unknowns, and technical risks early.
6. **Enforce no-gos** — When the user tries to sneak in extras, push back respectfully.

## Principles

- Prefer words over pictures. Solutions are described in prose.
- Fixed time, variable scope. The appetite is a hard constraint.
- Shaped work is rough — leave room for the builders to figure out details.
- If an idea is too vague, it stays a raw idea. Don't force it.
- Be direct. If something smells like scope creep, say so.

## Output style

- Conversational and concise (2-4 sentences typical).
- Use markdown for structure when helpful (bullet lists, bold for emphasis).
- When you have enough information, offer to generate a summary or pitch spec.
`;

// ----------------------------------------------------------------
// Spec generation prompt template
// ----------------------------------------------------------------

/**
 * Template for generating a full Shape Up pitch/spec document from a shape.
 * Interpolate shape fields before sending to the LLM.
 */
export const SPEC_GENERATION_PROMPT = `Generate a Shape Up pitch document for the following shaped idea.

## Shape details

**Name:** {{name}}
**Appetite:** {{appetite}}
**Problem:** {{problem}}

**Solution sketch:** {{sketch}}
**Boundaries:** {{boundaries}}
**Rabbit holes:** {{rabbitHoles}}
**No-gos:** {{noGos}}

**Scope items:**
{{scope}}

## Instructions

Write a clear, concise pitch document in markdown with these sections:

1. **Problem** — What's the pain and why it matters now.
2. **Appetite** — Time budget and what that implies for scope.
3. **Solution** — The core approach described in prose (fat-marker level).
4. **Rabbit Holes** — Risks called out with mitigation notes.
5. **No-Gos** — Things explicitly excluded to protect the appetite.
6. **Scope** — Ordered list of work chunks a team can check off.

Keep it to one page. Be direct — this goes on the betting table.
`;
