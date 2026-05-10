import React, { useEffect, useRef } from 'react';

/**
 * WolfiePopover — a small popover showing Wolfie the werewolf
 * helping engineers and PMs shape software.
 */
export default function WolfiePopover({ onClose }) {
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
    <div className="wolfie-popover" ref={popoverRef}>
      <div className="wolfie-popover-arrow" />
      <div className="wolfie-popover-content">
        {/* Large Wolfie illustration */}
        <svg
          width="160"
          height="160"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="wolfie-illustration"
          role="img"
          aria-label="Wolfie the werewolf helping shape software"
        >
          {/* Soft background */}
          <circle cx="100" cy="100" r="96" fill="#F3EEFA" />

          {/* Desk / table */}
          <rect x="30" y="140" width="140" height="8" rx="3" fill="#C9A87C" />
          <rect x="40" y="148" width="6" height="20" rx="2" fill="#B89868" />
          <rect x="154" y="148" width="6" height="20" rx="2" fill="#B89868" />

          {/* Laptop on desk */}
          <rect x="65" y="118" width="50" height="22" rx="2" fill="#4A4A5A" />
          <rect x="68" y="121" width="44" height="16" rx="1" fill="#7EC8E3" />
          {/* Screen content — little code lines */}
          <rect x="71" y="124" width="20" height="2" rx="1" fill="#B5E8F7" />
          <rect x="71" y="128" width="30" height="2" rx="1" fill="#B5E8F7" />
          <rect x="71" y="132" width="15" height="2" rx="1" fill="#D4F1FF" />
          {/* Laptop base */}
          <rect x="58" y="140" width="64" height="4" rx="1" fill="#5A5A6A" />

          {/* Coffee mug */}
          <rect x="130" y="128" width="14" height="14" rx="3" fill="#E8A598" />
          <path d="M144 132 Q150 132, 150 138 Q150 142, 144 142" stroke="#C07060" strokeWidth="2" fill="none" />
          {/* Steam */}
          <path d="M134 126 Q136 120, 134 116" stroke="#D4A0E0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
          <path d="M139 124 Q141 118, 139 114" stroke="#D4A0E0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />

          {/* Sticky notes on desk */}
          <rect x="38" y="126" width="18" height="16" rx="1" fill="#FFE066" transform="rotate(-5 47 134)" />
          <rect x="40" y="130" width="10" height="1.5" rx="0.5" fill="#D4A030" transform="rotate(-5 45 130)" />
          <rect x="40" y="134" width="12" height="1.5" rx="0.5" fill="#D4A030" transform="rotate(-5 46 134)" />

          {/* --- Wolfie body (sitting at desk) --- */}
          {/* Body */}
          <ellipse cx="100" cy="120" rx="30" ry="22" fill="#8B6FC0" />

          {/* Arms reaching to laptop */}
          <path d="M72 115 Q60 120, 68 130 Q72 135, 78 132" fill="#8B6FC0" stroke="#7B5FB0" strokeWidth="1" />
          <path d="M128 115 Q140 120, 132 130 Q128 135, 122 132" fill="#8B6FC0" stroke="#7B5FB0" strokeWidth="1" />
          {/* Paws on keyboard */}
          <ellipse cx="78" cy="134" rx="6" ry="4" fill="#9B7FD0" />
          <ellipse cx="122" cy="134" rx="6" ry="4" fill="#9B7FD0" />

          {/* Head */}
          <ellipse cx="100" cy="80" rx="30" ry="28" fill="#8B6FC0" />

          {/* Ears */}
          <path d="M72 68 L62 35 L85 60 Z" fill="#8B6FC0" stroke="#6B4FA0" strokeWidth="1.5" />
          <path d="M128 68 L138 35 L115 60 Z" fill="#8B6FC0" stroke="#6B4FA0" strokeWidth="1.5" />
          <path d="M74 64 L66 42 L84 60 Z" fill="#D4A0E0" />
          <path d="M126 64 L134 42 L116 60 Z" fill="#D4A0E0" />

          {/* Muzzle */}
          <ellipse cx="100" cy="88" rx="17" ry="13" fill="#D4A0E0" />

          {/* Eyes — happy squinting */}
          <path d="M84 72 Q90 66, 96 72" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M104 72 Q110 66, 116 72" stroke="#2D1B4E" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Nose */}
          <ellipse cx="100" cy="83" rx="4.5" ry="3.5" fill="#2D1B4E" />
          <ellipse cx="101.5" cy="82" rx="1.5" ry="1" fill="#5A3D7A" />

          {/* Big happy smile */}
          <path d="M88 92 Q100 102, 112 92" stroke="#6B4FA0" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Little fangs */}
          <path d="M90 92 L91.5 97 L94 92" fill="white" stroke="#6B4FA0" strokeWidth="0.7" />
          <path d="M106 92 L108.5 97 L110 92" fill="white" stroke="#6B4FA0" strokeWidth="0.7" />

          {/* Cheek blush */}
          <circle cx="78" cy="84" r="5" fill="#E8A0C0" opacity="0.3" />
          <circle cx="122" cy="84" r="5" fill="#E8A0C0" opacity="0.3" />

          {/* Thought bubble */}
          <circle cx="155" cy="52" r="18" fill="white" stroke="#D4A0E0" strokeWidth="1.5" />
          <circle cx="142" cy="68" r="5" fill="white" stroke="#D4A0E0" strokeWidth="1" />
          <circle cx="137" cy="76" r="3" fill="white" stroke="#D4A0E0" strokeWidth="0.8" />
          {/* Shape/diamond in thought bubble */}
          <path d="M150 44 L158 52 L150 60 L142 52 Z" fill="#6B4FA0" opacity="0.6" />
          <text x="155" y="55" fontSize="8" fill="#6B4FA0" fontFamily="sans-serif" textAnchor="middle">ship</text>
        </svg>

        <h3 className="wolfie-name">Meet Wolfie!</h3>
        <p className="wolfie-text">
          Your friendly neighborhood shape-up buddy. Wolfie helps engineers and PMs
          sculpt rough ideas into shippable products — one bite-sized piece at a time.
          Don't worry, he only bites scope creep.
        </p>
      </div>
    </div>
  );
}
