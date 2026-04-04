import { ReactNode } from "react";
import { GlassCard } from "./GlassCard";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  delay?: number;
}

export const ChartContainer = ({ title, description, children, delay = 0 }: ChartContainerProps) => {
  return (
    <GlassCard className="p-6" delay={delay}>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </GlassCard>
  );
};
