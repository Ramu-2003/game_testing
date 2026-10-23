// Premium 3D-styled crossed swords icon for HOST / Battle modes
export const Swords3DIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bladeGrad1" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="bladeEdge" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="hiltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9333ea" />
        <stop offset="100%" stopColor="#4c1d95" />
      </linearGradient>
      <filter id="swordGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
      </filter>
    </defs>
    
    <g filter="url(#swordGlow)">
      {/* Sword 1 (Bottom-left to Top-right) */}
      <g transform="translate(30, 70) rotate(45)">
        {/* Blade Base */}
        <path d="M-6,-45 L0,-75 L6,-45 Z" fill="url(#bladeGrad1)" />
        <path d="M-6,0 L-6,-45 L6,-45 L6,0 Z" fill="url(#bladeGrad1)" />
        {/* Blade Center Line / Edge highlight */}
        <path d="M0,0 L0,-75" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
        <path d="M-6,0 L-6,-45 L0,-75" stroke="#f1f5f9" strokeWidth="0.5" />
        {/* Crossguard */}
        <rect x="-18" y="-4" width="36" height="8" rx="4" fill="url(#hiltGrad)" />
        <circle cx="-18" cy="0" r="4" fill="#d8b4fe" />
        <circle cx="18" cy="0" r="4" fill="#d8b4fe" />
        {/* Grip */}
        <rect x="-5" y="4" width="10" height="18" fill="#1e293b" />
        <path d="M-5,4 L5,22 M-5,10 L5,28 M-5,16 L5,34" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        {/* Pommel */}
        <circle cx="0" cy="24" r="6" fill="url(#hiltGrad)" />
        <circle cx="0" cy="24" r="3" fill="#d8b4fe" opacity="0.6" />
      </g>
      
      {/* Sword 2 (Bottom-right to Top-left) */}
      <g transform="translate(70, 70) rotate(-45)">
        {/* Blade Base */}
        <path d="M-6,-45 L0,-75 L6,-45 Z" fill="url(#bladeGrad1)" />
        <path d="M-6,0 L-6,-45 L6,-45 L6,0 Z" fill="url(#bladeGrad1)" />
        {/* Blade Edge highlight */}
        <path d="M0,0 L0,-75" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
        <path d="M6,0 L6,-45 L0,-75" stroke="#f1f5f9" strokeWidth="0.5" />
        {/* Crossguard */}
        <rect x="-18" y="-4" width="36" height="8" rx="4" fill="url(#hiltGrad)" />
        <circle cx="-18" cy="0" r="4" fill="#d8b4fe" />
        <circle cx="18" cy="0" r="4" fill="#d8b4fe" />
        {/* Grip */}
        <rect x="-5" y="4" width="10" height="18" fill="#1e293b" />
        <path d="M-5,4 L5,22 M-5,10 L5,28 M-5,16 L5,34" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        {/* Pommel */}
        <circle cx="0" cy="24" r="6" fill="url(#hiltGrad)" />
        <circle cx="0" cy="24" r="3" fill="#d8b4fe" opacity="0.6" />
      </g>
    </g>
  </svg>
);

// Premium 3D-styled dart and target icon for GUEST / Join modes
export const Target3DIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="targetRed" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="70%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </radialGradient>
      <radialGradient id="targetWhite" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="70%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#94a3b8" />
      </radialGradient>
      <linearGradient id="dartBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="dartFeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <filter id="targetGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.5" />
      </filter>
      <filter id="dartShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="-2" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
      </filter>
    </defs>
    
    <g filter="url(#targetGlow)">
      {/* Target Base Rings */}
      {/* Outer Red Ring */}
      <circle cx="50" cy="56" r="32" fill="url(#targetRed)" />
      <circle cx="50" cy="56" r="32" stroke="#7f1d1d" strokeWidth="2" opacity="0.3" />
      {/* Middle White Ring */}
      <circle cx="50" cy="56" r="22" fill="url(#targetWhite)" />
      <circle cx="50" cy="56" r="22" stroke="#64748b" strokeWidth="1.5" opacity="0.3" />
      {/* Inner Red Bullseye */}
      <circle cx="50" cy="56" r="12" fill="url(#targetRed)" />
      {/* Bullseye Center highlight */}
      <circle cx="50" cy="56" r="4" fill="#fca5a5" opacity="0.8" />
      
      {/* Dart hit */}
      <g filter="url(#dartShadow)">
        <g transform="translate(52, 54) rotate(35)">
          {/* Metal tip (stuck into target) */}
          <path d="M0,0 L-4,-14 L4,-14 Z" fill="#94a3b8" />
          <path d="M0,0 L0,-14" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
          {/* Dart barrel */}
          <rect x="-3" y="-32" width="6" height="18" rx="2" fill="url(#dartBody)" />
          {/* Barrel grooves */}
          <path d="M-3,-28 L3,-28 M-3,-24 L3,-24 M-3,-20 L3,-20" stroke="#475569" strokeWidth="1.5" opacity="0.8" />
          {/* Feathers/Flight Base */}
          <rect x="-2" y="-40" width="4" height="8" fill="#1e293b" />
          {/* Feather Wings */}
          {/* Left Wing */}
          <path d="M-1,-34 L-12,-48 L-1,-42 Z" fill="url(#dartFeather)" />
          {/* Right Wing */}
          <path d="M1,-34 L12,-48 L1,-42 Z" fill="url(#dartFeather)" />
          {/* Center Wing (Facing viewer) */}
          <path d="M-2,-32 L-4,-50 L0,-46 L4,-50 L2,-32 Z" fill="#3b82f6" />
          <path d="M0,-32 L0,-46" stroke="#93c5fd" strokeWidth="1" />
        </g>
      </g>
    </g>
  </svg>
);
