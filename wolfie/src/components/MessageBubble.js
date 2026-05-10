import React from 'react';

export default function MessageBubble({ sender, content, children }) {
  const isRichContent = !!children;

  const bubbleClass = [
    'message-bubble',
    sender,
    isRichContent ? 'rich-content' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={bubbleClass} role="region" aria-live="polite">
      {children || <span dangerouslySetInnerHTML={{ __html: formatText(content) }} />}
    </div>
  );
}

function formatText(text) {
  if (!text) return '';
  // Simple markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
