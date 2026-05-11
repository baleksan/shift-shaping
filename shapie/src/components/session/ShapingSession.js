import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { sendShapingMessage } from '../../services/shapingAgent';
import { fetchWolfieConfig } from '../../services/wolfieConfig';
import { downloadClaudeSpec } from '../../services/claudeSpecGenerator';
import BuddhaIcon from '../mascot/BuddhaIcon';

export default function ShapingSession({ shape, config, onUpdateShape, onViewReport }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build shape context for the agent (memoized)
  const shapeForAgent = useMemo(() => ({
    name: shape.name,
    problem: shape.problem,
    appetite: shape.appetite,
    scope: (shape.scope || []).map((s) => s.title).filter(Boolean),
    boundaries: [
      shape.solution?.boundaries,
      shape.solution?.noGos ? `No-gos: ${shape.solution.noGos}` : '',
    ].filter(Boolean).join('\n'),
  }), [shape.name, shape.problem, shape.appetite, shape.scope, shape.solution]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(({ role, content }) => ({ role, content }));
      const response = await sendShapingMessage(text, conversationHistory, shapeForAgent, {
        apiKey: config.llmApiKey,
        apiUrl: config.llmApiUrl,
        model: config.llmModel,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      console.error('[ShapingSession] Error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Sorry, I hit an error: ${err.message}. Check your API settings.`,
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, shapeForAgent, config]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateSpec = async () => {
    setIsGeneratingSpec(true);
    try {
      // Fetch Wolfie's current config (prompts, search, LLM settings)
      const wolfiePort = config.wolfiePort || 3099;
      const wolfieConfig = await fetchWolfieConfig(wolfiePort, 4000, { fresh: true });

      // Generate and download the .claude.md spec file
      const spec = downloadClaudeSpec({
        shape,
        wolfieConfig,
        messages,
      });

      // Also save the spec content to the shape's report field
      onUpdateShape({ report: spec });
      if (onViewReport) onViewReport();
    } catch (err) {
      console.error('[ShapingSession] Spec generation error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Couldn't generate spec: ${err.message}`,
        isError: true,
      }]);
    } finally {
      setIsGeneratingSpec(false);
    }
  };

  return (
    <div className="shaping-session">
      {/* Session header */}
      <div className="session-header">
        <div className="session-header-info">
          <h2>Shaping: {shape.name || 'Untitled'}</h2>
          <span className="session-appetite-tag">
            {shape.appetite === 'big_batch' ? '6 weeks' : '1-2 weeks'}
          </span>
        </div>
        <div className="session-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleGenerateSpec}
            disabled={isGeneratingSpec}
          >
            {isGeneratingSpec ? 'Collecting Wolfie config...' : '📋 Generate Spec'}
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="session-messages">
        {messages.length === 0 && (
          <div className="session-empty">
            <BuddhaIcon size={64} shape="diamond" />
            <p>Start shaping! Describe the problem, and I'll help you refine scope, spot rabbit holes, and hammer it into something shippable.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`session-msg session-msg--${msg.role} ${msg.isError ? 'session-msg--error' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="session-msg-avatar">
                <BuddhaIcon size={28} shape="diamond" />
              </div>
            )}
            <div className="session-msg-bubble">
              <div className="session-msg-content">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="session-msg session-msg--assistant">
            <div className="session-msg-avatar">
              <BuddhaIcon size={28} shape="diamond" />
            </div>
            <div className="session-msg-bubble">
              <div className="session-msg-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="session-input-area">
        <textarea
          className="session-input"
          placeholder="Describe the problem, suggest scope, ask for feedback..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary session-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
