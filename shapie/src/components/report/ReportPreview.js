import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWolfieConfig } from '../../services/wolfieConfig';
import { downloadClaudeSpec, generateClaudeSpec } from '../../services/claudeSpecGenerator';
import GusWorkItemDialog from '../shared/GusWorkItemDialog';
import SendToReviewDialog from '../shared/SendToReviewDialog';

/**
 * Convert a File (image) to a base64 data URL.
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract image files from a DataTransfer (drag/drop or paste).
 */
function getImageFiles(dataTransfer) {
  const files = [];
  if (dataTransfer.files) {
    for (const file of dataTransfer.files) {
      if (file.type.startsWith('image/')) {
        files.push(file);
      }
    }
  }
  return files;
}

/**
 * Insert text at the cursor position in a textarea, or append at end.
 */
function insertAtCursor(textarea, text) {
  if (!textarea) return { value: text, cursorPos: text.length };
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
  const suffix = after.length > 0 && !after.startsWith('\n') ? '\n' : '';
  return {
    value: before + prefix + text + suffix + after,
    cursorPos: start + prefix.length + text.length + suffix.length,
  };
}

/**
 * Render report markdown with inline images.
 * Converts ![alt](src) to <img> tags, keeps everything else as text.
 */
function renderMarkdownWithImages(text) {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = imgRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }
    const alt = match[1] || 'image';
    const src = match[2];
    parts.push(
      <span key={`i-${match.index}`} className="report-image-wrapper">
        {'\n'}
        <img src={src} alt={alt} className="report-inline-image" />
        {'\n'}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

export default function ReportPreview({ shape, config, onUpdateShape }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showGusDialog, setShowGusDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [linkedWI, setLinkedWI] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const textareaRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Load recordings for this shape
  const loadRecordings = useCallback(() => {
    if (!shape.id) return;
    fetch(`/api/recordings/${shape.id}`)
      .then((r) => r.json())
      .then((data) => setRecordings(data.recordings || []))
      .catch(() => {});
  }, [shape.id]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const deleteRecording = useCallback((filename) => {
    if (!window.confirm(`Delete recording "${filename}"?`)) return;
    fetch(`/api/recordings/${shape.id}/${filename}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setRecordings((prev) => prev.filter((r) => r.filename !== filename));
        }
      })
      .catch(() => {});
  }, [shape.id]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const processImageFiles = useCallback(async (files, textarea) => {
    const snippets = [];
    for (const file of files) {
      try {
        const dataUrl = await fileToDataUrl(file);
        const name = file.name.replace(/\.[^.]+$/, '') || 'image';
        snippets.push(`![${name}](${dataUrl})`);
      } catch (err) {
        console.error('[ReportPreview] Failed to read image:', err);
      }
    }
    if (snippets.length === 0) return;

    const markdownToInsert = snippets.join('\n\n');

    if (textarea) {
      const { value, cursorPos } = insertAtCursor(textarea, markdownToInsert);
      setDraft(value);
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.selectionStart = cursorPos;
          textarea.selectionEnd = cursorPos;
          textarea.focus();
        }
      });
    } else {
      const current = shape.report || '';
      const separator = current.length > 0 && !current.endsWith('\n') ? '\n\n' : current.length > 0 ? '\n' : '';
      onUpdateShape({ report: current + separator + markdownToInsert + '\n' });
    }
  }, [shape.report, onUpdateShape]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const images = getImageFiles(e.dataTransfer);
    if (images.length > 0) {
      processImageFiles(images, isEditing ? textareaRef.current : null);
    }
  }, [isEditing, processImageFiles]);

  const handlePaste = useCallback((e) => {
    const images = getImageFiles(e.clipboardData);
    if (images.length > 0) {
      e.preventDefault();
      processImageFiles(images, textareaRef.current);
    }
  }, [processImageFiles]);

  const handleEdit = () => {
    setDraft(shape.report || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateShape({ report: draft });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft('');
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // Preserve current recordings across the regeneration
    const savedRecordings = [...recordings];
    try {
      const wolfiePort = config.wolfiePort || 3099;
      const wolfieConfig = await fetchWolfieConfig(wolfiePort, 4000);
      const spec = generateClaudeSpec({
        shape,
        wolfieConfig,
        messages: [],
      });
      onUpdateShape({ report: spec });
      if (isEditing) {
        setDraft(spec);
      }
      // Restore recordings in case re-render cleared them
      setRecordings(savedRecordings);
    } catch (err) {
      console.error('[ReportPreview] Regenerate error:', err);
      alert(`Error regenerating: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    const content = shape.report || '';
    const name = `${slugify(shape.name || 'untitled')}.claude.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shape.report || '').then(
      () => alert('Copied to clipboard!'),
      () => alert('Failed to copy')
    );
  };

  if (!shape.report) {
    return (
      <div className="report-preview">
        {/* Show recordings even before a report exists */}
        {recordings.length > 0 && (
          <div className="report-recordings">
            <h3 className="report-recordings-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Recordings ({recordings.length})
            </h3>
            <div className="report-recordings-list">
              {recordings.map((rec) => (
                <div key={rec.filename} className="report-recording-card">
                  <video className="report-recording-video" src={rec.url} controls preload="metadata" />
                  <div className="report-recording-info">
                    <span className="report-recording-name">{rec.filename}</span>
                    <span className="report-recording-size">{(rec.size / (1024 * 1024)).toFixed(1)} MB</span>
                    <button className="report-recording-delete" onClick={() => deleteRecording(rec.filename)} title="Delete recording">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="report-empty">
          <h2>No report generated yet</h2>
          <p>Run a shaping session first, then generate a spec.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-preview">
      <div className="report-header">
        <h2>Spec Report</h2>
        <div className="report-actions">
          {isEditing ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Save
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={handleEdit}>
                ✏️ Edit
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleCopy}>
                Copy
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleDownload}>
                ⬇ Download
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                className="btn btn-secondary btn-sm review-send-btn"
                onClick={() => setShowReviewDialog(true)}
              >
                Send to Review
              </button>
              <button
                className="btn btn-primary btn-sm gus-create-btn"
                onClick={() => setShowGusDialog(true)}
              >
                Create WI
              </button>
            </>
          )}
        </div>
      </div>

      {/* Linked work item badge */}
      {linkedWI && (
        <div className="gus-linked-wi">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span>Linked: </span>
          <a href={linkedWI.url} target="_blank" rel="noopener noreferrer">
            {linkedWI.name}
          </a>
          <span className="gus-linked-wi-subject">{linkedWI.subject}</span>
        </div>
      )}
      {/* Recordings */}
      {recordings.length > 0 && (
        <div className="report-recordings">
          <h3 className="report-recordings-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Recordings ({recordings.length})
          </h3>
          <div className="report-recordings-list">
            {recordings.map((rec) => (
              <div key={rec.filename} className="report-recording-card">
                <video
                  className="report-recording-video"
                  src={rec.url}
                  controls
                  preload="metadata"
                />
                <div className="report-recording-info">
                  <span className="report-recording-name">{rec.filename}</span>
                  <span className="report-recording-size">
                    {(rec.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    className="report-recording-delete"
                    onClick={() => deleteRecording(rec.filename)}
                    title="Delete recording"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6" /><path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={dropZoneRef}
        className={`report-content ${isDragOver ? 'report-content--dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="report-drop-overlay">
            <div className="report-drop-overlay-inner">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Drop image here</span>
            </div>
          </div>
        )}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="report-editor"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            spellCheck={false}
          />
        ) : (
          <pre className="report-markdown" onDoubleClick={handleEdit}>
            {renderMarkdownWithImages(shape.report)}
          </pre>
        )}
      </div>

      {/* GUS Work Item dialog */}
      {showGusDialog && (
        <GusWorkItemDialog
          shape={shape}
          report={shape.report}
          onClose={() => setShowGusDialog(false)}
          onCreated={(wi) => {
            setLinkedWI(wi);
            onUpdateShape({ status: 'completed' });
          }}
        />
      )}

      {/* Send to Review dialog */}
      {showReviewDialog && (
        <SendToReviewDialog
          shape={shape}
          recordings={recordings}
          onClose={() => setShowReviewDialog(false)}
          onSent={() => {
            onUpdateShape({ status: 'under_review' });
          }}
        />
      )}
    </div>
  );
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}
