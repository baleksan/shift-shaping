import React, { useState, useEffect, useRef } from 'react';
import StatusBadge from '../layout/StatusBadge';
import SlackUserAutocomplete from '../shared/SlackUserAutocomplete';
import SlackChannelButton from '../shared/SlackChannelButton';
import { generateId } from '../../utils/ids';

export default function ShapeEditor({ shape, onUpdate, onStartSession, onViewReport, onDelete }) {
  // Local form state — syncs from shape prop
  const [form, setForm] = useState(shape);
  const debounceRef = useRef(null);

  // Sync when shape changes externally
  useEffect(() => {
    setForm(shape);
  }, [shape]);

  // Debounced auto-save
  const handleChange = (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate({ [field]: value });
    }, 400);
  };

  // Participants
  const addParticipant = (user) => {
    // Deduplicate by userId or name
    const existing = form.participants || [];
    const isDuplicate = existing.some((p) =>
      (user.userId && p.userId === user.userId) || p.name === user.name
    );
    if (isDuplicate) return;

    const newParticipants = [
      ...existing,
      { id: generateId(), name: user.name, userId: user.userId || '', email: user.email || '', title: user.title || '', role: '' },
    ];
    setForm({ ...form, participants: newParticipants });
    onUpdate({ participants: newParticipants });
  };

  const updateParticipantRole = (id, role) => {
    const newParticipants = (form.participants || []).map((p) =>
      p.id === id ? { ...p, role } : p
    );
    setForm({ ...form, participants: newParticipants });
    onUpdate({ participants: newParticipants });
  };

  const removeParticipant = (id) => {
    const newParticipants = (form.participants || []).filter((p) => p.id !== id);
    setForm({ ...form, participants: newParticipants });
    onUpdate({ participants: newParticipants });
  };

  return (
    <div className="shape-editor">
      {/* Title row */}
      <div className="editor-title-row">
        <input
          type="text"
          className="editor-name-input"
          placeholder="Shape name..."
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <StatusBadge status={form.status} />
      </div>

      {/* Actions bar */}
      <div className="editor-actions">
        <button className="btn btn-primary" onClick={onStartSession}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Start Shaping Session
        </button>
        {shape.report && (
          <button className="btn btn-secondary" onClick={onViewReport}>
            View Report
          </button>
        )}
        <button className="btn btn-danger btn-sm editor-delete" onClick={() => {
          if (window.confirm(`Delete "${form.name || 'Untitled'}"?`)) onDelete();
        }}>
          Delete
        </button>
      </div>

      {/* Form sections */}
      <div className="editor-sections">
        {/* Problem */}
        <div className="editor-section">
          <label className="editor-label">Problem</label>
          <textarea
            className="editor-textarea"
            placeholder="What's the pain? Why does this matter now? Describe the problem you want to shape..."
            value={form.problem}
            onChange={(e) => handleChange('problem', e.target.value)}
            rows={6}
          />
        </div>

        {/* Participants */}
        <div className="editor-section">
          <label className="editor-label">Participants</label>
          <div className="participants-list">
            {(form.participants || []).map((p) => (
              <div key={p.id} className="participant-item">
                <div className="participant-avatar">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="participant-info">
                  <span className="participant-name">{p.name}</span>
                  {p.title && <span className="participant-title">{p.title}</span>}
                </div>
                <select
                  className="participant-role"
                  value={p.role}
                  onChange={(e) => updateParticipantRole(p.id, e.target.value)}
                >
                  <option value="">Role...</option>
                  <option value="shaper">Shaper</option>
                  <option value="stakeholder">Stakeholder</option>
                  <option value="engineer">Engineer</option>
                  <option value="designer">Designer</option>
                  <option value="pm">PM</option>
                </select>
                <button
                  className="participant-remove"
                  onClick={() => removeParticipant(p.id)}
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ))}
            <SlackUserAutocomplete
              onSelect={addParticipant}
              placeholder="Search people in Slack..."
            />
          </div>
        </div>

        {/* Slack Channel */}
        <div className="editor-section">
          <label className="editor-label">Slack Channel</label>
          <SlackChannelButton shape={form} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
}
