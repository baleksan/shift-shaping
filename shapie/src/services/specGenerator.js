/**
 * Spec Generator
 *
 * Generates Claude-spec-format reports from a shape and its shaping sessions.
 * The output is a structured markdown document that can be handed to builders
 * as a complete brief — covering problem, solution, scope, risks, and session insights.
 */

import { callLLM } from './llmClient.js';

// ----------------------------------------------------------------
// System Prompt for Spec Generation
// ----------------------------------------------------------------

export const SPEC_GENERATION_PROMPT = `You are a technical writer generating a structured spec from a Shape Up shaping session.

You will receive:
1. A shape definition (name, problem, appetite, scope, boundaries)
2. Session transcripts (conversations between the shaper and the AI collaborator)
3. Key decisions made during shaping

Your job is to synthesize all of this into a clear, actionable spec that a builder can pick up and run with.

## Output Format

Generate a markdown document with EXACTLY this structure:

# [Shape Name]

## Appetite
[small_batch | big_batch] — state the time budget clearly.

## Problem
Write an enriched problem statement. Go beyond the raw input — incorporate insights from the sessions that clarified the problem. 2-4 sentences.

## Solution
### Sketch
Describe the solution direction in broad strokes. This is a fat-marker sketch, not a detailed spec. Focus on the core flow and key interactions.

### Boundaries
List what is explicitly IN scope and what constrains the solution.

## Scope
Break the solution into concrete, checkable pieces of work. Each piece should be independently shippable or at least independently verifiable.

## Rabbit Holes
List identified risks — technical unknowns, design questions, integration concerns — that could blow up the timeline. For each, note any mitigation discussed in sessions.

## No-Gos
List things that are explicitly OUT of scope. Be direct: "We are NOT building X."

## Implementation Guidance
### Architecture
Summarize any technical decisions, patterns, or constraints discussed in sessions.

### Key Files
If sessions mentioned specific files, modules, or components to create or modify, list them here.

## Session Insights
Summarize the most important decisions with brief rationale. Use format:
- **Decision:** [what was decided] — *Rationale:* [why]

## Raw Session Log
Wrap the full transcript in a collapsible details block.

## Rules
- Be concise. Builders want signal, not noise.
- Use bullet points liberally.
- If something was discussed but not resolved, flag it as an open question.
- Preserve the shaper's voice and intent — don't over-interpret.
- For scope items, use checkbox format: "- [ ] item"`;

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Format session messages into a readable transcript.
 */
function formatSessionTranscript(sessions) {
  if (!sessions || sessions.length === 0) {
    return '_No sessions recorded._';
  }

  return sessions
    .map((session, idx) => {
      const header = `### Session ${idx + 1}${session.title ? ` — ${session.title}` : ''}`;
      const messages = (session.messages || [])
        .map((msg) => {
          const role = msg.role === 'user' ? '**Shaper**' : '**Agent**';
          return `${role}: ${msg.content}`;
        })
        .join('\n\n');
      return `${header}\n\n${messages}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Build the user prompt containing all shape data and session content.
 */
function buildGenerationPrompt(shape, sessions) {
  const {
    name = 'Untitled Shape',
    problem = 'Not defined.',
    appetite = 'small_batch',
    scope = [],
    boundaries = [],
    noGos = [],
    rabbitHoles = [],
  } = shape;

  // Format arrays or strings
  const formatList = (items) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return '_None defined._';
    if (Array.isArray(items)) return items.map((i) => `- ${i}`).join('\n');
    return items;
  };

  const transcript = formatSessionTranscript(sessions);

  // Extract decisions from sessions (messages tagged as decisions, or all assistant messages)
  const decisions = [];
  if (sessions) {
    for (const session of sessions) {
      for (const msg of session.messages || []) {
        if (msg.isDecision || msg.decision) {
          decisions.push(msg.content || msg.decision);
        }
      }
    }
  }

  const decisionsText = decisions.length > 0
    ? decisions.map((d) => `- ${d}`).join('\n')
    : '_No explicit decisions tagged._';

  return `## Shape Definition

**Name:** ${name}
**Appetite:** ${appetite}

**Problem:**
${problem}

**Current Scope:**
${formatList(scope)}

**Boundaries:**
${formatList(boundaries)}

**No-Gos:**
${formatList(noGos)}

**Known Rabbit Holes:**
${formatList(rabbitHoles)}

## Session Transcripts

${transcript}

## Tagged Decisions

${decisionsText}

---

Now generate the full spec in the format described in your system prompt.`;
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

/**
 * Generate a structured spec from a shape and its sessions.
 *
 * @param {object} shape - The shape object with name, problem, appetite, scope, boundaries, etc.
 * @param {Array<{title?: string, messages: Array<{role: string, content: string, isDecision?: boolean}>}>} sessions - Shaping sessions
 * @param {object} config - LLM config { apiKey, apiUrl, model, temperature, maxTokens }
 * @returns {Promise<string>} Generated markdown spec
 */
export async function generateSpec(shape, sessions = [], config = {}) {
  const userPrompt = buildGenerationPrompt(shape, sessions);

  const messages = [
    { role: 'system', content: SPEC_GENERATION_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const spec = await callLLM(messages, {
    temperature: 0.3, // Lower temperature for more structured output
    maxTokens: 4096, // Specs can be long
    ...config,
  });

  return spec;
}
