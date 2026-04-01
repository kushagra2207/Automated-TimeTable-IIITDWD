export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="IIIT Dharwad Scheduler"
    >
      {/* Outer square - institutional frame */}
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
      {/* Grid: 3 horizontal lines */}
      <line x1="8" y1="13" x2="32" y2="13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="8" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="8" y1="27" x2="32" y2="27" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
      {/* Accent dot at intersections */}
      <circle cx="8" cy="13" r="2" fill="currentColor" fillOpacity="0.9" />
      <circle cx="20" cy="20" r="2.5" fill="currentColor" />
      <circle cx="32" cy="27" r="2" fill="currentColor" fillOpacity="0.9" />
      {/* Bold I bars top/bottom */}
      <rect x="8" y="7" width="10" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="22" y="7" width="10" height="2.5" rx="1.25" fill="currentColor" />
      {/* Diagonal accent — the scheduler arrow */}
      <path d="M8 33 L26 9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="2 3" />
    </svg>
  );
}