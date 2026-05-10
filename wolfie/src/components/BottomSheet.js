import React, { useState } from 'react';

export default function BottomSheet({ title, options, multiSelect, onSelect, onClose }) {
  const [selected, setSelected] = useState([]);

  const handleOptionClick = (option) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(option.displayValue)
          ? prev.filter((v) => v !== option.displayValue)
          : [...prev, option.displayValue]
      );
    } else {
      onSelect(option.utterance || option.displayValue);
    }
  };

  const handleProceed = () => {
    if (selected.length > 0) {
      onSelect(selected.join(', '));
    }
  };

  const handleClear = () => {
    setSelected([]);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="bottom-sheet-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      <div className="bottom-sheet">
        <div className="bottom-sheet-header">
          <h2 id="bottom-sheet-title" className="bottom-sheet-title">
            {title}
          </h2>
          <button className="bottom-sheet-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="bottom-sheet-content">
          {options.map((option, idx) => (
            <label key={idx} className="bottom-sheet-option">
              <span className="bottom-sheet-option-text">{option.displayValue}</span>
              {multiSelect ? (
                <input
                  type="checkbox"
                  checked={selected.includes(option.displayValue)}
                  onChange={() => handleOptionClick(option)}
                />
              ) : (
                <input
                  type="radio"
                  name="bottom-sheet-option"
                  onChange={() => handleOptionClick(option)}
                />
              )}
            </label>
          ))}
        </div>

        {multiSelect && (
          <div className="bottom-sheet-footer">
            <button className="bottom-sheet-button clear" onClick={handleClear}>
              Clear
            </button>
            <button
              className="bottom-sheet-button proceed"
              onClick={handleProceed}
              disabled={selected.length === 0}
            >
              Continue ({selected.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
