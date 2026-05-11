import React, { useState } from 'react';
import BuddhaIcon from '../mascot/BuddhaIcon';
import ShapiePopover from '../mascot/ShapiePopover';

export default function ShapieHeader({ page, shape, onNav }) {
  const [showPopover, setShowPopover] = useState(false);

  const getTitle = () => {
    switch (page) {
      case 'new': return 'New Shape';
      case 'editor': return shape?.name || 'Edit Shape';
      case 'ui_select': return 'Select UI';
      case 'session': return `Shaping: ${shape?.name || ''}`;
      case 'report': return `Report: ${shape?.name || ''}`;
      case 'settings': return 'Settings';
      default: return 'All Shapes';
    }
  };

  const getBreadcrumb = () => {
    if (page === 'shapes') return null;
    return (
      <button className="header-breadcrumb" onClick={() => onNav('shapes')}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        All Shapes
      </button>
    );
  };

  return (
    <header className="shapie-header">
      <div className="header-left">
        {getBreadcrumb()}
        <h1 className="header-title">{getTitle()}</h1>
      </div>
      <div className="header-right">
        <button
          className="shapie-buddha-button"
          onClick={() => setShowPopover(!showPopover)}
          aria-label="Meet Shapie"
        >
          <BuddhaIcon size={32} shape={page === 'session' ? 'diamond' : 'circle'} />
        </button>
        {showPopover && <ShapiePopover onClose={() => setShowPopover(false)} />}
      </div>
    </header>
  );
}
