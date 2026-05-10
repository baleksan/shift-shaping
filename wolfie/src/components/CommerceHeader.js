import React, { useState, useRef, useEffect } from 'react';
import WerewolfIcon from './WerewolfIcon';
import WolfiePopover from './WolfiePopover';

export default function CommerceHeader({ title, onMinimize, onEndChat, onSettings }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWolfie, setShowWolfie] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="commerce-header">
      <div className="header-menu-section" ref={menuRef}>
        <button
          className="header-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {isMenuOpen && (
          <div className="header-dropdown" role="menu">
            <button
              className="dropdown-item"
              onClick={() => {
                setIsMenuOpen(false);
              }}
            >
              Request Transcript
            </button>
            <button
              className="dropdown-item dropdown-item--danger"
              onClick={() => {
                onEndChat();
                setIsMenuOpen(false);
              }}
            >
              End Chat
            </button>
          </div>
        )}
      </div>

      <div className="header-center">
        <button
          className="wolfie-button"
          onClick={() => setShowWolfie(!showWolfie)}
          aria-label="Meet Wolfie"
        >
          <WerewolfIcon size={28} className="brand-logo-icon" />
        </button>
        <h2 className="header-title">{title}</h2>
        {showWolfie && <WolfiePopover onClose={() => setShowWolfie(false)} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {onSettings && (
          <button
            className="header-button"
            onClick={onSettings}
            aria-label="Settings"
            title="Settings"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        )}
        <button
          className="header-button"
          onClick={onMinimize}
          aria-label="Minimize"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
