import React, { useEffect, useRef } from 'react';

/**
 * ShapiePopover — a small popover showing the happy Buddha mascot
 * helping engineers and PMs shape product work.
 */
export default function ShapiePopover({ onClose }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay listener so the click that opened the popover doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="shapie-popover" ref={popoverRef}>
      <div className="shapie-popover-arrow" />
      <div className="shapie-popover-content">
        {/* Large Shapie illustration — Buddha at desk shaping work */}
        <svg
          width="160"
          height="160"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shapie-illustration"
          role="img"
          aria-label="Shapie the Buddha helping shape product work"
        >
          {/* Warm background */}
          <circle cx="100" cy="100" r="96" fill="#FFF8EC" />

          {/* Desk / table */}
          <rect x="30" y="142" width="140" height="8" rx="3" fill="#D4A06A" />
          <rect x="40" y="150" width="6" height="18" rx="2" fill="#C09060" />
          <rect x="154" y="150" width="6" height="18" rx="2" fill="#C09060" />

          {/* Whiteboard behind */}
          <rect x="120" y="20" width="55" height="45" rx="3" fill="#fff" stroke="#e0deda" strokeWidth="1.5" />
          {/* Whiteboard content — shapes */}
          <rect x="126" y="28" width="20" height="3" rx="1" fill="#e8a040" opacity="0.6" />
          <rect x="126" y="34" width="35" height="3" rx="1" fill="#d1d0cc" opacity="0.5" />
          <rect x="126" y="40" width="25" height="3" rx="1" fill="#d1d0cc" opacity="0.5" />
          <path d="M152 50 L158 56 L152 62 L146 56 Z" fill="#e8a040" opacity="0.4" />
          <rect x="126" y="48" width="14" height="3" rx="1" fill="#38a169" opacity="0.4" />

          {/* Sticky notes on desk */}
          <rect x="36" y="128" width="18" height="16" rx="1" fill="#FFE066" transform="rotate(-5 45 136)" />
          <rect x="38" y="132" width="10" height="1.5" rx="0.5" fill="#D4A030" transform="rotate(-5 43 132)" />
          <rect x="38" y="136" width="12" height="1.5" rx="0.5" fill="#D4A030" transform="rotate(-5 44 136)" />

          <rect x="52" y="130" width="16" height="14" rx="1" fill="#A8E6FF" transform="rotate(3 60 137)" />
          <rect x="54" y="133" width="10" height="1.5" rx="0.5" fill="#5ABCD8" transform="rotate(3 59 133)" />

          {/* Laptop on desk */}
          <rect x="68" y="120" width="48" height="22" rx="2" fill="#4A4A5A" />
          <rect x="71" y="123" width="42" height="16" rx="1" fill="#F5E6C8" />
          {/* Screen — shaped spec outline */}
          <rect x="74" y="126" width="18" height="2" rx="1" fill="#e8a040" />
          <rect x="74" y="130" width="28" height="2" rx="1" fill="#d1d0cc" />
          <rect x="74" y="134" width="22" height="2" rx="1" fill="#d1d0cc" />
          {/* Laptop base */}
          <rect x="60" y="142" width="62" height="4" rx="1" fill="#5A5A6A" />

          {/* Tea cup (not coffee — Buddha drinks tea) */}
          <rect x="132" y="130" width="12" height="12" rx="3" fill="#A8D8A8" />
          <path d="M144 133 Q149 133, 149 138 Q149 141, 144 141" stroke="#7CB87C" strokeWidth="1.5" fill="none" />
          {/* Steam */}
          <path d="M136 128 Q138 122, 136 118" stroke="#e8a040" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
          <path d="M140 126 Q142 120, 140 116" stroke="#e8a040" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />

          {/* --- Buddha body (sitting at desk) --- */}
          {/* Body — round and happy */}
          <ellipse cx="100" cy="118" rx="32" ry="24" fill="#E8A040" />
          {/* Belly highlight */}
          <ellipse cx="100" cy="115" rx="22" ry="18" fill="#F5C563" />
          {/* Belly detail */}
          <ellipse cx="100" cy="118" rx="4" ry="3" fill="#D4853B" opacity="0.3" />

          {/* Robe sash */}
          <path d="M72 105 Q100 112, 128 105" stroke="#D4853B" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Arms reaching to laptop */}
          <path d="M70 112 Q58 118, 66 128 Q70 134, 76 130" fill="#E8A040" stroke="#D4853B" strokeWidth="1" />
          <path d="M130 112 Q142 118, 134 128 Q130 134, 124 130" fill="#E8A040" stroke="#D4853B" strokeWidth="1" />
          {/* Hands on keyboard */}
          <ellipse cx="76" cy="132" rx="6" ry="4" fill="#F5C563" />
          <ellipse cx="124" cy="132" rx="6" ry="4" fill="#F5C563" />

          {/* Head */}
          <circle cx="100" cy="76" r="28" fill="#F5C563" />

          {/* Ears */}
          <ellipse cx="72" cy="78" rx="4" ry="6" fill="#F5C563" />
          <ellipse cx="128" cy="78" rx="4" ry="6" fill="#F5C563" />
          {/* Long earlobes */}
          <ellipse cx="72" cy="86" rx="3" ry="5" fill="#E8A040" />
          <ellipse cx="128" cy="86" rx="3" ry="5" fill="#E8A040" />

          {/* Topknot */}
          <circle cx="100" cy="50" r="8" fill="#D4853B" />
          <circle cx="100" cy="44" r="5" fill="#E8A040" />

          {/* Eyes — closed happy squint */}
          <path d="M86 72 Q90 76, 94 72" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M106 72 Q110 76, 114 72" stroke="#5C3A1E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Rosy cheeks */}
          <circle cx="82" cy="80" r="4" fill="#E8A040" opacity="0.4" />
          <circle cx="118" cy="80" r="4" fill="#E8A040" opacity="0.4" />

          {/* Nose */}
          <ellipse cx="100" cy="78" rx="2" ry="1.5" fill="#D4853B" opacity="0.5" />

          {/* Big happy smile */}
          <path d="M88 84 Q100 94, 112 84" stroke="#5C3A1E" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Dimples */}
          <path d="M87 84 Q86 86, 87 88" stroke="#5C3A1E" strokeWidth="1" strokeLinecap="round" fill="none" />
          <path d="M113 84 Q114 86, 113 88" stroke="#5C3A1E" strokeWidth="1" strokeLinecap="round" fill="none" />

          {/* Thought bubble */}
          <circle cx="40" cy="42" r="20" fill="white" stroke="#e8a040" strokeWidth="1.5" />
          <circle cx="56" cy="62" r="5" fill="white" stroke="#e8a040" strokeWidth="1" />
          <circle cx="62" cy="70" r="3" fill="white" stroke="#e8a040" strokeWidth="0.8" />
          {/* Diamond shape in thought bubble */}
          <path d="M35 34 L43 42 L35 50 L27 42 Z" fill="#e8a040" opacity="0.5" />
          <text x="46" y="46" fontSize="8" fill="#D4853B" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">shape</text>

          {/* Glowing diamond in lap */}
          <defs>
            <radialGradient id="popoverDiamondGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6DD5FA" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="128" r="6" fill="url(#popoverDiamondGlow)" />
          <path d="M100 123 L104 128 L100 133 L96 128 Z" fill="#A8E6FF" stroke="#4FC3F7" strokeWidth="0.8" />
          <path d="M100 123 L102 128 L100 126 Z" fill="white" opacity="0.6" />
        </svg>

        <h3 className="shapie-popover-name">Meet Shapie!</h3>
        <p className="shapie-popover-text">
          Your zen guide through the Shape Up process. Shapie helps teams
          sculpt raw ideas into focused pitches — cutting rabbit holes,
          hammering scope, and keeping appetite in check. Enlightenment
          through shipping.
        </p>
      </div>
    </div>
  );
}
