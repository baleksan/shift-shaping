import React, { useState, useRef, useEffect } from 'react';
import BuddhaIcon from '../mascot/BuddhaIcon';

export default function NewShape({ onCreate }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the name field
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="new-shape">
      <div className="new-shape-header">
        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          Create Shape
        </button>
      </div>

      <div className="new-shape-card">
        <div className="new-shape-icon">
          <BuddhaIcon size={56} shape="diamond" />
        </div>
        <h2 className="new-shape-title">Name your shape</h2>
        <p className="new-shape-hint">Give it a short, memorable name. You can always change it later.</p>
        <input
          ref={inputRef}
          type="text"
          className="new-shape-input"
          placeholder="e.g. Checkout Redesign, Onboarding Flow, Search v2..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
