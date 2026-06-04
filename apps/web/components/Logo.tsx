type Props = {
  size?: number;
  className?: string;
};

export function Logo({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vox-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill="url(#vox-grad)" />
      <path
        d="M20 9c-2.21 0-4 1.79-4 4v8c0 2.21 1.79 4 4 4s4-1.79 4-4v-8c0-2.21-1.79-4-4-4z"
        fill="#fff"
      />
      <path
        d="M14 19v2a6 6 0 0 0 5 5.91V30h-3a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.09A6 6 0 0 0 26 21v-2a1 1 0 1 0-2 0v2a4 4 0 0 1-8 0v-2a1 1 0 1 0-2 0z"
        fill="#fff"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="font-bold tracking-tight">Vox</span>
      <span className="font-bold tracking-tight text-brand">pense</span>
    </span>
  );
}
