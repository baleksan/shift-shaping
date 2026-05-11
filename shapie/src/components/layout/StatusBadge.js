import React from 'react';
import { statusMap } from '../../data/statuses';

export default function StatusBadge({ status, size = 'normal' }) {
  const info = statusMap[status] || { label: status, color: '#a0aec0', emoji: '' };

  return (
    <span
      className={`status-badge status-badge--${size}`}
      style={{ '--badge-color': info.color }}
    >
      <span className="status-badge-dot" />
      <span className="status-badge-label">{info.label}</span>
    </span>
  );
}
