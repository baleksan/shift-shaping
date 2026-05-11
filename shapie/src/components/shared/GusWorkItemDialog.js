import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * GusWorkItemDialog — modal dialog for creating a GUS work item
 * from the spec report.
 *
 * Features:
 * - Pre-populates subject from shape name
 * - Assignee autocomplete: shows shape participants first, then searches GUS
 * - Theme autocomplete: searches GUS themes, defaults to "Shopper Agent" results
 * - Generates HTML details from the spec report
 */
export default function GusWorkItemDialog({ shape, report, onClose, onCreated }) {
  const [subject, setSubject] = useState(`[Shaping] ${shape.name || 'Untitled'}`);
  const [assignee, setAssignee] = useState(null); // { id, name, email }
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [assigneeSuggestions, setAssigneeSuggestions] = useState([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const [theme, setTheme] = useState(null); // { id, name }
  const [themeQuery, setThemeQuery] = useState('Shopper Agent');
  const [themeSuggestions, setThemeSuggestions] = useState([]);
  const [themeLoading, setThemeLoading] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdWI, setCreatedWI] = useState(null);

  // Resolved GUS IDs for participants (from Slack emails)
  const [participantGusUsers, setParticipantGusUsers] = useState([]);

  const assigneeRef = useRef(null);
  const themeRef = useRef(null);
  const assigneeTimerRef = useRef(null);
  const themeTimerRef = useRef(null);

  // On mount: resolve participant emails to GUS user IDs
  useEffect(() => {
    const participants = shape.participants || [];
    const emails = participants.map((p) => p.email).filter(Boolean);
    if (emails.length === 0) return;

    fetch(`/api/gus/search-users-by-email?emails=${encodeURIComponent(emails.join(','))}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.users) {
          setParticipantGusUsers(data.users);
        }
      })
      .catch(() => {});
  }, [shape.participants]);

  // On mount: pre-search themes for "Shopper Agent"
  useEffect(() => {
    fetch('/api/gus/search-themes?q=Shopper%20Agent')
      .then((r) => r.json())
      .then((data) => {
        if (data.themes && data.themes.length > 0) {
          setThemeSuggestions(data.themes);
        }
      })
      .catch(() => {});
  }, []);

  // ---- Assignee autocomplete ----
  const searchAssignees = useCallback((query) => {
    if (query.length < 2) {
      // Show participants as default suggestions
      const participantSuggestions = participantGusUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isParticipant: true,
      }));
      setAssigneeSuggestions(participantSuggestions);
      setShowAssigneeDropdown(participantSuggestions.length > 0);
      return;
    }

    setAssigneeLoading(true);
    fetch(`/api/gus/search-users?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        const gusUsers = (data.users || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isParticipant: participantGusUsers.some((p) => p.id === u.id),
        }));
        // Put participants first
        gusUsers.sort((a, b) => (b.isParticipant ? 1 : 0) - (a.isParticipant ? 1 : 0));
        setAssigneeSuggestions(gusUsers);
        setShowAssigneeDropdown(true);
      })
      .catch(() => {})
      .finally(() => setAssigneeLoading(false));
  }, [participantGusUsers]);

  const handleAssigneeChange = (e) => {
    const val = e.target.value;
    setAssigneeQuery(val);
    setAssignee(null);
    clearTimeout(assigneeTimerRef.current);
    assigneeTimerRef.current = setTimeout(() => searchAssignees(val), 250);
  };

  const handleAssigneeFocus = () => {
    if (assigneeSuggestions.length > 0) {
      setShowAssigneeDropdown(true);
    } else {
      searchAssignees(assigneeQuery);
    }
  };

  const selectAssignee = (user) => {
    setAssignee(user);
    setAssigneeQuery(user.name);
    setShowAssigneeDropdown(false);
  };

  // ---- Theme autocomplete ----
  const searchThemes = useCallback((query) => {
    if (query.length < 2) {
      setShowThemeDropdown(false);
      return;
    }
    setThemeLoading(true);
    fetch(`/api/gus/search-themes?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setThemeSuggestions(data.themes || []);
        setShowThemeDropdown(true);
      })
      .catch(() => {})
      .finally(() => setThemeLoading(false));
  }, []);

  const handleThemeChange = (e) => {
    const val = e.target.value;
    setThemeQuery(val);
    setTheme(null);
    clearTimeout(themeTimerRef.current);
    themeTimerRef.current = setTimeout(() => searchThemes(val), 250);
  };

  const handleThemeFocus = () => {
    if (themeSuggestions.length > 0) {
      setShowThemeDropdown(true);
    } else if (themeQuery.length >= 2) {
      searchThemes(themeQuery);
    }
  };

  const selectTheme = (t) => {
    setTheme(t);
    setThemeQuery(t.name);
    setShowThemeDropdown(false);
  };

  // ---- Click outside to close dropdowns ----
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setShowAssigneeDropdown(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---- Create work item ----
  const handleCreate = async () => {
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Build a short HTML details from the report (first ~500 chars)
      const reportPreview = (report || '').slice(0, 1500).replace(/\n/g, '<br/>');
      const details = `<p><b>Shape:</b> ${shape.name || 'Untitled'}</p>`
        + (shape.problem ? `<p><b>Problem:</b> ${shape.problem}</p>` : '')
        + `<p><b>Generated from Shapie spec report.</b></p>`
        + (reportPreview ? `<p><i>Report excerpt:</i><br/>${reportPreview}</p>` : '');

      const body = {
        subject: subject.trim(),
        details,
        assigneeId: assignee?.id || null,
        themeId: theme?.id || null,
        qaEngineerId: '005B0000003qLXSIA2',   // Chintan Desai
        productOwnerId: '005B0000000GdweIAC',  // Warren Holmes
      };

      const res = await fetch('/api/gus/create-work-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to create work item');
        setIsCreating(false);
        return;
      }

      setCreatedWI(data.workItem);
      setIsCreating(false);
      if (onCreated) onCreated(data.workItem);
    } catch (err) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  // ---- Render ----
  return (
    <div className="gus-dialog-backdrop" onClick={onClose}>
      <div className="gus-dialog" onClick={(e) => e.stopPropagation()}>
        {createdWI ? (
          /* Success state */
          <div className="gus-dialog-success">
            <div className="gus-dialog-success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3>Work Item Created</h3>
            <p className="gus-dialog-wi-name">{createdWI.name}</p>
            <p className="gus-dialog-wi-subject">{createdWI.subject}</p>
            <a
              href={createdWI.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Open in GUS
            </a>
            <button className="btn btn-outline btn-sm" onClick={onClose} style={{ marginLeft: 8 }}>
              Close
            </button>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="gus-dialog-header">
              <h3>Create GUS Work Item</h3>
              <button className="gus-dialog-close" onClick={onClose}>&times;</button>
            </div>

            <div className="gus-dialog-body">
              {/* Subject */}
              <label className="gus-field">
                <span className="gus-field-label">Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="gus-field-input"
                  placeholder="Work item subject..."
                />
              </label>

              {/* Assignee */}
              <div className="gus-field" ref={assigneeRef}>
                <span className="gus-field-label">
                  Assignee
                  {participantGusUsers.length > 0 && (
                    <span className="gus-field-hint"> ({participantGusUsers.length} participants matched)</span>
                  )}
                </span>
                <div className="gus-autocomplete-wrap">
                  <input
                    type="text"
                    value={assigneeQuery}
                    onChange={handleAssigneeChange}
                    onFocus={handleAssigneeFocus}
                    className="gus-field-input"
                    placeholder="Search by name..."
                  />
                  {assigneeLoading && <span className="gus-autocomplete-spinner" />}
                  {assignee && (
                    <span className="gus-selected-badge">
                      {assignee.name}
                      <button onClick={() => { setAssignee(null); setAssigneeQuery(''); }}>&times;</button>
                    </span>
                  )}
                </div>
                {showAssigneeDropdown && assigneeSuggestions.length > 0 && (
                  <ul className="gus-autocomplete-dropdown">
                    {assigneeSuggestions.map((u) => (
                      <li key={u.id} onClick={() => selectAssignee(u)} className={u.isParticipant ? 'gus-autocomplete-participant' : ''}>
                        <span className="gus-autocomplete-name">{u.name}</span>
                        <span className="gus-autocomplete-email">{u.email}</span>
                        {u.isParticipant && <span className="gus-autocomplete-tag">Participant</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Theme */}
              <div className="gus-field" ref={themeRef}>
                <span className="gus-field-label">Theme</span>
                <div className="gus-autocomplete-wrap">
                  <input
                    type="text"
                    value={themeQuery}
                    onChange={handleThemeChange}
                    onFocus={handleThemeFocus}
                    className="gus-field-input"
                    placeholder="Search themes..."
                  />
                  {themeLoading && <span className="gus-autocomplete-spinner" />}
                  {theme && (
                    <span className="gus-selected-badge">
                      {theme.name}
                      <button onClick={() => { setTheme(null); setThemeQuery(''); }}>&times;</button>
                    </span>
                  )}
                </div>
                {showThemeDropdown && themeSuggestions.length > 0 && (
                  <ul className="gus-autocomplete-dropdown">
                    {themeSuggestions.map((t) => (
                      <li key={t.id} onClick={() => selectTheme(t)}>
                        <span className="gus-autocomplete-name">{t.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Info */}
              <div className="gus-dialog-info">
                <p>Type: <strong>User Story</strong> | Team: <strong>CC-Chatty</strong> | Points: <strong>2</strong></p>
                <p>The spec report content will be included in the Details field.</p>
              </div>

              {error && <div className="gus-dialog-error">{error}</div>}
            </div>

            <div className="gus-dialog-footer">
              <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreate}
                disabled={isCreating || !subject.trim()}
              >
                {isCreating ? 'Creating...' : 'Create Work Item'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
