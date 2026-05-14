interface FakeShieldLogoProps {
  className?: string;
  compact?: boolean;
}

export default function FakeShieldLogo({ className = '', compact = false }: FakeShieldLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="logo-mark relative grid h-12 w-12 place-items-center rounded-2xl border border-cyan-200/30 bg-cyan-300/10 shadow-[0_0_28px_rgba(125,244,255,0.18)]">
        <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 64 64" fill="none">
          <path
            d="M32 5.5 53 13v15.2c0 14.7-8.1 25-21 30.3C19.1 53.2 11 42.9 11 28.2V13L32 5.5Z"
            className="fill-cyan-200/10 stroke-cyan-200"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M20 28h8l4-8 4 17 4-9h4"
            className="stroke-cyan-200"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23.5 43.5c2.5 2.4 5.3 4.4 8.5 5.9 3.2-1.5 6-3.5 8.5-5.9"
            className="stroke-emerald-300"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="32" cy="28" r="18" className="stroke-cyan-200/35" strokeWidth="1.5" strokeDasharray="4 5" />
          <text
            x="32"
            y="37"
            textAnchor="middle"
            className="fill-current text-[13px] font-bold text-cyan-50"
            fontFamily="Sora, Inter, sans-serif"
            letterSpacing="1"
          >
            FS
          </text>
        </svg>
      </span>

      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-2xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">
            FakeShield
          </span>
          <span className="mt-1 block font-display text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a3b2b3]">
            Truth Intelligence
          </span>
        </span>
      )}
    </span>
  );
}
