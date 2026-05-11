import React, { useState, useEffect, useCallback } from 'react';
import WolfieIcon from '../mascot/WolfieIcon';

/**
 * WolfieSelector — step between "Start Shaping Session" and the actual session.
 * User picks which Wolfie UI to use:
 *   - Current Wolfie (opens existing local instance as-is)
 *   - Sync to Latest (pulls latest from commerce-messaging-lightning-components, then opens)
 */
export default function WolfieSelector({ shape, config, onSelect }) {
  const [syncStatus, setSyncStatus] = useState(null); // null | { synced, commit, message, date }
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState('');

  const wolfiePort = config.wolfiePort || 3099;
  const wolfieUrl = `http://localhost:${wolfiePort}`;

  // Check current sync status on mount
  useEffect(() => {
    fetch('/api/wolfie/status')
      .then((r) => r.json())
      .then(setSyncStatus)
      .catch(() => setSyncStatus({ synced: false }));
  }, []);

  const openWolfie = useCallback(() => {
    const url = `${wolfieUrl}?shapie=${encodeURIComponent(shape.id)}&shapeName=${encodeURIComponent(shape.name || '')}`;
    window.open(url, `wolfie-${shape.id}`);
  }, [wolfieUrl, shape.id, shape.name]);

  const handleCurrentWolfie = useCallback(() => {
    openWolfie();
    onSelect('current_wolfie');
  }, [openWolfie, onSelect]);

  const handleSyncLatest = useCallback(async () => {
    setIsSyncing(true);
    setSyncError('');
    setSyncResult(null);

    try {
      const res = await fetch('/api/wolfie/sync', { method: 'POST' });
      const data = await res.json();

      if (!data.ok) {
        setSyncError(data.error || 'Sync failed');
        setIsSyncing(false);
        return;
      }

      setSyncResult(data.source);
      setSyncStatus({ synced: true, ...data.source });
      setIsSyncing(false);

      // Auto-open Wolfie after successful sync
      openWolfie();
      onSelect('sync_latest');
    } catch (err) {
      setSyncError(err.message);
      setIsSyncing(false);
    }
  }, [openWolfie, onSelect]);

  return (
    <div className="wolfie-selector">
      <h2 className="wolfie-selector-title">Select UI for Shaping</h2>
      <p className="wolfie-selector-desc">
        Choose which version of Wolfie to use for shaping <strong>{shape.name || 'this shape'}</strong>.
      </p>

      <div className="wolfie-selector-options">
        {/* Current Wolfie */}
        <button className="wolfie-option" onClick={handleCurrentWolfie}>
          <div className="wolfie-option-icon">
            <WolfieIcon size={72} />
          </div>
          <div className="wolfie-option-badge wolfie-option-badge--current">Current</div>
          <h3>Current Wolfie</h3>
          <p>Use Wolfie as-is at localhost:{wolfiePort}</p>
          {syncStatus?.synced && (
            <div className="wolfie-option-version">
              <span className="wolfie-commit">{syncStatus.commit}</span>
              <span className="wolfie-commit-msg">{syncStatus.message}</span>
            </div>
          )}
        </button>

        {/* Sync to Latest */}
        <button
          className="wolfie-option wolfie-option--update"
          onClick={handleSyncLatest}
          disabled={isSyncing}
        >
          <div className="wolfie-option-icon">
            <WolfieIcon size={72} />
            <div className="wolfie-option-update-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </div>
          </div>
          <div className="wolfie-option-badge wolfie-option-badge--latest">Latest</div>
          <h3>{isSyncing ? 'Syncing...' : 'Sync to Latest'}</h3>
          <p>Pull latest UI from<br/><strong>commerce-messaging-lightning-components</strong></p>
          {isSyncing && <div className="wolfie-option-progress"><span /></div>}
          {syncResult && !isSyncing && (
            <div className="wolfie-option-version wolfie-option-version--success">
              <span className="wolfie-commit">{syncResult.commit}</span>
              <span className="wolfie-commit-msg">{syncResult.message}</span>
              <span className="wolfie-commit-count">{syncResult.componentCount} LWC components</span>
            </div>
          )}
        </button>
      </div>

      {syncError && (
        <div className="wolfie-selector-error">
          <strong>Sync failed:</strong> {syncError}
        </div>
      )}
    </div>
  );
}
