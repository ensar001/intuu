export default function GermanFlag({ className = "w-6 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 5 3"
      className={className}
      {...props}
    >
      <rect width="5" height="3" fill="#000" />
      <rect width="5" height="2" y="1" fill="#D00" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}
