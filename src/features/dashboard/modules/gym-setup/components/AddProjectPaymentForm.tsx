import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/DatePicker";
import { GlassCard } from "@/features/dashboard/components/GlassCard";
import { useAddProjectPayment } from "../hooks/useProjectQueries";

type Props = {
  projectId: string;
};

export function AddProjectPaymentForm({ projectId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("paid");
  const [notes, setNotes] = useState("");
  const mut = useAddProjectPayment();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await mut.mutateAsync({
        projectId,
        amount: amt,
        date: date || null,
        type,
        notes: notes.trim() || null,
      });
      toast.success("Payment recorded. Project totals updated.");
      setAmount("");
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add payment");
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6" hoverable={false}>
      <h3 className="text-sm font-semibold text-foreground mb-4">Add payment</h3>
      <form onSubmit={onSubmit} className="space-y-3 w-full max-w-lg min-w-0">
        <div>
          <label htmlFor="proj-pay-date" className="text-xs text-muted-foreground">
            Date
          </label>
          <div className="mt-1">
            <DatePicker id="proj-pay-date" value={date} onChange={setDate} placeholder="Payment date" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount (INR)</label>
          <input
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-primary/40"
          >
            <option value="paid">paid</option>
            <option value="pending">pending</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/40 resize-y min-h-[3.5rem]"
            placeholder="Optional"
          />
        </div>
        <Button type="submit" disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Add payment"}
        </Button>
      </form>
    </GlassCard>
  );
}
