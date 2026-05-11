import React, { useState, useCallback } from 'react';
import {
  generateChannelName,
  findChannel,
  sendChannelMessage,
  buildIntroMessage,
} from '../../services/slackChannel';

/**
 * Button that creates a Slack channel for a shape.
 *
 * Flow:
 * 1. User clicks "Create Slack Channel"
 * 2. We generate a channel name and show a dialog
 * 3. User clicks "Open Slack" which copies the name and opens Slack
 * 4. User creates the channel in Slack manually
 * 5. User clicks "I Created It" — we search for the channel, link it, and post intro
 */
export default function SlackChannelButton({ shape, onUpdate }) {
  const [state, setState] = useState('idle');
  // idle | naming | waiting | linking | done | error
  const [channelName, setChannelName] = useState('');
  const [linkedChannel, setLinkedChannel] = useState(shape.slackChannel || null);
  const [error, setError] = useState('');

  const handleStart = useCallback(() => {
    const name = generateChannelName(shape.name);
    setChannelName(name);
    setState('naming');
    setError('');
  }, [shape.name]);

  const handleCopyAndOpen = useCallback(() => {
    navigator.clipboard.writeText(channelName).catch(() => {});
    // Open Slack to workspace — user creates channel there
    window.open('https://app.slack.com', '_blank');
    setState('waiting');
  }, [channelName]);

  const handleVerify = useCallback(async () => {
    setState('linking');
    setError('');

    const channel = await findChannel(channelName);
    if (!channel) {
      setError(`Channel #${channelName} not found. Create it in Slack first, then try again.`);
      setState('waiting');
      return;
    }

    // Post intro message
    const participants = shape.participants || [];
    const message = buildIntroMessage(shape, participants);
    await sendChannelMessage(channel.channelId, message);

    // Save to shape
    const slackChannel = { name: channelName, channelId: channel.channelId };
    setLinkedChannel(slackChannel);
    onUpdate({ slackChannel });
    setState('done');
  }, [channelName, shape, onUpdate]);

  const handleOpenChannel = useCallback(() => {
    if (linkedChannel?.channelId) {
      window.open(`https://app.slack.com/client/T/${linkedChannel.channelId}`, '_blank');
    }
  }, [linkedChannel]);

  // Already linked
  if (linkedChannel || state === 'done') {
    const ch = linkedChannel || {};
    return (
      <div className="slack-channel-linked">
        <SlackIcon />
        <span className="slack-channel-name">#{ch.name}</span>
        <button className="btn btn-outline btn-sm" onClick={handleOpenChannel}>
          Open in Slack
        </button>
      </div>
    );
  }

  // Idle — show the create button
  if (state === 'idle') {
    return (
      <button className="btn btn-outline slack-create-channel-btn" onClick={handleStart}>
        <SlackIcon />
        Create Slack Channel
      </button>
    );
  }

  // Naming / Waiting / Linking flow
  return (
    <div className="slack-channel-flow">
      <div className="slack-channel-flow-header">
        <SlackIcon />
        <span>Create Slack Channel</span>
      </div>

      {/* Channel name input */}
      <div className="slack-channel-name-row">
        <span className="slack-channel-hash">#</span>
        <input
          type="text"
          className="slack-channel-name-input"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
        />
      </div>

      {error && <div className="slack-channel-error">{error}</div>}

      {state === 'naming' && (
        <div className="slack-channel-actions">
          <button className="btn btn-primary btn-sm" onClick={handleCopyAndOpen}>
            Copy Name & Open Slack
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setState('idle')}>
            Cancel
          </button>
        </div>
      )}

      {state === 'waiting' && (
        <div className="slack-channel-actions">
          <p className="slack-channel-hint">
            Create <strong>#{channelName}</strong> in Slack, then come back and verify:
          </p>
          <button className="btn btn-primary btn-sm" onClick={handleVerify}>
            I Created It — Link Channel
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleCopyAndOpen}>
            Open Slack Again
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setState('idle')}>
            Cancel
          </button>
        </div>
      )}

      {state === 'linking' && (
        <div className="slack-channel-actions">
          <span className="slack-channel-spinner" />
          <span>Finding channel...</span>
        </div>
      )}
    </div>
  );
}

function SlackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="slack-icon">
      <path d="M5.04 15.12a2.4 2.4 0 01-2.4 2.4 2.4 2.4 0 01-2.4-2.4 2.4 2.4 0 012.4-2.4h2.4v2.4zm1.2 0a2.4 2.4 0 012.4-2.4 2.4 2.4 0 012.4 2.4v6a2.4 2.4 0 01-2.4 2.4 2.4 2.4 0 01-2.4-2.4v-6z" fill="#E01E5A"/>
      <path d="M8.64 5.04a2.4 2.4 0 01-2.4-2.4 2.4 2.4 0 012.4-2.4 2.4 2.4 0 012.4 2.4v2.4H8.64zm0 1.2a2.4 2.4 0 012.4 2.4 2.4 2.4 0 01-2.4 2.4h-6a2.4 2.4 0 01-2.4-2.4 2.4 2.4 0 012.4-2.4h6z" fill="#36C5F0"/>
      <path d="M18.96 8.64a2.4 2.4 0 012.4-2.4 2.4 2.4 0 012.4 2.4 2.4 2.4 0 01-2.4 2.4h-2.4V8.64zm-1.2 0a2.4 2.4 0 01-2.4 2.4 2.4 2.4 0 01-2.4-2.4v-6a2.4 2.4 0 012.4-2.4 2.4 2.4 0 012.4 2.4v6z" fill="#2EB67D"/>
      <path d="M15.36 18.96a2.4 2.4 0 012.4 2.4 2.4 2.4 0 01-2.4 2.4 2.4 2.4 0 01-2.4-2.4v-2.4h2.4zm0-1.2a2.4 2.4 0 01-2.4-2.4 2.4 2.4 0 012.4-2.4h6a2.4 2.4 0 012.4 2.4 2.4 2.4 0 01-2.4 2.4h-6z" fill="#ECB22E"/>
    </svg>
  );
}
