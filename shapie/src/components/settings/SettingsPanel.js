import React, { useState, useEffect } from 'react';
import { GATEWAY_MODELS } from '../../services/llmClient';

export default function SettingsPanel({ config, onConfigChange }) {
  const [form, setForm] = useState(config);

  useEffect(() => {
    setForm(config);
  }, [config]);

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    onConfigChange(next);
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>

      {/* LLM Configuration */}
      <div className="settings-section">
        <h3>LLM Configuration</h3>

        <label className="settings-label">
          API Key
          <input
            type="password"
            className="settings-input"
            placeholder="sk-..."
            value={form.llmApiKey || ''}
            onChange={(e) => handleChange('llmApiKey', e.target.value)}
          />
        </label>

        <label className="settings-label">
          API URL
          <input
            type="text"
            className="settings-input"
            placeholder="https://..."
            value={form.llmApiUrl || ''}
            onChange={(e) => handleChange('llmApiUrl', e.target.value)}
          />
        </label>

        <label className="settings-label">
          Model
          <select
            className="settings-select"
            value={form.llmModel || ''}
            onChange={(e) => handleChange('llmModel', e.target.value)}
          >
            {GATEWAY_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Wolfie Integration */}
      <div className="settings-section">
        <h3>Wolfie Integration</h3>
        <label className="settings-label">
          Wolfie Port
          <input
            type="number"
            className="settings-input"
            value={form.wolfiePort || 3099}
            onChange={(e) => handleChange('wolfiePort', parseInt(e.target.value, 10) || 3099)}
          />
          <span className="settings-hint">Port where Wolfie dev server runs (default 3099)</span>
        </label>
      </div>
    </div>
  );
}
