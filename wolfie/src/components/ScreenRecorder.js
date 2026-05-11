import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ScreenRecorder — records the browser tab or screen using MediaRecorder API,
 * then uploads the webm to the Shapie backend.
 *
 * Props:
 *   shapeId  — the Shapie shape ID (from URL ?shapie= param)
 *   shapieOrigin — Shapie's origin (default http://localhost:3100)
 */
export default function ScreenRecorder({ shapeId, shapieOrigin = 'http://localhost:3100' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState(null); // { filename, url }
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    setLastUpload(null);

    try {
      // Request screen capture — preferCurrentTab hints the browser to
      // offer the current tab as default
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
        preferCurrentTab: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Use VP9 if available, fall back to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 1500000, // 1.5 Mbps — good quality, manageable size
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        clearInterval(timerRef.current);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        // Build blob and upload
        const blob = new Blob(chunksRef.current, { type: mimeType });
        uploadRecording(blob);
      };

      // If the user stops sharing via browser UI (clicks "Stop sharing")
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
        setIsRecording(false);
      };

      recorder.start(1000); // collect chunks every 1s
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setDuration(0);

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

    } catch (err) {
      // User cancelled the screen picker or API error
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        setError(`Recording failed: ${err.message}`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const uploadRecording = useCallback(async (blob) => {
    if (!shapeId) {
      setError('No shape linked — recording not uploaded');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const filename = `wolfie-${timestamp}.webm`;

      const res = await fetch(
        `${shapieOrigin}/api/recordings/upload?shapeId=${encodeURIComponent(shapeId)}&filename=${encodeURIComponent(filename)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'video/webm' },
          body: blob,
        }
      );

      const data = await res.json();
      if (data.ok) {
        setLastUpload({
          filename: data.recording.filename,
          url: `${shapieOrigin}${data.recording.url}`,
          size: data.recording.size,
        });
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  }, [shapeId, shapieOrigin]);

  // Format duration as m:ss
  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!shapeId) return null; // Only show when linked to a Shapie shape

  return (
    <div className="screen-recorder">
      {isRecording ? (
        <button
          className="header-button recorder-button recorder-button--recording"
          onClick={stopRecording}
          title={`Recording ${formatDuration(duration)} — click to stop`}
        >
          <span className="recorder-dot" />
          <span className="recorder-time">{formatDuration(duration)}</span>
        </button>
      ) : isUploading ? (
        <button className="header-button recorder-button recorder-button--uploading" disabled title="Uploading recording...">
          <span className="recorder-spinner" />
        </button>
      ) : (
        <button
          className="header-button recorder-button"
          onClick={startRecording}
          title={lastUpload ? `Last: ${lastUpload.filename}` : 'Record screen for Shapie'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" fill={lastUpload ? '#22c55e' : '#ef4444'} stroke="none" />
          </svg>
        </button>
      )}
      {error && <span className="recorder-error" title={error}>!</span>}
    </div>
  );
}
