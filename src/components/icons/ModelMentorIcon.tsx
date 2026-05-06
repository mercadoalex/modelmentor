export function ModelMentorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ModelMentor"
    >
      {/* Circuit-style M icon */}
      <path
        d="M20 75V25L35 45L50 25L65 45L80 25V75"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Circuit nodes */}
      <circle cx="35" cy="45" r="4" fill="currentColor" />
      <circle cx="50" cy="25" r="4" fill="currentColor" />
      <circle cx="65" cy="45" r="4" fill="currentColor" />
      {/* Connection lines */}
      <line x1="35" y1="45" x2="50" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <line x1="50" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}
