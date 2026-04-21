import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

import { normalizeSystemTypeId } from "@/lib/canonicalSystemTypes";

const systemTypeLabels: Record<string, string> = {
  "under-sink-carbon": "Under-Sink Carbon",
  "reverse-osmosis": "Reverse Osmosis",
  "whole-house-filtration": "Whole House",
  "whole-house-combo": "Whole House Combo",
  "water-softener": "Water Softener",
  "uv-system": "UV",
  uv: "UV",
  hybrid: "Whole House Combo",
};

function shortSystem(s: string) {
  const normalized = normalizeSystemTypeId(s);
  return systemTypeLabels[normalized] || systemTypeLabels[s] || normalized.replace(/-/g, " ");
}

export interface LeadNotificationBellProps {
  newLeads: any[];
  hasUnseen: boolean;
  onOpenLead: (lead: any) => void;
  onSeen: () => void;
}

export default function LeadNotificationBell({
  newLeads,
  hasUnseen,
  onOpenLead,
  onSeen,
}: LeadNotificationBellProps) {
  const [open, setOpen] = useState(false);
  const count = newLeads.length;

  // Stop pulse once popover is opened
  useEffect(() => {
    if (open && hasUnseen) onSeen();
  }, [open, hasUnseen, onSeen]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={count > 0 ? `${count} new leads` : "No new leads"}
          className={`relative ${hasUnseen ? "animate-pulse ring-2 ring-primary/40" : ""}`}
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
          {count === 0 && hasUnseen && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b p-3">
          <p className="font-semibold text-sm">New Leads</p>
          <p className="text-xs text-muted-foreground">
            {count === 0 ? "You're all caught up." : `${count} since your last visit`}
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {count === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No new leads</p>
          ) : (
            newLeads.slice(0, 5).map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setOpen(false);
                  onOpenLead(lead);
                }}
                className="w-full border-b text-left p-3 hover:bg-muted/50 transition-colors last:border-b-0"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium truncate">{lead.customer_name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {[lead.customer_suburb, lead.customer_state].filter(Boolean).join(", ") || "—"}
                </p>
                {lead.recommended_systems?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {lead.recommended_systems.slice(0, 2).map((s: string) => (
                      <span
                        key={s}
                        className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {shortSystem(s)}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
