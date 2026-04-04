// features/dashboard/modules/leads/LeadDetail.tsx
// Mount at: /dashboard/admin/leads/:id

import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Mail, Phone, Briefcase,
  Clock, Calendar, MessageSquare, Loader2,
} from "lucide-react";
import { useLeadById } from "./hooks/useLeads";
import { getService }  from "./types/lead";

// ─── Detail row ───────────────────────────────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/60 last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, isError } = useLeadById(id);

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  // Not found / error
  if (isError || !lead) {
    return <Navigate to="/dashboard/admin/leads" replace />;
  }

  const svc = getService(lead.service);
  const formattedDate = new Date(lead.date).toLocaleString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        to="/dashboard/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                   hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden"
      >
        {/* Card header */}
        <div className="border-b border-border bg-secondary/20 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{lead.fullName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Lead #{lead.id}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5
                             text-sm font-medium text-primary">
              {svc.icon} {svc.label}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6">
          <DetailRow icon={User}          label="Full Name"  value={lead.fullName} />
          <DetailRow icon={Mail}          label="Email"      value={lead.email} />
          <DetailRow icon={Phone}         label="Phone"      value={lead.phone} />
          <DetailRow icon={Briefcase}     label="Service"    value={`${svc.icon} ${svc.label}`} />
          <DetailRow icon={Clock}         label="Time Slot"  value={lead.timeSlot} />
          <DetailRow icon={Calendar}      label="Submitted"  value={formattedDate} />
          <DetailRow icon={MessageSquare} label="Message"    value={lead.message} />
        </div>
      </motion.div>
    </div>
  );
}
