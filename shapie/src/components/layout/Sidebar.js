import React, { useState } from 'react';
import BuddhaIcon from '../mascot/BuddhaIcon';
import ShapiePopover from '../mascot/ShapiePopover';
import StatusBadge from './StatusBadge';

export default function Sidebar({ shapes, selectedShapeId, currentPage, onNav, onSelectShape, onCreateShape }) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <aside className="shapie-sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <button
          className="sidebar-buddha-button"
          onClick={() => setShowPopover(!showPopover)}
          aria-label="Meet Shapie"
        >
          <BuddhaIcon size={36} />
        </button>
        <span className="sidebar-brand-text" onClick={() => onNav('shapes')}>Shapie</span>
        {showPopover && <ShapiePopover onClose={() => setShowPopover(false)} />}
      </div>

      {/* New Shape button */}
      <button className="sidebar-create-btn" onClick={onCreateShape}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Shape
      </button>

      {/* Shapes list */}
      <div className="sidebar-section">
        <div className="sidebar-section-label">Shapes</div>
        <div className="sidebar-shapes-list">
          {shapes.length === 0 && (
            <div className="sidebar-empty">No shapes yet</div>
          )}
          {shapes.map((shape) => (
            <button
              key={shape.id}
              className={`sidebar-shape-item ${selectedShapeId === shape.id ? 'active' : ''}`}
              onClick={() => onSelectShape(shape.id)}
            >
              <span className="sidebar-shape-name">{shape.name || 'Untitled'}</span>
              <StatusBadge status={shape.status} size="small" />
            </button>
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div className="sidebar-footer">
        <button
          className={`sidebar-nav-btn ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => onNav('settings')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}
