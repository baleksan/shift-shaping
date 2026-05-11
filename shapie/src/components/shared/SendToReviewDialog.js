import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * SendToReviewDialog — pick reviewers from participants or search Slack,
 * then send the spec via Slack DM to each reviewer.
 */
export default function SendToReviewDialog({ shape, recordings = [], onClose, onSent }) {
  const participants = shape.participants || [];
  const [reviewers, setReviewers] = useState(() =>
    participants.map((p) => ({ ...p, selected: true }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { sent: [...], failed: [...] }
  const [error, setError] = useState('');

  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Click outside to close search dropdown
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleReviewer = (index) => {
    setReviewers((prev) => prev.map((r, i) =>
      i === index ? { ...r, selected: !r.selected } : r
    ));
  };

  const removeReviewer = (index) => {
    setReviewers((prev) => prev.filter((_, i) => i !== index));
  };

  // Slack user search for adding new reviewers
  const searchUsers = useCallback((query) => {
    if (query.length < 2) {
      setShowSearchDropdown(false);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/slack/search-users?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        // Filter out already-added reviewers
        const existing = new Set(reviewers.map((r) => r.userId || r.name));
        const filtered = (data.users || []).filter(
          (u) => !existing.has(u.userId) && !existing.has(u.name)
        );
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      })
      .catch(() => {})
      .finally(() => setSearchLoading(false));
  }, [reviewers]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => searchUsers(val), 250);
  };

  const addReviewer = (user) => {
    setReviewers((prev) => [
      ...prev,
      {
        name: user.name,
        userId: user.userId,
        email: user.email || '',
        title: user.title || '',
        selected: true,
        isAdded: true, // marks as manually added (not original participant)
      },
    ]);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  // Send spec to selected reviewers via Slack Canvas + DMs
  const handleSend = async () => {
    const selected = reviewers.filter((r) => r.selected);
    if (selected.length === 0) {
      setError('Select at least one reviewer');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const res = await fetch('/api/slack/send-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shape,
          report: shape.report || '',
          recordings,
          reviewers: selected.map((r) => ({
            name: r.name,
            userId: r.userId,
          })),
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to send review');
        setIsSending(false);
        return;
      }

      setSendResult({
        sent: data.sent || [],
        failed: data.failed || [],
        canvasUrl: data.canvasUrl,
      });
      setIsSending(false);

      if ((data.sent || []).length > 0 && onSent) {
        onSent(selected);
      }
    } catch (err) {
      setError(err.message);
      setIsSending(false);
    }
  };

  // --- Render ---
  return (
    <div className="gus-dialog-backdrop" onClick={onClose}>
      <div className="gus-dialog" onClick={(e) => e.stopPropagation()}>
        {sendResult ? (
          /* Result state */
          <div className="review-dialog-result">
            <div className="gus-dialog-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </div>
            <h3>Review Request Sent</h3>
            {sendResult.canvasUrl && (
              <p className="review-dialog-canvas">
                Spec published as Slack Canvas:
                <a href={sendResult.canvasUrl} target="_blank" rel="noopener noreferrer">
                  Open Canvas
                </a>
              </p>
            )}
            {sendResult.sent.length > 0 && (
              <p className="review-dialog-sent">
                Sent to: {sendResult.sent.map((s) => s.name).join(', ')}
              </p>
            )}
            {sendResult.failed.length > 0 && (
              <div className="review-dialog-failed">
                <p><strong>Failed:</strong></p>
                {sendResult.failed.map((f, i) => (
                  <p key={i}>{f.name}: {f.reason}</p>
                ))}
              </div>
            )}
            <button className="btn btn-outline btn-sm" onClick={onClose} style={{ marginTop: 16 }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="gus-dialog-header">
              <h3>Send for Review</h3>
              <button className="gus-dialog-close" onClick={onClose}>&times;</button>
            </div>

            <div className="gus-dialog-body">
              <p className="review-dialog-desc">
                Select who should review the spec for <strong>{shape.name || 'this shape'}</strong>.
                The spec will be sent via Slack DM.
              </p>

              {/* Reviewer list */}
              <div className="review-reviewer-list">
                {reviewers.map((r, idx) => (
                  <label key={idx} className={`review-reviewer-item ${r.selected ? 'review-reviewer-item--selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={r.selected}
                      onChange={() => toggleReviewer(idx)}
                    />
                    <div className="review-reviewer-info">
                      <span className="review-reviewer-name">{r.name}</span>
                      {r.title && <span className="review-reviewer-title">{r.title}</span>}
                    </div>
                    {r.isAdded && (
                      <button
                        className="review-reviewer-remove"
                        onClick={(e) => { e.preventDefault(); removeReviewer(idx); }}
                        title="Remove"
                      >&times;</button>
                    )}
                    {!r.isAdded && (
                      <span className="gus-autocomplete-tag" style={{ marginLeft: 'auto' }}>Participant</span>
                    )}
                  </label>
                ))}

                {reviewers.length === 0 && (
                  <p className="review-dialog-empty">No participants yet. Add reviewers below.</p>
                )}
              </div>

              {/* Add reviewer search */}
              <div className="gus-field" ref={searchRef}>
                <span className="gus-field-label">Add Reviewer</span>
                <div className="gus-autocomplete-wrap">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="gus-field-input"
                    placeholder="Search Slack users..."
                  />
                  {searchLoading && <span className="gus-autocomplete-spinner" />}
                </div>
                {showSearchDropdown && searchResults.length > 0 && (
                  <ul className="gus-autocomplete-dropdown">
                    {searchResults.map((u) => (
                      <li key={u.userId || u.name} onClick={() => addReviewer(u)}>
                        <span className="gus-autocomplete-name">{u.name}</span>
                        <span className="gus-autocomplete-email">{u.title || u.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && <div className="gus-dialog-error">{error}</div>}
            </div>

            <div className="gus-dialog-footer">
              <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={isSending || reviewers.filter((r) => r.selected).length === 0}
              >
                {isSending ? 'Sending...' : `Send to ${reviewers.filter((r) => r.selected).length} reviewer${reviewers.filter((r) => r.selected).length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
