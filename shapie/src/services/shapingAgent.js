/**
 * Shaping Agent
 *
 * AI collaborator that helps humans refine product shapes using Shape Up methodology.
 * The agent is opinionated — it pushes back on scope creep, identifies rabbit holes,
 * asks clarifying questions, and helps hammer scope into something that fits the appetite.
 */

import { callLLM } from './llmClient.js';

// ----------------------------------------------------------------
// System Prompt
// ----------------------------------------------------------------

/**
 * System prompt establishing the agent as a Shape Up methodology expert.
 * Uses template variables that get rendered with actual shape data.
 *
 * Template variables:
 *   {{shapeName}}  - Name of the shape being discussed
 *   {{problem}}    - The problem statement
 *   {{appetite}}   - small_batch (1-2 weeks) or big_batch (6 weeks)
 *   {{scope}}      - Current scope items / solution sketch
 *   {{boundaries}} - Known boundaries, constraints, and no-gos
 */
export const SHAPING_SYSTEM_PROMPT = `You are an expert Shape Up methodology collaborator. You help product teams shape work before it goes to builders.

## Your Role
You are working on a shape called "{{shapeName}}".

**Problem:** {{problem}}

**Appetite:** {{appetite}}
{{#if appetite === 'small_batch'}}This is a Small Batch (1-2 weeks of builder time). Keep scope tight.{{/if}}
{{#if appetite === 'big_batch'}}This is a Big Batch (up to 6 weeks of builder time). There's room, but don't let scope inflate.{{/if}}

**Current Scope:**
{{scope}}

**Boundaries & No-Gos:**
{{boundaries}}

## Your Principles

1. **Appetite is fixed.** The time budget is non-negotiable. If something doesn't fit, cut scope — never extend the timeline.
2. **Be opinionated.** Push back on scope creep. If the user suggests something that smells too big, say so directly.
3. **Identify rabbit holes.** Flag technical or design risks that could eat the whole appetite. Ask "what if this takes 3x longer than expected?"
4. **Hammer the scope.** Help cut away the non-essential. A good shape solves the core problem with the minimum viable surface area.
5. **Ask clarifying questions.** Don't assume you know the answer. Probe for edge cases, user expectations, and existing constraints.
6. **Think about boundaries.** What is explicitly OUT of scope? What are the no-gos? Help the user define what they are NOT building.
7. **Keep it concrete.** Prefer sketches of solution direction over abstract architecture. Use "fat marker" thinking — broad strokes, not wireframe-level detail.

## Conversation Style

- Be direct and concise. No fluff.
- Use bullet points for lists of concerns or suggestions.
- When you spot a rabbit hole, call it out explicitly: "Rabbit hole alert: ..."
- When scope is creeping, say: "That's scope creep. Here's why: ..."
- End responses with a clear next question or action when appropriate.
- Reference Shape Up concepts by name (appetite, rabbit holes, scope hammering, fat marker sketch, boundaries, no-gos, hill chart) so the team builds shared vocabulary.`;

// ----------------------------------------------------------------
// Prompt Builder
// ----------------------------------------------------------------

/**
 * Render the system prompt with actual shape data.
 *
 * @param {object} shape - The shape object
 * @param {string} shape.name - Shape name
 * @param {string} shape.problem - Problem statement
 * @param {string} shape.appetite - 'small_batch' or 'big_batch'
 * @param {string|string[]} [shape.scope] - Scope items
 * @param {string|string[]} [shape.boundaries] - Boundaries and no-gos
 * @returns {string} Rendered system prompt
 */
export function buildSystemPrompt(shape) {
  const {
    name = 'Untitled Shape',
    problem = 'No problem statement yet.',
    appetite = 'small_batch',
    scope = 'Not yet defined.',
    boundaries = 'Not yet defined.',
  } = shape;

  // Format scope — accept string or array
  const scopeText = Array.isArray(scope)
    ? scope.map((s) => `- ${s}`).join('\n')
    : scope;

  // Format boundaries — accept string or array
  const boundariesText = Array.isArray(boundaries)
    ? boundaries.map((b) => `- ${b}`).join('\n')
    : boundaries;

  // Simple template rendering
  let rendered = SHAPING_SYSTEM_PROMPT;
  rendered = rendered.replace(/\{\{shapeName\}\}/g, name);
  rendered = rendered.replace(/\{\{problem\}\}/g, problem);
  rendered = rendered.replace(/\{\{appetite\}\}/g, appetite);
  rendered = rendered.replace(/\{\{scope\}\}/g, scopeText);
  rendered = rendered.replace(/\{\{boundaries\}\}/g, boundariesText);

  // Handle conditional blocks (simple approach — remove unmatched conditionals)
  if (appetite === 'small_batch') {
    rendered = rendered.replace(/\{\{#if appetite === 'small_batch'\}\}(.*?)\{\{\/if\}\}/gs, '$1');
    rendered = rendered.replace(/\{\{#if appetite === 'big_batch'\}\}(.*?)\{\{\/if\}\}/gs, '');
  } else {
    rendered = rendered.replace(/\{\{#if appetite === 'big_batch'\}\}(.*?)\{\{\/if\}\}/gs, '$1');
    rendered = rendered.replace(/\{\{#if appetite === 'small_batch'\}\}(.*?)\{\{\/if\}\}/gs, '');
  }

  return rendered;
}

// ----------------------------------------------------------------
// Send Message
// ----------------------------------------------------------------

/**
 * Send a message to the shaping agent and get a response.
 *
 * @param {string} userMessage - The user's latest message
 * @param {Array<{role: string, content: string}>} conversationHistory - Prior messages (user + assistant turns)
 * @param {object} shape - The shape being discussed (for system prompt context)
 * @param {object} config - LLM config { apiKey, apiUrl, model, temperature, maxTokens }
 * @returns {Promise<string>} The agent's response
 */
export async function sendShapingMessage(userMessage, conversationHistory = [], shape = {}, config = {}) {
  // Build the full messages array: system + history + new user message
  const systemPrompt = buildSystemPrompt(shape);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  return callLLM(messages, {
    temperature: 0.7,
    maxTokens: 1500,
    ...config,
  });
}
