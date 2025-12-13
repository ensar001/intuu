export default function TurkishFlag({ className = "w-6 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 1200 800"
      className={className}
      {...props}
    >
      <rect width="1200" height="800" fill="#E30A17" />
      <circle cx="425" cy="400" r="200" fill="#fff" />
      <circle cx="475" cy="400" r="160" fill="#E30A17" />
      <path
        d="M 580,400 L 620,382 L 600,420 L 638,428 L 600,436 L 620,474 L 580,456 L 560,494 L 560,450 L 522,468 L 540,430 L 522,392 L 560,410 L 560,366 Z"
        fill="#fff"
      />
    </svg>
  );
}
