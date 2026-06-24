interface LogoProps {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showTagline?: boolean;
  compact?: boolean;
}

export default function Logo({
  className = "",
  markClassName = "h-10 w-10",
  wordmarkClassName = "text-sm",
  showTagline = false,
  compact = false,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="VentureLift">
      <svg
        className={`shrink-0 ${markClassName}`}
        viewBox="0 0 96 96"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vl-orange" x1="14" y1="82" x2="86" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb4b00" />
            <stop offset="0.55" stopColor="#ff8a00" />
            <stop offset="1" stopColor="#ffb000" />
          </linearGradient>
          <linearGradient id="vl-steel" x1="40" y1="20" x2="82" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#7b8491" />
          </linearGradient>
          <filter id="vl-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d="M18 33 48 16l30 17v30L48 80 18 63z" fill="#060b15" stroke="url(#vl-orange)" strokeWidth="4" />
        <path d="M19 38c11 22 19 34 26 35 8 1 16-14 27-43" fill="none" stroke="url(#vl-orange)" strokeWidth="12" strokeLinecap="round" />
        <path d="M25 38c8 16 15 25 20 26" fill="none" stroke="#ff6a00" strokeWidth="5" strokeLinecap="round" />
        <path d="M58 55 75 27l12-6-2 13-18 27z" fill="url(#vl-steel)" stroke="#050812" strokeWidth="3" />
        <path d="M75 27 87 21l-2 13z" fill="#ff7a00" />
        <circle cx="73" cy="37" r="5" fill="#07101f" stroke="#ff6a00" strokeWidth="3" />
        <path d="M57 56 68 63" stroke="#f8fafc" strokeWidth="5" strokeLinecap="round" />
        <path d="M35 27v18M44 25v22M53 29v15M30 37h10M58 34h-8" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
        <g fill="#f8fafc">
          <circle cx="35" cy="27" r="3" /><circle cx="44" cy="25" r="3" /><circle cx="53" cy="29" r="3" /><circle cx="30" cy="37" r="3" />
        </g>
        <path d="M55 78h25M62 70v-9M70 70V55M78 70V48" stroke="url(#vl-steel)" strokeWidth="5" strokeLinecap="round" filter="url(#vl-glow)" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className={`font-black tracking-[0.18em] text-white font-heading ${wordmarkClassName}`}>
            VENTURE<span className="text-orange-500">LIFT</span>
          </div>
          {showTagline && <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-gray-400">Validate • Build • Connect • Grow</div>}
        </div>
      )}
    </div>
  );
}
