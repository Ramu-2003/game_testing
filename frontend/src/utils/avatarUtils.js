/**
 * Cyberpunk Avatar Utilities
 * Provides rich fallback avatars and safe loading handlers
 */

export const DEFAULT_AVATAR = '/assets/profile-images/male_human_01.png';

const createCyberSvg = (primary, secondary, visorColor = '#ffffff') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0e17"/>
        <stop offset="100%" stop-color="#141c2e"/>
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${secondary}"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="50" fill="url(#bg)"/>
    <circle cx="50" cy="50" r="47" fill="none" stroke="${primary}" stroke-width="2" opacity="0.8"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="${secondary}" stroke-width="1" stroke-dasharray="6,4" opacity="0.6"/>
    <path d="M50 20 C36 20 28 30 28 44 C28 54 35 62 45 64 L45 72 L30 79 C24 82 22 86 22 92 L78 92 C78 86 76 82 70 79 L55 72 L55 64 C65 62 72 54 72 44 C72 30 64 20 50 20 Z" fill="url(#glow)" opacity="0.9"/>
    <rect x="34" y="38" width="32" height="7" rx="3.5" fill="${visorColor}" opacity="0.95"/>
    <line x1="30" y1="41" x2="70" y2="41" stroke="${primary}" stroke-width="1.5" opacity="0.7"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const CYBER_AVATARS_MALE = [
  '/assets/profile-images/male_human_01.png',
  createCyberSvg('#00e5ff', '#3b82f6', '#ffffff'),
  createCyberSvg('#a855f7', '#6366f1', '#a855f7'),
  createCyberSvg('#10b981', '#06b6d4', '#10b981'),
  createCyberSvg('#ef4444', '#f97316', '#ffedd5'),
  createCyberSvg('#f59e0b', '#eab308', '#fef08a'),
  createCyberSvg('#ec4899', '#8b5cf6', '#fbcfe8'),
  createCyberSvg('#06b6d4', '#14b8a6', '#cffafe'),
  createCyberSvg('#8b5cf6', '#3b82f6', '#ddd6fe'),
  createCyberSvg('#14b8a6', '#10b981', '#a7f3d0'),
  createCyberSvg('#6366f1', '#a855f7', '#e0e7ff'),
  createCyberSvg('#f43f5e', '#ec4899', '#ffe4e6'),
];

export const CYBER_AVATARS_FEMALE = [
  '/assets/profile-images/human-051.png',
  createCyberSvg('#ec4899', '#a855f7', '#ffffff'),
  createCyberSvg('#00e5ff', '#8b5cf6', '#cffafe'),
  createCyberSvg('#10b981', '#3b82f6', '#a7f3d0'),
  createCyberSvg('#f59e0b', '#ef4444', '#fef08a'),
  createCyberSvg('#a855f7', '#ec4899', '#f3e8ff'),
  createCyberSvg('#38bdf8', '#818cf8', '#e0f2fe'),
  createCyberSvg('#f43f5e', '#fb7185', '#ffe4e6'),
  createCyberSvg('#2dd4bf', '#06b6d4', '#ccfbf1'),
  createCyberSvg('#c084fc', '#e879f9', '#fae8ff'),
  createCyberSvg('#fb923c', '#facc15', '#ffedd5'),
  createCyberSvg('#34d399', '#6ee7b7', '#d1fae5'),
];

export const handleAvatarError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = DEFAULT_AVATAR;
};
