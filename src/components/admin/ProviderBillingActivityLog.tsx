import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, FilterX, History, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import type { DateRange } from "react-day-picker";

interface Props {
  providerId: string;
}

export default function ProviderBillingActivityLog({ providerId }: Props) {
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const { data: log = [], isLoading } = useQuery({
    queryKey: ["admin-billing-audit-log", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_audit_log")
        .select("id, event_type, created_at, actor_user_id, actor_ip, actor_user_agent, metadata")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return (log as any[]).filter((entry) => {
      if (eventFilter !== "all" && entry.event_type !== eventFilter) return false;
      if (dateRange?.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (new Date(entry.created_at) < from) return false;
      }
      if (dateRange?.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        if (new Date(entry.created_at) > to) return false;
      }
      return true;
    });
  }, [log, eventFilter, dateRange]);

  const filtersActive = eventFilter !== "all" || !!dateRange?.from || !!dateRange?.to;

  const renderEvent = (evt: string) => {
    if (evt === "payment_method_saved") return { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Payment method saved", tone: "border-green-200 bg-green-50 text-green-700" };
    if (evt === "payment_method_updated") return { icon: <RefreshCw className="h-3.5 w-3.5" />, label: "Payment method updated", tone: "border-blue-200 bg-blue-50 text-blue-700" };
    if (evt === "direct_debit_authorised") return { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Direct debit authorised", tone: "border-green-200 bg-green-50 text-green-700" };
    if (evt === "direct_debit_reauthorised") return { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Direct debit re-authorised", tone: "border-blue-200 bg-blue-50 text-blue-700" };
    return { icon: <History className="h-3.5 w-3.5" />, label: evt, tone: "border-border bg-muted text-muted-foreground" };
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue placeholder="All event types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All event types</SelectItem>
            <SelectItem value="payment_method_saved">Payment method saved</SelectItem>
            <SelectItem value="payment_method_updated">Payment method updated</SelectItem>
            <SelectItem value="direct_debit_authorised">Direct debit authorised</SelectItem>
            <SelectItem value="direct_debit_reauthorised">Direct debit re-authorised</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("h-9 justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>{format(dateRange.from, "d MMM yyyy")} – {format(dateRange.to, "d MMM yyyy")}</>
                ) : (
                  format(dateRange.from, "d MMM yyyy")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {filtersActive && (
          <Button variant="ghost" size="sm" className="h-9" onClick={() => { setEventFilter("all"); setDateRange(undefined); }}>
            <FilterX className="mr-1.5 h-4 w-4" /> Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {log.length} {log.length === 1 ? "event" : "events"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading activity…
        </div>
      ) : log.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No billing activity recorded yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No events match the current filters.</p>
      ) : (
        <ol className="relative border-l border-border ml-2 space-y-3 max-h-80 overflow-y-auto pr-2">
          {filtered.map((entry: any) => {
            const { icon, label, tone } = renderEvent(entry.event_type);
            const meta = (entry.metadata ?? {}) as Record<string, unknown>;
            return (
              <li key={entry.id} className="ml-4">
                <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-background border border-border">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </span>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className={tone}>
                    <span className="mr-1.5 inline-flex">{icon}</span>
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "d MMM yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 pl-1">
                  {entry.actor_user_id && (
                    <div>Actor user ID: <span className="font-mono">{entry.actor_user_id}</span></div>
                  )}
                  {entry.actor_ip && (
                    <div>IP: <span className="font-mono">{entry.actor_ip}</span></div>
                  )}
                  {entry.actor_user_agent && (
                    <div className="truncate" title={entry.actor_user_agent}>
                      Device: {entry.actor_user_agent}
                    </div>
                  )}
                  {Object.keys(meta).length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Metadata
                      </summary>
                      <pre className="mt-1 rounded bg-muted/50 p-2 text-[11px] overflow-x-auto">
                        {JSON.stringify(meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}