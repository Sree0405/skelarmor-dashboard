// features/dashboard/modules/leads/components/LeadCard.tsx

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, MessageSquare, ChevronRight } from "lucide-react";
import type { Lead } from "../types/lead";
import { getService } from "../types/lead";

type Props = {
  lead: Lead;
  index: number;
};

export function LeadCard({ lead, index }: Props) {
  const navigate = useNavigate();
  const svc      = getService(lead.service);
  const preview  = lead.message.length > 90
    ? lead.message.slice(0, 90) + "…"
    : lead.message;

  const formatted = new Date(lead.date).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => navigate(`/dashboard/admin/leads/${lead.id}`)}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border
                 bg-card/60 p-5 backdrop-blur-sm cursor-pointer
                 transition-all duration-200
                 hover:border-primary/40 hover:bg-surface-hover hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Name + email */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{lead.fullName}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[180px]">{lead.email}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Service badge + date */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <span>{svc.icon}</span>
          {svc.label}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{formatted}</span>
      </div>

      {/* Message preview */}
      {preview && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{preview}</span>
        </div>
      )}
    </motion.div>
  );
}
