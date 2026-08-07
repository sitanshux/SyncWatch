import React from 'react';

/**
 * Official SyncWatch Logo Component
 * Luxury architectural logo with crisp geometry, warm gold accent, and sharp typography.
 */
export default function SyncWatchLogo({ variant = 'default', showText = true, className = '', iconSize = 28 }) {
  const isDark = variant === 'dark';
  const isMonochrome = variant === 'monochrome';
  const isGold = variant === 'gold' || variant === 'default';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Subtle Warm Gold Gradient */}
          <linearGradient id="logo-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5C158" />
            <stop offset="50%" stopColor="#C5A059" />
            <stop offset="100%" stopColor="#9E7B3B" />
          </linearGradient>

          {/* Monochrome Gradient */}
          <linearGradient id="logo-mono-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#A1A1A6" />
          </linearGradient>
        </defs>

        {/* Outer Architectural Framing Box */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="12"
          fill="none"
          stroke={isMonochrome ? 'rgba(255,255,255,0.15)' : 'rgba(197,160,89,0.25)'}
          strokeWidth="2"
        />

        {/* Base Play Triangle with smooth corners */}
        <path
          d="M 32 24 
             C 26 20, 20 24, 20 32 
             L 20 68 
             C 20 76, 26 80, 32 76 
             L 74 53 
             C 80 49, 80 47, 74 43 
             Z"
          fill={isMonochrome ? 'url(#logo-mono-grad)' : 'url(#logo-gold-grad)'}
        />

        {/* Precision Core Marker */}
        <circle cx="50" cy="50" r="3" fill="#08080A" />
      </svg>

      {/* Brand Text */}
      {showText && (
        <span
          className={`font-grotesk font-bold tracking-[0.24em] uppercase text-sm sm:text-base select-none ${
            isDark ? 'text-white' : 'text-[#F3F3F5]'
          }`}
          style={{ letterSpacing: '0.24em' }}
        >
          SYNC<span className="text-[#C5A059] font-extrabold">WATCH</span>
        </span>
      )}
    </div>
  );
}
