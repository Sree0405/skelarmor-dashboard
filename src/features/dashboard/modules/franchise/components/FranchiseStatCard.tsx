import type { LucideIcon } from "lucide-react";
import { PremiumStatCard, type PremiumStatAccent } from "@/features/dashboard/components/PremiumStatCard";

type Accent = Exclude<PremiumStatAccent, "rose">;

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  accent: Accent;
  delay?: number;
};

/** Franchise overview stats — uses shared premium card (rose not used here). */
export function FranchiseStatCard({ accent, ...rest }: Props) {
  return <PremiumStatCard {...rest} accent={accent} />;
}
