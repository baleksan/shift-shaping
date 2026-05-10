import React, { useState } from 'react';
import { DEFAULT_PROMPTS, validatePrompt, GATEWAY_MODELS, DEFAULT_LLM_GATEWAY, DEFAULT_LLM_MODEL } from '../services/promptEngine';
import { SEARCH_PROVIDERS, CATALOGS } from '../services/searchApi';

/**
 * PromptSettings — a slide-out panel that lets users customize:
 *   1. Search API configuration (provider, API key)
 *   2. LLM configuration (API key, model, endpoint)
 *   3. All three prompt templates (explanation, bestPick, reformulations)
 */
export default function PromptSettings({ config, onConfigChange, onClose }) {
  const [activeTab, setActiveTab] = useState('prompts');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [validationError, setValidationError] = useState(null);

  const tabs = [
    { id: 'prompts', label: 'Prompts' },
    { id: 'search', label: 'Search API' },
    { id: 'llm', label: 'LLM' },
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
        </div>
      </div>
    </div>
  );
}
