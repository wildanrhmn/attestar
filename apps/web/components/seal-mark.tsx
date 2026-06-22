export function SealMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="13.6" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeOpacity="0.28" strokeWidth="0.8" />
      <svg x="9" y="9" width="14" height="14" viewBox="0 0 24 24">
        <path
          d="M12 1.5c.3 4.8 1.9 6.4 6.7 6.7v.6c-4.8.3-6.4 1.9-6.7 6.7h-.6c-.3-4.8-1.9-6.4-6.7-6.7v-.6c4.8-.3 6.4-1.9 6.7-6.7z"
          fill="currentColor"
        />
      </svg>
    </svg>
  );
}
