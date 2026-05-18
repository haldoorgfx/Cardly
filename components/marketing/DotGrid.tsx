interface DotGridProps {
  opacity?: number;
  size?: number;
  light?: boolean;
  className?: string;
}

export function DotGrid({ opacity = 0.06, size = 24, light = false, className = '' }: DotGridProps) {
  const color = light ? `rgba(255,255,255,${opacity})` : `rgba(15,31,24,${opacity})`;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}
