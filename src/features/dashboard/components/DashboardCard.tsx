import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  accentColor?: "blue" | "gold" | "emerald" | "rose";
  delay?: number;
}

const accentMap = {
  blue: "text-primary glow-blue",
  gold: "text-accent glow-gold",
  emerald: "text-emerald-400",
  rose: "text-rose-400",
};

const iconBgMap = {
  blue: "bg-primary/10",
  gold: "bg-accent/10",
  emerald: "bg-emerald-500/10",
  rose: "bg-rose-500/10",
};

export const DashboardCard = ({ title, value, subtitle, icon: Icon, trend, accentColor = "blue", delay = 0 }: DashboardCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-3xl font-bold tracking-tight ${accentMap[accentColor]}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.positive ? "text-emerald-400" : "text-rose-400"}`}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconBgMap[accentColor]}`}>
          <Icon className={`h-5 w-5 ${accentMap[accentColor].split(" ")[0]}`} />
        </div>
      </div>
    </motion.div>
  );
};
