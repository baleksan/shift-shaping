import React from 'react';

/**
 * Fat, happy Buddha mascot icon for Shapie.
 * Designed to look good at small sizes (28-40px) in the header
 * and also at larger sizes (160px) for hero/popover use.
 */
export default function BuddhaIcon({ size = 32, className, shape }) {
  // Background shape path based on the `shape` prop
  const backgroundShape = (() => {
    switch (shape) {
      case 'diamond':
        return <path d="M50 4 L92 50 L50 96 L8 50 Z" fill="#FFF3D6" />;
      case 'hexagon':
        return (
          <path
            d="M50 4 L87 20 L87 80 L50 96 L13 80 L13 20 Z"
            fill="#FFF3D6"
          />
        );
      case 'circle':
      default:
        return <circle cx="50" cy="50" r="48" fill="#FFF3D6" />;
    }
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Shapie Buddha mascot"
    >
      {/* Background shape */}
      {backgroundShape}

      {/* Warm inner glow */}
      <circle cx="50" cy="52" r="40" fill="#F5E6C8" opacity="0.5" />

      {/* Body - round belly */}
      <ellipse cx="50" cy="68" rx="22" ry="20" fill="#E8A040" />
      {/* Belly highlight */}
      <ellipse cx="50" cy="65" rx="15" ry="14" fill="#F5C563" />
      {/* Belly button / center detail */}
      <ellipse cx="50" cy="68" rx="3" ry="2.5" fill="#D4853B" opacity="0.5" />

      {/* Crossed legs */}
      <ellipse cx="38" cy="84" rx="12" ry="6" fill="#D4853B" />
      <ellipse cx="62" cy="84" rx="12" ry="6" fill="#D4853B" />
      {/* Leg overlap detail */}
      <ellipse cx="50" cy="85" rx="8" ry="4" fill="#E8A040" />

      {/* Feet peeking out */}
      <ellipse cx="30" cy="86" rx="5" ry="3" fill="#F5C563" />
      <ellipse cx="70" cy="86" rx="5" ry="3" fill="#F5C563" />

      {/* Arms - resting on belly/lap */}
      <path
        d="M28 62 Q24 68, 30 76 Q36 82, 42 80"
        stroke="#D4853B"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M72 62 Q76 68, 70 76 Q64 82, 58 80"
        stroke="#D4853B"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Hands */}
      <circle cx="42" cy="79" r="4" fill="#F5C563" />
      <circle cx="58" cy="79" r="4" fill="#F5C563" />

      {/* Robe / sash detail */}
      <path
        d="M34 55 Q50 60, 66 55"
        stroke="#D4853B"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Head */}
      <circle cx="50" cy="35" r="18" fill="#F5C563" />

      {/* Ears */}
      <ellipse cx="32" cy="36" rx="3.5" ry="5" fill="#F5C563" />
      <ellipse cx="68" cy="36" rx="3.5" ry="5" fill="#F5C563" />
      {/* Earlobes - long and dangling for Buddha */}
      <ellipse cx="32" cy="42" rx="2.5" ry="4" fill="#E8A040" />
      <ellipse cx="68" cy="42" rx="2.5" ry="4" fill="#E8A040" />

      {/* Topknot / bun */}
      <circle cx="50" cy="18" r="6" fill="#D4853B" />
      <circle cx="50" cy="14" r="3.5" fill="#E8A040" />

      {/* Eyes - closed/squinting happy expression */}
      <path
        d="M42 33 Q44 36, 46 33"
        stroke="#5C3A1E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M54 33 Q56 36, 58 33"
        stroke="#5C3A1E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rosy cheeks */}
      <circle cx="40" cy="38" r="3" fill="#E8A040" opacity="0.5" />
      <circle cx="60" cy="38" r="3" fill="#E8A040" opacity="0.5" />

      {/* Big happy smile */}
      <path
        d="M42 40 Q50 48, 58 40"
        stroke="#5C3A1E"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Dimples */}
      <path
        d="M41 40 Q40 42, 41 43"
        stroke="#5C3A1E"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M59 40 Q60 42, 59 43"
        stroke="#5C3A1E"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />

      {/* Glowing diamond / crystal in lap */}
      <defs>
        <linearGradient id="diamondGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#A8E6FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6DD5FA" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="diamondAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6DD5FA" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Diamond aura / glow */}
      <circle cx="50" cy="76" r="7" fill="url(#diamondAura)" />

      {/* Diamond shape */}
      <path
        d="M50 70 L54 76 L50 82 L46 76 Z"
        fill="url(#diamondGlow)"
        stroke="#4FC3F7"
        strokeWidth="0.8"
      />
      {/* Diamond facet highlight */}
      <path d="M50 70 L52 76 L50 74 Z" fill="white" opacity="0.6" />
      {/* Diamond sparkle */}
      <circle cx="48" cy="73" r="0.8" fill="white" opacity="0.8" />
      <circle cx="53" cy="78" r="0.6" fill="white" opacity="0.7" />
    </svg>
  );
}
