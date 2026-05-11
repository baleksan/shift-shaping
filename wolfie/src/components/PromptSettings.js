import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DEFAULT_PROMPTS, validatePrompt, GATEWAY_MODELS, DEFAULT_LLM_GATEWAY, DEFAULT_LLM_MODEL } from '../services/promptEngine';
import { SEARCH_PROVIDERS, CATALOGS } from '../services/searchApi';

// ----------------------------------------------------------------
// CSS Variables the LLM can modify (extracted from :root in styles.css)
// ----------------------------------------------------------------
const CSS_VARIABLE_DEFINITIONS = {
  '--color-background': { label: 'Page background', default: '#f5f5f5' },
  '--color-surface': { label: 'Card / panel surface', default: '#ffffff' },
  '--color-agent-bubble': { label: 'Agent message bubble', default: '#f7f9fa' },
  '--color-agent-border': { label: 'Agent bubble border', default: '#d9dfe7' },
  '--color-agent-text': { label: 'Agent text color', default: '#444444' },
  '--color-user-bubble': { label: 'User message bubble', default: '#d7e3f3' },
  '--color-user-text': { label: 'User text color', default: '#444444' },
  '--color-primary': { label: 'Primary / accent color', default: '#1c1c1c' },
  '--color-primary-contrast': { label: 'Primary contrast text', default: '#ffffff' },
  '--color-destructive': { label: 'Destructive / danger', default: '#c23934' },
  '--color-neutral-1': { label: 'Neutral border', default: '#e2e2e2' },
  '--color-neutral-3': { label: 'Neutral dark', default: '#666666' },
  '--color-text-secondary': { label: 'Secondary text', default: '#706e6b' },
  '--color-success': { label: 'Success green', default: '#2e844a' },
  '--radius-sm': { label: 'Small border radius', default: '0.25rem' },
  '--radius-md': { label: 'Medium border radius', default: '0.5rem' },
  '--radius-lg': { label: 'Large border radius', default: '0.75rem' },
  '--radius-pill': { label: 'Pill border radius', default: '999px' },
  '--font-family': { label: 'Font family', default: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
};

// ----------------------------------------------------------------
// CSS class names in the app — reference for the LLM so it can
// write targeted CSS rules (not just variable overrides)
// ----------------------------------------------------------------
const CSS_CLASS_REFERENCE = `
Key CSS selectors available in this app (use these to write targeted rules):

LAYOUT:
  .widget-container          — outer wrapper for the whole chat widget
  .widget-window             — the main card (white background, rounded corners)

HEADER:
  .commerce-header           — top bar with logo, title, buttons
  .header-title              — the "Shopper Agent" title text
  .wolfie-button             — the Wolfie mascot icon button

MESSAGES:
  .messages-container        — scrollable message area
  .message-wrapper           — wrapper per message row; has class .Agent or .EndUser
  .message-bubble            — individual chat bubble; has class .Agent or .EndUser
  .message-bubble.Agent      — agent / bot bubbles (left side)
  .message-bubble.EndUser    — user bubbles (right side)

PRODUCT CARDS / CAROUSEL:
  .product-recommendations   — wrapper for the whole recommendation block
  .products-description      — text shown ABOVE the product carousel (e.g. "Results from …")
  .product-carousel-container — carousel outer container
  .product-carousel          — scrollable row of product cards
  .product-card              — single product card in the carousel
  .product-card.best-pick    — card marked as "best pick" (gold border)
  .product-card-image-container — image area of a product card
  .product-card-image        — the <img> element
  .product-card-info         — text area of a product card
  .product-card-name         — product name text
  .product-card-description  — product description text
  .product-card-price        — price row
  .best-pick-badge           — the "Best Pick" pill label
  .best-pick-reason          — italic reason text below best-pick

SUGGESTED ACTIONS:
  .suggested-actions          — block below the carousel with refinement pills
  .suggested-actions-description — "Narrow your search:" label
  .suggested-action-button   — individual pill button

PRODUCT DETAILS (PDP):
  .product-details           — detail view wrapper
  .pdp-title                 — product title
  .pdp-pricing               — price area
  .pdp-description           — product description
  .pdp-features              — feature list (<ul>)
  .add-to-cart-button        — the "Add to Cart" button

CART:
  .cart-summary              — cart summary block
  .cart-summary-title        — "Your Cart" title
  .cart-item                 — single cart line item
  .cart-item-name            — item name in cart
  .checkout-button           — "Proceed to Checkout"

INPUT:
  .input-container           — bottom input bar
  .message-input             — the text input field
  .send-button               — the send button
`.trim();

/**
 * Read the current computed CSS variable values from :root.
 */
function getCurrentCSSVariables() {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const current = {};
  for (const [varName, def] of Object.entries(CSS_VARIABLE_DEFINITIONS)) {
    current[varName] = style.getPropertyValue(varName).trim() || def.default;
  }
  return current;
}

/**
 * Apply a set of CSS variable overrides to :root.
 */
function applyCSSVariables(overrides) {
  const root = document.documentElement;
  for (const [varName, value] of Object.entries(overrides)) {
    if (CSS_VARIABLE_DEFINITIONS[varName]) {
      root.style.setProperty(varName, value);
    }
  }
}

/**
 * Remove all CSS variable overrides from :root (back to stylesheet defaults).
 */
function resetCSSVariables() {
  const root = document.documentElement;
  for (const varName of Object.keys(CSS_VARIABLE_DEFINITIONS)) {
    root.style.removeProperty(varName);
  }
}

// ----------------------------------------------------------------
// Dynamic <style> injection — lets the LLM add arbitrary CSS rules
// ----------------------------------------------------------------

const DYNAMIC_STYLE_ID = 'wolfie-ui-customizations';
const GENERATED_STYLE_ID = 'wolfie-ui-generated';

/**
 * Inject (or replace) a dynamic <style> block with custom CSS rules (tweaks).
 */
function applyCustomCSS(cssText) {
  let styleEl = document.getElementById(DYNAMIC_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = DYNAMIC_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText;
}

/**
 * Remove the tweak <style> block entirely.
 */
function removeCustomCSS() {
  const styleEl = document.getElementById(DYNAMIC_STYLE_ID);
  if (styleEl) styleEl.remove();
}

/**
 * Inject (or replace) a generated full-UI <style> block.
 */
function applyGeneratedCSS(cssText) {
  let styleEl = document.getElementById(GENERATED_STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = GENERATED_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssText;
}

/**
 * Remove the generated full-UI <style> block.
 */
function removeGeneratedCSS() {
  const styleEl = document.getElementById(GENERATED_STYLE_ID);
  if (styleEl) styleEl.remove();
}

/**
 * Activate a UI mode: "original", "tweaked", or "generated".
 * Only the CSS for the active mode is applied in the DOM.
 */
function activateMode(mode, cfg) {
  // Always clean up everything first
  resetCSSVariables();
  removeCustomCSS();
  removeGeneratedCSS();

  if (mode === 'tweaked') {
    if (cfg.uiCustomizations && Object.keys(cfg.uiCustomizations).length > 0) {
      applyCSSVariables(cfg.uiCustomizations);
    }
    if (cfg.uiCustomCSS) {
      applyCustomCSS(cfg.uiCustomCSS);
    }
  } else if (mode === 'generated') {
    if (cfg.uiGeneratedCSS) {
      applyGeneratedCSS(cfg.uiGeneratedCSS);
    }
  }
  // "original" — everything already cleaned up
}

/**
 * Build the system prompt for the UI-change LLM call.
 */
function buildUIChangePrompt(userRequest, currentVars, existingCustomCSS) {
  const varList = Object.entries(currentVars)
    .map(([name, value]) => `  ${name}: ${value}  /* ${CSS_VARIABLE_DEFINITIONS[name]?.label || ''} */`)
    .join('\n');

  const existingSection = existingCustomCSS
    ? `\nCurrently active custom CSS rules:\n\`\`\`css\n${existingCustomCSS}\n\`\`\`\n`
    : '';

  return `You are a UI designer assistant for a chat-widget-style shopping app called "Wolfie". The user wants to change the UI appearance.

You have TWO tools:
1. **CSS custom properties** (design tokens) — change colors, radii, font globally.
2. **Custom CSS rules** — target specific elements by class name to change font-weight, font-size, borders, shadows, transforms, animations, and anything else CSS can do.

Current CSS custom properties (design tokens):
${varList}

${CSS_CLASS_REFERENCE}
${existingSection}
The user's request: "${userRequest}"

Your job:
1. Decide which CSS variables to change AND/OR which CSS rules to write.
2. Return a JSON response with three keys:
   - "changes": an object mapping CSS variable names to new values (only include variables you're changing, omit if none)
   - "cssRules": a string containing any additional CSS rules to inject (use the class names above). These REPLACE any existing custom rules. If you're adding to existing rules, include the old ones too. Omit this key if no rules are needed.
   - "summary": a short 1-2 sentence human-friendly description of what you changed

Rules:
- For "changes": only change variables from the CSS custom properties list above.
- For "cssRules": write valid CSS using the class selectors listed above. Keep rules concise.
- Use valid CSS values (colors as hex #rrggbb, sizes as rem, etc.).
- For "dark mode" requests, ensure text remains readable against backgrounds (contrast).
- For color theme requests, maintain visual harmony — adjust multiple related variables.
- Be creative but practical. The UI should remain usable.
- If the request only needs CSS rules (e.g. "make text bold"), you don't need to include "changes".
- If the request only needs variable changes (e.g. "darker background"), you don't need "cssRules".

Respond with ONLY the JSON object (no markdown fences, no explanation outside the JSON):
{"changes": {"--color-background": "#..."}, "cssRules": ".message-bubble.Agent { font-weight: bold; }", "summary": "Made agent text bold and darkened background"}`;
}

/**
 * Call the LLM to get UI change instructions.
 */
async function callUIChangeLLM(userRequest, currentVars, existingCustomCSS, llmConfig) {
  const { apiKey, apiUrl = DEFAULT_LLM_GATEWAY, model = DEFAULT_LLM_MODEL } = llmConfig;

  if (!apiKey) {
    throw new Error('Please configure an LLM API key in the LLM tab first.');
  }

  const prompt = buildUIChangePrompt(userRequest, currentVars, existingCustomCSS);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  // Parse JSON (handle potential markdown fences)
  let jsonStr = content;
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  if (!parsed.changes && !parsed.cssRules) {
    throw new Error('LLM did not return "changes" or "cssRules".');
  }

  // Normalise: ensure both keys exist
  return {
    changes: parsed.changes || {},
    cssRules: parsed.cssRules || '',
    summary: parsed.summary || 'Done!',
  };
}

/**
 * Build the system prompt for generating a completely new UI.
 */
function buildUICreatePrompt(userRequest, existingGeneratedCSS) {
  const varList = Object.entries(CSS_VARIABLE_DEFINITIONS)
    .map(([name, def]) => `  ${name}: ${def.default}  /* ${def.label} */`)
    .join('\n');

  const existingSection = existingGeneratedCSS
    ? `\nThe user previously generated this custom UI. They want to refine it. Here is the current generated stylesheet:\n\`\`\`css\n${existingGeneratedCSS}\n\`\`\`\nApply their requested changes and return the COMPLETE updated stylesheet.\n`
    : '';

  return `You are a creative UI designer. The user wants you to generate a COMPLETELY NEW visual design for a chat-widget-style shopping app called "Wolfie".

You must produce a comprehensive CSS stylesheet that completely transforms the UI appearance. This is NOT a small tweak — you are redesigning the entire look and feel.

Default CSS custom properties (override any of these in a :root block at the top of your stylesheet):
${varList}

${CSS_CLASS_REFERENCE}
${existingSection}
The user's design request: "${userRequest}"

Your job: Generate a COMPLETE CSS stylesheet that:
1. Starts with a \`:root { ... }\` block overriding CSS custom properties for the new theme
2. Includes rules for ALL major UI sections: header, messages, product cards, input area, cart, buttons
3. Transforms colors, typography, spacing, shadows, borders, and any animations/transitions
4. Ensures text remains readable (good contrast ratios)
5. Maintains usability — buttons are clickable, text is legible, layout is functional
6. Is creative and ambitious — make it look genuinely different from the default

Return ONLY a JSON object (no markdown fences):
{"css": "...the complete CSS stylesheet...", "name": "Short Theme Name", "summary": "1-2 sentence description of the design"}

Keep the CSS under 5000 characters. Be comprehensive but concise — use shorthand properties where possible.`;
}

/**
 * Call the LLM to generate a complete new UI stylesheet.
 */
async function callUICreateLLM(userRequest, existingGeneratedCSS, llmConfig) {
  const { apiKey, apiUrl = DEFAULT_LLM_GATEWAY, model = DEFAULT_LLM_MODEL } = llmConfig;

  if (!apiKey) {
    throw new Error('Please configure an LLM API key in the LLM tab first.');
  }

  const prompt = buildUICreatePrompt(userRequest, existingGeneratedCSS);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || '';

  // Parse JSON (handle potential markdown fences)
  let jsonStr = content;
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  const parsed = JSON.parse(jsonStr);
  if (!parsed.css) {
    throw new Error('LLM did not return a "css" stylesheet.');
  }

  // Basic validation: check for unbalanced braces
  const opens = (parsed.css.match(/\{/g) || []).length;
  const closes = (parsed.css.match(/\}/g) || []).length;
  if (opens !== closes) {
    throw new Error('Generated CSS appears truncated (unbalanced braces). Try a simpler design request.');
  }

  return {
    css: parsed.css,
    name: parsed.name || 'Custom Theme',
    summary: parsed.summary || 'New UI applied!',
  };
}

/**
 * PromptSettings — a slide-out panel that lets users customize:
 *   1. Search API configuration (provider, API key)
 *   2. LLM configuration (API key, model, endpoint)
 *   3. All three prompt templates (explanation, bestPick, reformulations)
 *   4. Change UI — chat with an LLM to modify the UI appearance in real time
 */
export default function PromptSettings({ config, onConfigChange, onClose }) {
  const [activeTab, setActiveTab] = useState('prompts');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [validationError, setValidationError] = useState(null);

  // --- UI mode ---
  // "original" | "tweaked" | "generated"
  const inferMode = () => {
    if (config.uiMode) return config.uiMode;
    if (config.uiGeneratedCSS) return 'generated';
    if ((config.uiCustomizations && Object.keys(config.uiCustomizations).length > 0) || config.uiCustomCSS) return 'tweaked';
    return 'original';
  };
  const [uiMode, setUiMode] = useState(inferMode);

  // Sub-view within the Change UI tab: "tweak" or "create"
  const [uiSubView, setUiSubView] = useState(uiMode === 'generated' ? 'create' : 'tweak');

  // --- Change UI (tweak) state ---
  const [uiChatMessages, setUiChatMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your UI designer. Tell me how you'd like to change the look of this app. For example:\n\n- \"Make it dark mode\"\n- \"Use a warm orange theme\"\n- \"Make the bubbles rounder\"\n- \"Use a sleek modern look with blue accents\"",
    },
  ]);
  const [uiChatInput, setUiChatInput] = useState('');
  const [uiChatLoading, setUiChatLoading] = useState(false);
  const uiChatEndRef = useRef(null);

  // --- Create New UI state ---
  const [uiCreateMessages, setUiCreateMessages] = useState([
    {
      role: 'assistant',
      content: "I'll create a completely new UI design for you! Describe the look and feel you're going for. Be creative:\n\n- \"Cyberpunk neon with dark background and glowing accents\"\n- \"Soft pastel minimalist with rounded everything\"\n- \"Retro 90s vaporwave aesthetic\"\n- \"Premium luxury dark theme like a high-end fashion site\"",
    },
  ]);
  const [uiCreateInput, setUiCreateInput] = useState('');
  const [uiCreateLoading, setUiCreateLoading] = useState(false);
  const uiCreateEndRef = useRef(null);

  useEffect(() => {
    uiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiChatMessages]);

  useEffect(() => {
    uiCreateEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uiCreateMessages]);

  // Apply saved UI on mount based on mode
  useEffect(() => {
    const mode = inferMode();
    activateMode(mode, config);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch UI mode
  const handleModeChange = useCallback((mode) => {
    setUiMode(mode);
    activateMode(mode, config);
    onConfigChange({ ...config, uiMode: mode });
  }, [config, onConfigChange]);

  const handleUIChangeRequest = useCallback(async () => {
    const text = uiChatInput.trim();
    if (!text || uiChatLoading) return;

    setUiChatInput('');
    setUiChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setUiChatLoading(true);

    try {
      const currentVars = getCurrentCSSVariables();
      const existingCustomCSS = config.uiCustomCSS || '';
      const llmConfig = {
        apiKey: config.llmApiKey,
        apiUrl: config.llmApiUrl || undefined,
        model: config.llmModel || DEFAULT_LLM_MODEL,
      };

      const result = await callUIChangeLLM(text, currentVars, existingCustomCSS, llmConfig);

      // Apply CSS variable changes
      if (result.changes && Object.keys(result.changes).length > 0) {
        applyCSSVariables(result.changes);
      }

      // Apply custom CSS rules
      const newCustomCSS = result.cssRules || existingCustomCSS;
      if (newCustomCSS) {
        applyCustomCSS(newCustomCSS);
      }

      // Merge into persisted config and switch to tweaked mode
      const newCustomizations = { ...(config.uiCustomizations || {}), ...result.changes };
      // Deactivate generated CSS when applying tweaks
      removeGeneratedCSS();
      const newConfig = {
        ...config,
        uiCustomizations: newCustomizations,
        uiCustomCSS: newCustomCSS,
        uiMode: 'tweaked',
      };
      onConfigChange(newConfig);
      setUiMode('tweaked');

      // Show what changed
      const detailParts = [];
      if (result.changes && Object.keys(result.changes).length > 0) {
        detailParts.push(
          'Variables:\n' +
          Object.entries(result.changes)
            .map(([name, value]) => `  ${name}: ${value}`)
            .join('\n')
        );
      }
      if (result.cssRules) {
        detailParts.push('CSS rules:\n' + result.cssRules);
      }

      setUiChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.summary,
          details: detailParts.join('\n\n') || undefined,
        },
      ]);
    } catch (err) {
      setUiChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Oops! ${err.message}`, isError: true },
      ]);
    } finally {
      setUiChatLoading(false);
    }
  }, [uiChatInput, uiChatLoading, config, onConfigChange]);

  const handleUIReset = useCallback(() => {
    activateMode('original', config);
    setUiMode('original');
    onConfigChange({
      ...config,
      uiCustomizations: {},
      uiCustomCSS: '',
      uiGeneratedCSS: '',
      uiGeneratedName: '',
      uiMode: 'original',
    });
    setUiChatMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'UI reset to defaults. All customizations have been removed.' },
    ]);
    setUiCreateMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Custom UI removed. Back to the original look.' },
    ]);
  }, [config, onConfigChange]);

  // --- Create New UI handler ---
  const handleUICreateRequest = useCallback(async () => {
    const text = uiCreateInput.trim();
    if (!text || uiCreateLoading) return;

    setUiCreateInput('');
    setUiCreateMessages((prev) => [...prev, { role: 'user', content: text }]);
    setUiCreateLoading(true);

    try {
      const existingGeneratedCSS = config.uiGeneratedCSS || '';
      const llmConfig = {
        apiKey: config.llmApiKey,
        apiUrl: config.llmApiUrl || undefined,
        model: config.llmModel || DEFAULT_LLM_MODEL,
      };

      const result = await callUICreateLLM(text, existingGeneratedCSS, llmConfig);

      // Deactivate tweaks, apply generated CSS
      resetCSSVariables();
      removeCustomCSS();
      applyGeneratedCSS(result.css);

      // Persist
      const newConfig = {
        ...config,
        uiGeneratedCSS: result.css,
        uiGeneratedName: result.name,
        uiMode: 'generated',
      };
      onConfigChange(newConfig);
      setUiMode('generated');

      setUiCreateMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**${result.name}** — ${result.summary}`,
          details: result.css,
        },
      ]);
    } catch (err) {
      setUiCreateMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Oops! ${err.message}`, isError: true },
      ]);
    } finally {
      setUiCreateLoading(false);
    }
  }, [uiCreateInput, uiCreateLoading, config, onConfigChange]);

  const tabs = [
    { id: 'prompts', label: 'Prompts' },
    { id: 'search', label: 'Search API' },
    { id: 'llm', label: 'LLM' },
    { id: 'changeUI', label: 'Change UI' },
  ];

  // --- Prompt editing ---
  const handleEditPrompt = (promptId) => {
    const current = config.prompts?.[promptId] || DEFAULT_PROMPTS[promptId].template;
    setEditingPrompt(promptId);
    setDraftText(current);
    setValidationError(null);
  };

  const handleSavePrompt = () => {
    const result = validatePrompt(draftText);
    if (!result.valid) {
      setValidationError(result.error);
      return;
    }
    onConfigChange({
      ...config,
      prompts: {
        ...config.prompts,
        [editingPrompt]: draftText,
      },
    });
    setEditingPrompt(null);
    setValidationError(null);
  };

  const handleResetPrompt = (promptId) => {
    onConfigChange({
      ...config,
      prompts: {
        ...config.prompts,
        [promptId]: DEFAULT_PROMPTS[promptId].template,
      },
    });
    if (editingPrompt === promptId) {
      setDraftText(DEFAULT_PROMPTS[promptId].template);
    }
  };

  // --- Config updates ---
  const updateConfig = (key, value) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="settings-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="settings-panel">
        {/* Header */}
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* --- PROMPTS TAB --- */}
          {activeTab === 'prompts' && (
            <div className="settings-section">
              {editingPrompt ? (
                <div className="prompt-editor">
                  <div className="prompt-editor-header">
                    <h3>{DEFAULT_PROMPTS[editingPrompt].label}</h3>
                    <button className="prompt-back-button" onClick={() => setEditingPrompt(null)}>
                      &larr; Back
                    </button>
                  </div>
                  <p className="prompt-editor-description">
                    {DEFAULT_PROMPTS[editingPrompt].description}
                  </p>
                  <div className="prompt-variables-hint">
                    Available variables: <code>{'{{query}}'}</code>, <code>{'{{results}}'}</code>
                  </div>
                  <textarea
                    className="prompt-textarea"
                    value={draftText}
                    onChange={(e) => {
                      setDraftText(e.target.value);
                      setValidationError(null);
                    }}
                    rows={14}
                    spellCheck={false}
                  />
                  {validationError && (
                    <div className="prompt-error">{validationError}</div>
                  )}
                  <div className="prompt-editor-actions">
                    <button className="prompt-save-button" onClick={handleSavePrompt}>
                      Save
                    </button>
                    <button
                      className="prompt-reset-button"
                      onClick={() => handleResetPrompt(editingPrompt)}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prompt-list">
                  <p className="settings-description">
                    Customize how the assistant explains results, picks the best product, and suggests
                    query refinements. Each prompt template is sent to the LLM (or used by local
                    heuristics if no LLM key is configured).
                  </p>
                  {Object.values(DEFAULT_PROMPTS).map((prompt) => {
                    const isCustomized =
                      config.prompts?.[prompt.id] &&
                      config.prompts[prompt.id] !== prompt.template;
                    return (
                      <div key={prompt.id} className="prompt-card">
                        <div className="prompt-card-header">
                          <div>
                            <h4 className="prompt-card-title">
                              {prompt.label}
                              {isCustomized && <span className="prompt-customized-badge">customized</span>}
                            </h4>
                            <p className="prompt-card-description">{prompt.description}</p>
                          </div>
                          <button
                            className="prompt-edit-button"
                            onClick={() => handleEditPrompt(prompt.id)}
                          >
                            Edit
                          </button>
                        </div>
                        <pre className="prompt-preview">
                          {(config.prompts?.[prompt.id] || prompt.template).slice(0, 120)}...
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- SEARCH API TAB --- */}
          {activeTab === 'search' && (
            <div className="settings-section">
              <p className="settings-description">
                Configure the product search backend and catalog.
              </p>

              <label className="settings-label">Search Provider</label>
              <select
                className="settings-select"
                value={config.searchProvider || 'cimulate'}
                onChange={(e) => updateConfig('searchProvider', e.target.value)}
              >
                {SEARCH_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {(config.searchProvider || 'cimulate') === 'cimulate' && (
                <>
                  <label className="settings-label">Catalog</label>
                  <select
                    className="settings-select"
                    value={config.searchCatalog || 'cephora'}
                    onChange={(e) => updateConfig('searchCatalog', e.target.value)}
                  >
                    {CATALOGS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="settings-hint">
                    Real product catalog powered by Cimulate Search API.
                  </p>
                </>
              )}

              {config.searchProvider === 'llm' && (
                <p className="settings-hint">
                  Uses the LLM gateway to generate product results. Requires a Gateway API Key (set in the LLM tab).
                </p>
              )}

              <label className="settings-label">Max Results</label>
              <input
                type="number"
                className="settings-input"
                min="2"
                max="20"
                value={config.maxResults || 8}
                onChange={(e) => updateConfig('maxResults', parseInt(e.target.value, 10) || 8)}
              />
            </div>
          )}

          {/* --- LLM TAB --- */}
          {activeTab === 'llm' && (
            <div className="settings-section">
              <p className="settings-description">
                Configure the LLM that powers the explanation, best-pick, and reformulation prompts.
                Uses the Salesforce AI Model Gateway (OpenAI-compatible). Without a key, intelligent
                local heuristics are used instead.
              </p>

              <label className="settings-label">Gateway API Key</label>
              <input
                type="password"
                className="settings-input"
                placeholder="sk-..."
                value={config.llmApiKey || ''}
                onChange={(e) => updateConfig('llmApiKey', e.target.value)}
              />
              <p className="settings-hint">
                Bearer token for the SF AI Model Gateway. Set once to enable all models below.
              </p>

              <label className="settings-label">Model</label>
              <select
                className="settings-select"
                value={config.llmModel || DEFAULT_LLM_MODEL}
                onChange={(e) => updateConfig('llmModel', e.target.value)}
              >
                {(() => {
                  const grouped = {};
                  GATEWAY_MODELS.forEach((m) => {
                    if (!grouped[m.provider]) grouped[m.provider] = [];
                    grouped[m.provider].push(m);
                  });
                  return Object.entries(grouped).map(([provider, models]) => (
                    <optgroup key={provider} label={provider}>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.tier})
                        </option>
                      ))}
                    </optgroup>
                  ));
                })()}
              </select>

              <label className="settings-label">API Endpoint</label>
              <input
                type="text"
                className="settings-input"
                placeholder={DEFAULT_LLM_GATEWAY}
                value={config.llmApiUrl || ''}
                onChange={(e) => updateConfig('llmApiUrl', e.target.value)}
              />
              <p className="settings-hint">
                Defaults to SF AI Model Gateway. Change only if using an alternative OpenAI-compatible endpoint.
              </p>

              <div className="settings-status">
                <span className={`status-dot ${config.llmApiKey ? 'active' : ''}`} />
                <span>
                  {config.llmApiKey
                    ? `Gateway active — ${GATEWAY_MODELS.find((m) => m.id === (config.llmModel || DEFAULT_LLM_MODEL))?.name || config.llmModel || DEFAULT_LLM_MODEL}`
                    : 'LLM disabled — using local heuristics'}
                </span>
              </div>
            </div>
          )}

          {/* --- CHANGE UI TAB --- */}
          {activeTab === 'changeUI' && (
            <div className="settings-section ui-change-section">
              {/* Sub-view switcher */}
              <div className="ui-subview-switcher">
                <button
                  className={`ui-subview-btn ${uiSubView === 'tweak' ? 'active' : ''}`}
                  onClick={() => setUiSubView('tweak')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Tweak UI
                </button>
                <button
                  className={`ui-subview-btn ${uiSubView === 'create' ? 'active' : ''}`}
                  onClick={() => setUiSubView('create')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Create New UI
                </button>
              </div>

              {/* Mode indicator bar */}
              <div className="ui-mode-bar">
                <span className="ui-mode-bar-label">Active:</span>
                <button
                  className={`ui-mode-btn ${uiMode === 'original' ? 'active' : ''}`}
                  onClick={() => handleModeChange('original')}
                >
                  Original
                </button>
                <button
                  className={`ui-mode-btn ${uiMode === 'tweaked' ? 'active' : ''}`}
                  onClick={() => handleModeChange('tweaked')}
                  disabled={!(config.uiCustomizations && Object.keys(config.uiCustomizations).length > 0) && !config.uiCustomCSS}
                >
                  Tweaked
                </button>
                <button
                  className={`ui-mode-btn ${uiMode === 'generated' ? 'active' : ''}`}
                  onClick={() => handleModeChange('generated')}
                  disabled={!config.uiGeneratedCSS}
                >
                  {config.uiGeneratedName || 'Custom UI'}
                </button>
              </div>

              {!config.llmApiKey && (
                <p className="settings-description">
                  <span className="ui-change-warning">Requires an LLM API key (set in the LLM tab).</span>
                </p>
              )}

              {/* ---- TWEAK sub-view ---- */}
              {uiSubView === 'tweak' && (
                <>
                  <p className="settings-description" style={{ margin: '0 0 4px' }}>
                    Describe small changes — colors, fonts, spacing. Changes are applied incrementally.
                  </p>

                  {/* Chat messages */}
                  <div className="ui-chat-messages">
                    {uiChatMessages.map((msg, idx) => (
                      <div key={idx} className={`ui-chat-msg ui-chat-msg--${msg.role} ${msg.isError ? 'ui-chat-msg--error' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="ui-chat-avatar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                              <path d="M2 17l10 5 10-5"/>
                              <path d="M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                        )}
                        <div className="ui-chat-bubble">
                          <div className="ui-chat-text">{msg.content}</div>
                          {msg.details && (
                            <details className="ui-chat-details">
                              <summary>Changes applied</summary>
                              <pre>{msg.details}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                    {uiChatLoading && (
                      <div className="ui-chat-msg ui-chat-msg--assistant">
                        <div className="ui-chat-avatar">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                        <div className="ui-chat-bubble">
                          <div className="ui-chat-typing">
                            <span /><span /><span />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={uiChatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="ui-chat-input-row">
                    <input
                      type="text"
                      className="ui-chat-input"
                      placeholder={config.llmApiKey ? 'Describe a UI change...' : 'Set LLM API key first...'}
                      value={uiChatInput}
                      onChange={(e) => setUiChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUIChangeRequest();
                        }
                      }}
                      disabled={!config.llmApiKey || uiChatLoading}
                    />
                    <button
                      className="ui-chat-send"
                      onClick={handleUIChangeRequest}
                      disabled={!config.llmApiKey || !uiChatInput.trim() || uiChatLoading}
                      title="Send"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Current overrides preview */}
                  {((config.uiCustomizations && Object.keys(config.uiCustomizations).length > 0) || config.uiCustomCSS) && (
                    <div className="ui-overrides-preview">
                      <h4>Active customizations</h4>
                      {config.uiCustomizations && Object.keys(config.uiCustomizations).length > 0 && (
                        <div className="ui-overrides-grid">
                          {Object.entries(config.uiCustomizations).map(([varName, value]) => (
                            <div key={varName} className="ui-override-chip">
                              {value.startsWith('#') && (
                                <span className="ui-override-swatch" style={{ background: value }} />
                              )}
                              <span className="ui-override-name">{CSS_VARIABLE_DEFINITIONS[varName]?.label || varName}</span>
                              <span className="ui-override-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {config.uiCustomCSS && (
                        <details className="ui-css-rules-preview">
                          <summary>Custom CSS rules</summary>
                          <pre>{config.uiCustomCSS}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ---- CREATE NEW UI sub-view ---- */}
              {uiSubView === 'create' && (
                <>
                  <p className="settings-description" style={{ margin: '0 0 4px' }}>
                    Describe a completely new look. The LLM will generate a full stylesheet.
                    {config.uiGeneratedName && (
                      <span className="ui-generated-badge">{config.uiGeneratedName}</span>
                    )}
                  </p>

                  {/* Chat messages */}
                  <div className="ui-chat-messages">
                    {uiCreateMessages.map((msg, idx) => (
                      <div key={idx} className={`ui-chat-msg ui-chat-msg--${msg.role} ${msg.isError ? 'ui-chat-msg--error' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="ui-chat-avatar ui-chat-avatar--create">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </div>
                        )}
                        <div className="ui-chat-bubble">
                          <div className="ui-chat-text">{msg.content}</div>
                          {msg.details && (
                            <details className="ui-chat-details">
                              <summary>Generated stylesheet</summary>
                              <pre>{msg.details}</pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                    {uiCreateLoading && (
                      <div className="ui-chat-msg ui-chat-msg--assistant">
                        <div className="ui-chat-avatar ui-chat-avatar--create">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </div>
                        <div className="ui-chat-bubble">
                          <div className="ui-chat-typing">
                            <span /><span /><span />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={uiCreateEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="ui-chat-input-row">
                    <input
                      type="text"
                      className="ui-chat-input"
                      placeholder={config.llmApiKey ? 'Describe your new UI design...' : 'Set LLM API key first...'}
                      value={uiCreateInput}
                      onChange={(e) => setUiCreateInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUICreateRequest();
                        }
                      }}
                      disabled={!config.llmApiKey || uiCreateLoading}
                    />
                    <button
                      className="ui-chat-send"
                      onClick={handleUICreateRequest}
                      disabled={!config.llmApiKey || !uiCreateInput.trim() || uiCreateLoading}
                      title="Send"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* Generated CSS preview */}
                  {config.uiGeneratedCSS && (
                    <div className="ui-overrides-preview">
                      <h4>Generated theme: {config.uiGeneratedName || 'Custom UI'}</h4>
                      <details className="ui-css-rules-preview">
                        <summary>Full generated stylesheet ({(config.uiGeneratedCSS.match(/\{/g) || []).length} rules)</summary>
                        <pre>{config.uiGeneratedCSS}</pre>
                      </details>
                    </div>
                  )}
                </>
              )}

              {/* Reset button — shown for any mode that has customizations */}
              {(uiMode !== 'original' || config.uiGeneratedCSS || (config.uiCustomizations && Object.keys(config.uiCustomizations).length > 0) || config.uiCustomCSS) && (
                <button className="ui-reset-button" onClick={handleUIReset}>
                  Reset All to Defaults
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
