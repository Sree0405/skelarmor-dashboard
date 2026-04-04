import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/DatePicker";
import { GlassCard } from "../../components/GlassCard";
import { useAddProgress } from "./hooks/useCustomerQueries";

export type AddProgressCardProps = {
  userId: string | undefined;
  title?: string;
  description?: string;
  /** Distinct id when multiple pickers can exist on one page */
  datePickerId?: string;
};

export function AddProgressCard({
  userId,
  title = "Add progress",
  description,
  datePickerId = "add-progress-date",
}: AddProgressCardProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [fatPercentage, setFatPercentage] = useState("");
  const addProgressMut = useAddProgress();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const w = Number(weight);
    const f = Number(fatPercentage);
    if (Number.isNaN(w) || Number.isNaN(f)) {
      toast.error("Enter numeric weight and body fat %.");
      return;
    }
    try {
      await addProgressMut.mutateAsync({
        user: userId,
        date: date || undefined,
        weight: w,
        fat_percentage: f,
      });
      toast.success("Progress entry added.");
      setWeight("");
      setFatPercentage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add progress");
    }
  };

  if (!userId) {
    return (
      <GlassCard className="p-6" hoverable={false}>
        <p className="text-sm text-muted-foreground">Sign in to log progress.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6" hoverable={false}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {description ? (
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor={datePickerId} className="text-xs text-muted-foreground">
            Date
          </label>
          <div className="mt-1">
            <DatePicker
              id={datePickerId}
              value={date}
              onChange={setDate}
              placeholder="Select check-in date"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Weight (kg)</label>
            <input
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fat %</label>
            <input
              required
              value={fatPercentage}
              onChange={(e) => setFatPercentage(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
              inputMode="decimal"
            />
          </div>
        </div>
        <Button type="submit" disabled={addProgressMut.isPending}>
          {addProgressMut.isPending ? "Adding…" : "Add entry"}
        </Button>
      </form>
    </GlassCard>
  );
}
