import React from 'react';

/**
 * Friendly hand-drawn-style werewolf icon.
 * Designed to work at small sizes (24-40px) in the header.
 */
export default function WerewolfIcon({ size = 32, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Shopper Agent werewolf mascot"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#6B4FA0" />

      {/* Ears - pointed wolf ears */}
      <path d="M25 38 L18 12 L38 30 Z" fill="#8B6FC0" stroke="#4A3570" strokeWidth="1.5" />
      <path d="M75 38 L82 12 L62 30 Z" fill="#8B6FC0" stroke="#4A3570" strokeWidth="1.5" />
      {/* Inner ears */}
      <path d="M27 34 L22 16 L36 30 Z" fill="#D4A0E0" />
      <path d="M73 34 L78 16 L64 30 Z" fill="#D4A0E0" />

      {/* Head / face shape - rounded furry head */}
      <ellipse cx="50" cy="48" rx="28" ry="26" fill="#8B6FC0" />

      {/* Fur tufts on cheeks */}
      <path d="M22 45 Q18 42, 20 38 Q24 40, 26 44 Z" fill="#7B5FB0" />
      <path d="M78 45 Q82 42, 80 38 Q76 40, 74 44 Z" fill="#7B5FB0" />

      {/* Muzzle */}
      <ellipse cx="50" cy="54" rx="16" ry="12" fill="#D4A0E0" />

      {/* Eyes - friendly big eyes */}
      <ellipse cx="38" cy="42" rx="7" ry="7.5" fill="white" />
      <ellipse cx="62" cy="42" rx="7" ry="7.5" fill="white" />
      {/* Pupils */}
      <circle cx="40" cy="42" r="4" fill="#2D1B4E" />
      <circle cx="64" cy="42" r="4" fill="#2D1B4E" />
      {/* Eye shine */}
      <circle cx="42" cy="40" r="1.5" fill="white" />
      <circle cx="66" cy="40" r="1.5" fill="white" />

      {/* Eyebrows - friendly arched */}
      <path d="M30 34 Q38 30, 45 34" stroke="#4A3570" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M55 34 Q62 30, 70 34" stroke="#4A3570" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="50" cy="50" rx="4" ry="3" fill="#2D1B4E" />
      {/* Nose shine */}
      <ellipse cx="51.5" cy="49" rx="1.5" ry="1" fill="#5A3D7A" />

      {/* Mouth - friendly smile */}
      <path d="M42 57 Q50 64, 58 57" stroke="#4A3570" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Little fangs */}
      <path d="M43 57 L44 61 L46 57" fill="white" stroke="#4A3570" strokeWidth="0.5" />
      <path d="M54 57 L56 61 L57 57" fill="white" stroke="#4A3570" strokeWidth="0.5" />

      {/* Shopping bag held in paw (bottom) */}
      <rect x="56" y="68" width="18" height="16" rx="2" fill="#E8A598" stroke="#C07060" strokeWidth="1.5" />
      <path d="M61 68 Q61 62, 65 62 Q69 62, 69 68" stroke="#C07060" strokeWidth="1.5" fill="none" />
      {/* Bag detail */}
      <circle cx="65" cy="75" r="2" fill="#C07060" />

      {/* Paw holding the bag */}
      <ellipse cx="56" cy="74" rx="5" ry="4" fill="#8B6FC0" />
      <circle cx="53" cy="72" r="2" fill="#9B7FD0" />
      <circle cx="53" cy="76" r="2" fill="#9B7FD0" />
    </svg>
  );
}
