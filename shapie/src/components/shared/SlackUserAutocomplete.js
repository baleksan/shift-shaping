import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchSlackUsers } from '../../services/slackSearch';

/**
 * Autocomplete input that searches the corporate Slack directory.
 * Shows a dropdown of matching users as you type.
 *
 * @param {function} onSelect - Called with the selected user { name, userId, email, title }
 * @param {string} placeholder
 */
export default function SlackUserAutocomplete({ onSelect, placeholder = 'Search people...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(async (text) => {
    setQuery(text);
    setActiveIndex(-1);

    if (text.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const users = await searchSlackUsers(text);
      setResults(users);
      setIsOpen(users.length > 0);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelect = (user) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // Allow manual entry if no dropdown
        e.preventDefault();
        onSelect({ name: query.trim(), userId: '', email: '', title: '' });
        setQuery('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="slack-autocomplete" ref={wrapperRef}>
      <div className="slack-autocomplete-input-wrap">
        <svg className="slack-autocomplete-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="slack-autocomplete-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          autoComplete="off"
        />
        {isLoading && <span className="slack-autocomplete-spinner" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="slack-autocomplete-dropdown" role="listbox">
          {results.map((user, idx) => (
            <div
              key={user.userId || idx}
              className={`slack-autocomplete-option ${idx === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={idx === activeIndex}
              onClick={() => handleSelect(user)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <div className="slack-user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="slack-user-info">
                <span className="slack-user-name">{user.name}</span>
                <span className="slack-user-detail">{user.title || user.email}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
