export const LoadingSkeleton = ({ rows = 3 }: { rows?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-card p-4 space-y-3">
          <div className="h-4 w-1/3 rounded bg-secondary animate-shimmer" style={{ backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--muted) / 0.5), transparent)" }} />
          <div className="h-3 w-2/3 rounded bg-secondary animate-shimmer" style={{ backgroundSize: "200% 100%", backgroundImage: "linear-gradient(90deg, transparent, hsl(var(--muted) / 0.5), transparent)" }} />
        </div>
      ))}
    </div>
  );
};
