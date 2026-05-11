import React from 'react';
import StatusBadge from '../layout/StatusBadge';
import { timeAgo } from '../../utils/time';

export default function ShapeList({ shapes, onSelectShape, onCreateShape, onDeleteShape }) {
  if (shapes.length === 0) {
    return (
      <div className="shape-list-empty">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>
        <h2 className="empty-title">No shapes yet</h2>
        <p className="empty-desc">Start shaping your first product idea.</p>
        <button className="btn btn-primary" onClick={onCreateShape}>
          + New Shape
        </button>
      </div>
    );
  }

  return (
    <div className="shape-list">
      <div className="shape-list-header">
        <h2>All Shapes</h2>
        <button className="btn btn-primary btn-sm" onClick={onCreateShape}>
          + New Shape
        </button>
      </div>
      <div className="shape-list-grid">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className="shape-card"
            onClick={() => onSelectShape(shape.id)}
          >
            <div className="shape-card-header">
              <span className="shape-card-name">{shape.name || 'Untitled'}</span>
              <StatusBadge status={shape.status} size="small" />
            </div>
            <p className="shape-card-problem">
              {shape.problem || shape.description || 'No problem statement yet.'}
            </p>
            <div className="shape-card-footer">
              <span className="shape-card-appetite">
                {shape.appetite === 'big_batch' ? '6 weeks' : '1-2 weeks'}
              </span>
              <span className="shape-card-time">{timeAgo(shape.updatedAt)}</span>
            </div>
            <button
              className="shape-card-delete"
              title="Delete shape"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${shape.name || 'Untitled'}"?`)) {
                  onDeleteShape(shape.id);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
