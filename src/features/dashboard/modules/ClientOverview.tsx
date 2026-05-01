import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  LineChart,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "../components/GlassCard";
import { PremiumStatCard } from "../components/PremiumStatCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../../Login/useAuth";
import { useCustomer, useCustomerPayments, useProgress } from "./customers/hooks/useCustomerQueries";
import { customerGoalBadgeKey, formatCustomerGoalLabel } from "./customers/goalConstants";
import { readCustomerWeight, readCustomerFatPct } from "./customers/types";
import { sumPaymentsByType } from "./customers/utils/paymentTotals";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

/** Training-client overview only. Franchise clients use `/features/dashboard/modules/franchise`. */
export const ClientOverview = () => {
  const { user } = useAuth();
  const { data: profile } = useCustomer(user?.id);
  const { data: trainingPayments = [] } = useCustomerPayments(user?.id);
  const { entries, latest } = useProgress(user?.id, 6);

  const trainingPaymentTotals = useMemo(
    () => sumPaymentsByType(trainingPayments),
    [trainingPayments]
  );

  const profileWeight = profile ? readCustomerWeight(profile) : null;
  const profileFat = profile ? readCustomerFatPct(profile) : null;
  const latestProgress = useMemo(
    () => [...entries].reverse().slice(0, 5),
    [entries]
  );

  const goalStr = typeof profile?.goal === "string" ? profile.goal.trim() : "";
  const goalLabel = goalStr
    ? `Goal: ${formatCustomerGoalLabel(goalStr)}`
    : "Set your goal with your coach";

  return (
    <div className="space-y-10 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <SectionHeader
          title={`Welcome back, ${user?.first_name || user?.email?.split("@")[0] || "there"}`}
          description="Your training snapshot — metrics, milestones, and billing at a glance."
        />
        <Button variant="outline" size="sm" className="shrink-0 gap-2 rounded-xl border-border/80 shadow-sm" asChild>
          <Link to="/dashboard/training/progress">
            <LineChart className="h-4 w-4" />
            Full progress
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </Link>
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumStatCard
          label="Current weight"
          value={
            latest?.weight != null
              ? `${latest.weight} kg`
              : profileWeight != null
                ? `${profileWeight} kg`
                : "—"
          }
          sublabel={goalLabel}
          icon={Scale}
          accent="blue"
          delay={0}
        />
        <PremiumStatCard
          label="Body fat"
          value={
            latest?.fatPercentage != null
              ? `${latest.fatPercentage}%`
              : profileFat != null
                ? `${profileFat}%`
                : "—"
          }
          sublabel="Latest Progress or profile"
          icon={Target}
          accent="amber"
          delay={0.06}
        />
        <PremiumStatCard
          label="Programme"
          value="Active"
          sublabel="Coached training plan"
          icon={Activity}
          accent="emerald"
          delay={0.12}
        />
        <PremiumStatCard
          label="Payments"
          value={formatCurrency(trainingPaymentTotals.totalPaid)}
          sublabel={`${formatCurrency(trainingPaymentTotals.totalPending)} outstanding`}
          icon={CreditCard}
          accent="rose"
          delay={0.18}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <GlassCard className="p-6 lg:col-span-2" hoverable={false} delay={0.22}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Profile focus
          </div>
          <p className="mt-4 text-sm leading-relaxed text-foreground/85">
            Stay consistent with Progress so your coach can tune your programme. Recent entries show how you are
            trending between sessions.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <StatusBadge status={customerGoalBadgeKey(typeof profile?.goal === "string" ? profile.goal : null)} />
            {profile?.subscription ? (
              <span className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {String(profile.subscription)}
              </span>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard className="p-0 overflow-hidden lg:col-span-3" hoverable={false} delay={0.26}>
          <div className="flex items-center justify-between gap-3 border-b border-border/50 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Recent Progress
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last five logged sessions</p>
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-2.5">
            {latestProgress.length > 0 ? (
              latestProgress.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.28 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className="group flex flex-col gap-3 rounded-2xl border border-border/55 bg-gradient-to-br from-secondary/40 via-secondary/15 to-transparent px-4 py-3.5 transition-colors hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/50 border border-white/5 text-xs font-semibold text-muted-foreground">
                      {new Date(entry.date).getDate()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">Logged Progress</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 sm:pr-1">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weight</p>
                      <p className="text-sm font-semibold tabular-nums text-primary">{entry.weight} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Body fat</p>
                      <p className="text-sm font-semibold tabular-nums text-amber-400">{entry.fatPercentage}%</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/10 px-6 py-14 text-center">
                <p className="text-sm text-muted-foreground">No Progress yet. Your coach will log progress after sessions.</p>
                <Button variant="link" className="mt-2 text-primary" asChild>
                  <Link to="/dashboard/training/progress">Open progress</Link>
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
