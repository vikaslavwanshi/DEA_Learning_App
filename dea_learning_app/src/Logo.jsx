export default function Logo({ height = 40 }) {
  const scale = height / 40;
  const w = Math.round(192 * scale);

  return (
    <svg width={w} height={height} viewBox="0 0 192 40" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* ── Icon badge ── */}
      <rect width="40" height="40" rx="10" fill="#0F172A"/>

      {/* Graduation cap */}
      <polygon points="20,6 12,10.5 20,15 28,10.5" fill="#F59E0B"/>
      <line x1="28" y1="10.5" x2="28" y2="16" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="28" cy="17.2" r="1.6" fill="#F59E0B"/>

      {/* Node 1 — Ingest (blue) */}
      <rect x="4" y="21" width="10" height="11" rx="2.5" fill="#1A6FD4"/>
      {/* cylinder lines */}
      <line x1="6" y1="24.5" x2="12" y2="24.5" stroke="white" strokeWidth="1.1" opacity="0.85"/>
      <line x1="6" y1="27.5" x2="12" y2="27.5" stroke="white" strokeWidth="1.1" opacity="0.6"/>

      {/* Connector */}
      <line x1="15" y1="26.5" x2="18.5" y2="26.5" stroke="#60A5FA" strokeWidth="1.3" strokeDasharray="1.8,1.2"/>

      {/* Node 2 — Transform (purple) — taller */}
      <rect x="15" y="19" width="10" height="15" rx="2.5" fill="#5B38C0"/>
      {/* lightning bolt */}
      <path d="M22 22 L19.5 26.5 L21.5 26 L19 32 L23.5 26 L21.5 26.5Z"
        fill="white" opacity="0.92"/>

      {/* Connector */}
      <line x1="26" y1="26.5" x2="29.5" y2="26.5" stroke="#60A5FA" strokeWidth="1.3" strokeDasharray="1.8,1.2"/>

      {/* Node 3 — Serve / Analytics (green) */}
      <rect x="26" y="21" width="10" height="11" rx="2.5" fill="#1A7F52"/>
      {/* rising bar chart */}
      <rect x="28" y="29" width="2" height="2" fill="white" opacity="0.9"/>
      <rect x="31" y="27" width="2" height="4" fill="white" opacity="0.9"/>
      <rect x="34" y="25" width="2" height="6" fill="white" opacity="0.9"/>

      {/* ── Wordmark ── */}
      {/* "DEA" */}
      <text x="50" y="24"
        fontFamily="'DM Sans','Segoe UI',system-ui,sans-serif"
        fontSize="17" fontWeight="700" fill="#0F172A" letterSpacing="-0.4">
        DEA
      </text>

      {/* tagline */}
      <text x="51" y="36"
        fontFamily="'DM Sans','Segoe UI',system-ui,sans-serif"
        fontSize="10.5" fontWeight="500" fill="#5A6480" letterSpacing="1.2">
        DATA ENGINEER LEARN
      </text>
    </svg>
  );
}
