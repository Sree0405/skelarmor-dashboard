interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, description, action }: SectionHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4 min-w-0">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground break-words">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground break-words">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
