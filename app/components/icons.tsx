/** Small inline icons. Stroke uses currentColor so they inherit text colour. */
type P = { className?: string };
const base = (className = "") => ({
  className,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  "aria-hidden": true as const,
});

export const ArrowUp = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 20V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const StopSquare = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
  </svg>
);

export const Sparkle = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3v18M3 12h18M6.5 6.5l3 3M17.5 6.5l-3 3M6.5 17.5l3-3M17.5 17.5l-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const ChevronDown = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChevronRight = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Sliders = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 8h8M16 8h4M4 16h4M12 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="14" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="10" cy="16" r="2.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export const Copy = ({ className }: P) => (
  <svg {...base(className)}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Triangle = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 4l9 16H3L12 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 10v4M12 17.4v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const Cross = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const Shield = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

export const HalfCircle = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
  </svg>
);

export const Scale = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 4v16M6 8h12M6 8l-3 6a3 3 0 0 0 6 0L6 8zM18 8l-3 6a3 3 0 0 0 6 0l-3-6z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Plus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const FilePlus = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M13 3v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M12 12v5M9.5 14.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

export const Upload = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M12 16V4M7 9l5-5 5 5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Dots = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

export const Trash = ({ className }: P) => (
  <svg {...base(className)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Nodes = ({ className }: P) => (
  <svg {...base(className)}>
    <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="2" />
    <circle cx="18" cy="9" r="2.4" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="18" r="2.4" stroke="currentColor" strokeWidth="2" />
    <path d="M7.7 7.2 16 8.4M8 16l1-6M16.4 11 10.4 16.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const StencilIcon = ({ className }: P) => (
  <svg {...base(className)} fill="none">
    {/* outer frame with stencil bridges */}
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    {/* horizontal cutout line with bridges */}
    <line x1="3" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="15" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* vertical cutout line with bridges */}
    <line x1="12" y1="3" x2="12" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="12" y1="15" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
