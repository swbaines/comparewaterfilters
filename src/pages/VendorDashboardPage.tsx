import { useEffect, useRef, useState } from "react";
import LegacyTermsDialog from "@/components/vendor/LegacyTermsDialog";
import LeadNotificationBell from "@/components/vendor/LeadNotificationBell";
import InsuranceExpiryBanner from "@/components/vendor/InsuranceExpiryBanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, DollarSign, TrendingUp, FileText, Phone, Mail, MapPin, Home, Droplets, ShieldAlert, Wallet, MessageSquare, ClipboardList, CheckCircle2, PhoneCall, XCircle, StickyNote, Save, Settings, Building2, Clock, X, ArrowUp, ArrowDown, AlertTriangle, FlaskConical, Wrench, Flame, CalendarClock, Sparkles } from "lucide-react";
import { LEAD_TEMPERATURE_BADGE_CLASS, LEAD_TEMPERATURE_LABEL, leadTemperatureRank } from "@/lib/leadTemperature";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-indigo-100 text-indigo-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

function estimatedLeadFee(ownership?: string | null): number {
  return ownership === "Rent" ? 50 : 85;
}

const systemTypeLabels: Record<string, string> = {
  "under-sink-carbon": "Under-Sink Carbon Filter",
  "reverse-osmosis": "Reverse Osmosis",
  "whole-house-filtration": "Whole House Filtration",
  "whole-house-combo": "Whole House Combo",
  "water-softener": "Water Softener",
  "uv-system": "UV Disinfection System",
  "reverse-osmosis-whole-home-filtration": "Reverse Osmosis (Whole Home)",
};

function formatSystemType(type: string) {
  return systemTypeLabels[type] || type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type TimePeriod = "today" | "month" | "year" | "all";

const PERIOD_STORAGE_KEY = "vendor-dashboard-period";

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

function getPeriodRange(period: TimePeriod): { start: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    return { start, prevStart, prevEnd: start };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, prevStart, prevEnd: start };
  }
  if (period === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    return { start, prevStart, prevEnd: start };
  }
  return { start: null, prevStart: null, prevEnd: null };
}

function filterByRange<T extends { created_at: string }>(items: T[], start: Date | null, end?: Date | null): T[] {
  if (!start) return items;
  return items.filter((i) => {
    const t = new Date(i.created_at).getTime();
    if (t < start.getTime()) return false;
    if (end && t >= end.getTime()) return false;
    return true;
  });
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function TrendBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-[11px] text-muted-foreground">vs prev: n/a</span>;
  if (change === 0) return <span className="text-[11px] text-muted-foreground">No change</span>;
  const up = change > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${up ? "text-green-600" : "text-red-600"}`}>
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}{Math.round(change)}%
    </span>
  );
}

export default function VendorDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [vendorNotes, setVendorNotes] = useState("");
  const [period, setPeriod] = useState<TimePeriod>(() => {
    if (typeof window === "undefined") return "month";
    const saved = window.localStorage.getItem(PERIOD_STORAGE_KEY) as TimePeriod | null;
    return saved && ["today", "month", "year", "all"].includes(saved) ? saved : "month";
  });
  useEffect(() => {
    try { window.localStorage.setItem(PERIOD_STORAGE_KEY, period); } catch { /* noop */ }
  }, [period]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  // Snapshot of last_dashboard_visit captured on mount, used for new-lead comparison
  // even after we update the DB timestamp.
  const [visitSnapshot, setVisitSnapshot] = useState<string | null | undefined>(undefined);
  const visitSnapshotSetRef = useRef(false);
  const queryClient = useQueryClient();

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status, currentLead }: { id: string; status: string; currentLead: any }) => {
      const updates: Record<string, any> = {
        lead_status: status,
        status_updated_at: new Date().toISOString(),
      };
      // Stamp first_response_at the first time vendor moves a lead out of "new"
      if (
        currentLead?.lead_status === "new" &&
        status !== "new" &&
        !currentLead?.first_response_at
      ) {
        updates.first_response_at = new Date().toISOString();
      }
      const { error } = await supabase.from("quote_requests").update(updates as any).eq("id", id);
      if (error) throw error;
      return updates;
    },
    onSuccess: (updates, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      setSelectedLead((prev: any) => prev ? { ...prev, lead_status: status, ...updates } : null);
    },
  });

  const saveVendorNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ vendor_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, notes }) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      setSelectedLead((prev: any) => prev ? { ...prev, vendor_notes: notes } : null);
      toast.success("Notes saved");
    },
  });
  const { data: vendorAccount, isLoading: vaLoading } = useQuery({
    queryKey: ["vendor-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("*, providers(*)")
        .eq("user_id", user!.id)
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  const providerId = vendorAccount?.provider_id;

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["vendor-leads", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("provider_id", providerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["vendor-invoices", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("provider_id", providerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stripeDetails } = useQuery({
    queryKey: ["vendor-stripe-details", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_stripe_details")
        .select("stripe_payment_method_id, direct_debit_authorised_at")
        .eq("provider_id", providerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Capture snapshot of last_dashboard_visit ONCE when vendorAccount first loads
  useEffect(() => {
    if (vendorAccount && !visitSnapshotSetRef.current) {
      setVisitSnapshot(vendorAccount.last_dashboard_visit ?? null);
      visitSnapshotSetRef.current = true;
    }
  }, [vendorAccount]);

  const updateLastVisit = useMutation({
    mutationFn: async () => {
      if (!vendorAccount?.id) return;
      const { error } = await supabase
        .from("vendor_accounts")
        .update({ last_dashboard_visit: new Date().toISOString() } as any)
        .eq("id", vendorAccount.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
    },
  });

  // Compute new leads (created after the snapshot)
  const newLeads = (() => {
    if (visitSnapshot === undefined) return [];
    if (visitSnapshot === null) return leads; // First visit ever: everything is new
    const snap = new Date(visitSnapshot).getTime();
    return leads.filter((l: any) => new Date(l.created_at).getTime() > snap);
  })();
  const hasUnseen = newLeads.length > 0 && !bannerDismissed;

  // After 3s on page, mark visit (only if there were unseen leads)
  useEffect(() => {
    if (!vendorAccount?.id || visitSnapshot === undefined) return;
    if (newLeads.length === 0) return;
    const t = setTimeout(() => {
      updateLastVisit.mutate();
    }, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorAccount?.id, visitSnapshot, newLeads.length]);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    updateLastVisit.mutate();
  };

  const scrollToLeads = () => {
    document.getElementById("vendor-leads-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    handleDismissBanner();
  };

  const handleOpenLeadFromBell = (lead: any) => {
    setSelectedLead(lead);
    setVendorNotes(lead.vendor_notes || "");
    handleDismissBanner();
  };

  const isLoading = vaLoading || leadsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendorAccount) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-2xl font-bold">No Vendor Account</h1>
        <p className="text-muted-foreground">Your account is not linked to any provider. Please contact the admin.</p>
        <Button variant="outline" onClick={async () => { await signOut(); navigate("/vendor/login"); }}>Sign Out</Button>
      </div>
    );
  }

  const provider = vendorAccount.providers as any;

  // Show pending approval state
  if (provider?.approval_status === "pending") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ClipboardList className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold">Application Under Review</h1>
        <p className="text-muted-foreground max-w-md">
          Your provider profile for <span className="font-semibold text-foreground">{provider.name}</span> is currently being reviewed by our team. You'll be able to access your dashboard once approved.
        </p>
        <Button variant="outline" onClick={async () => { await signOut(); navigate("/vendor/login"); }}>Sign Out</Button>
      </div>
    );
  }

  if (provider?.approval_status === "rejected") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">Application Not Approved</h1>
        <p className="text-muted-foreground max-w-md">
          Unfortunately, your provider profile was not approved at this time. Please contact us for more details.
        </p>
        <Button variant="outline" onClick={async () => { await signOut(); navigate("/vendor/login"); }}>Sign Out</Button>
      </div>
    );
  }

  // Legacy vendors (registered before the new four-checkbox flow) get a
  // non-blocking re-acceptance dialog rendered alongside the dashboard.
  const showLegacyTerms = !!(vendorAccount as any)?.legacy_terms;

  const { start: periodStart, prevStart, prevEnd } = getPeriodRange(period);
  const periodLeads = filterByRange(leads as any[], periodStart);
  const periodInvoices = filterByRange(invoices as any[], periodStart);
  const prevLeads = period === "all" ? [] : filterByRange(leads as any[], prevStart, prevEnd);
  const prevInvoices = period === "all" ? [] : filterByRange(invoices as any[], prevStart, prevEnd);

  const filteredLeads = periodLeads
    .slice()
    .sort((a, b) => {
      // 1. Hot leads first, then warm, then cold/none.
      const tempDiff = leadTemperatureRank(b.lead_temperature) - leadTemperatureRank(a.lead_temperature);
      if (tempDiff !== 0) return tempDiff;
      // 2. New / pending leads above closed ones.
      const aNew = a.lead_status === "new" || a.lead_status === "sent" ? 1 : 0;
      const bNew = b.lead_status === "new" || b.lead_status === "sent" ? 1 : 0;
      if (aNew !== bNew) return bNew - aNew;
      // 3. Most recent first.
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const computeStats = (ls: any[], invs: any[]) => {
    const responded = ls.filter((l) => l.first_response_at);
    const avgMs = responded.length
      ? responded.reduce((s, l) => s + (new Date(l.first_response_at).getTime() - new Date(l.created_at).getTime()), 0) / responded.length
      : 0;
    const won = ls.filter((l) => l.lead_status === "won").length;
    const closed = ls.filter((l) => l.lead_status === "won" || l.lead_status === "lost").length;
    const hotWaiting = ls.filter(
      (l) => l.lead_temperature === "hot" && (l.lead_status === "new" || l.lead_status === "sent"),
    ).length;
    return {
      total: ls.length,
      new: ls.filter((l) => l.lead_status === "new" || l.lead_status === "sent").length,
      won,
      totalInvoiced: invs.reduce((s, i) => s + Number(i.total_amount), 0),
      respondedCount: responded.length,
      avgResponseMs: avgMs,
      winRate: closed > 0 ? (won / closed) * 100 : 0,
      hasClosed: closed > 0,
      hotWaiting,
    };
  };

  const stats = computeStats(periodLeads, periodInvoices);
  const prevStats = computeStats(prevLeads, prevInvoices);
  const showCompare = period !== "all";
  const isToday = period === "today";
  const emptyToday = isToday && periodLeads.length === 0;
  const renderValue = (value: string | number) => emptyToday ? <span className="text-sm font-medium text-muted-foreground">No leads today yet</span> : <span className="text-2xl font-bold">{value}</span>;

  const formatResponseTime = (ms: number): string => {
    const minutes = ms / 60000;
    if (minutes < 60) return `Avg ${Math.round(minutes)} min`;
    const hours = minutes / 60;
    if (hours < 24) return `Avg ${hours.toFixed(1)} hours`;
    return `Avg ${(hours / 24).toFixed(1)} days`;
  };

  const responseColorClass = (ms: number): string => {
    const hours = ms / 3600000;
    if (hours < 2) return "text-green-600";
    if (hours <= 24) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      {showLegacyTerms && vendorAccount?.id && (
        <LegacyTermsDialog
          vendorAccountId={vendorAccount.id}
          onAccepted={() => queryClient.invalidateQueries({ queryKey: ["vendor-account"] })}
        />
      )}
      <div className="container max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{provider?.name || "Vendor"} Dashboard</h1>
            <p className="text-muted-foreground">View your leads, track sales, and manage invoices</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LeadNotificationBell
              newLeads={newLeads}
              hasUnseen={hasUnseen}
              onOpenLead={handleOpenLeadFromBell}
              onSeen={() => setBannerDismissed(true)}
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/vendor/profile")}>
              <Building2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/vendor/billing")}>
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/vendor/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/vendor/login"); }}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* New leads banner */}
        {hasUnseen && (
          <div className="mb-6 -mx-4 md:mx-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-none md:rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 animate-fade-in">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">You have {newLeads.length} new lead{newLeads.length === 1 ? "" : "s"}</span>{" "}
              since your last visit
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={scrollToLeads}>
                View leads
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismissBanner} aria-label="Dismiss">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <InsuranceExpiryBanner provider={provider} />

        {/* Billing not ready banner */}
        {(!stripeDetails?.stripe_payment_method_id || !stripeDetails?.direct_debit_authorised_at) && (
          <div className="mb-6 -mx-4 md:mx-0 flex flex-col md:flex-row md:items-start md:justify-between gap-3 rounded-none md:rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Billing setup required to receive matched leads
                </p>
                <p className="text-sm text-amber-800 mt-0.5">
                  {!stripeDetails?.stripe_payment_method_id && !stripeDetails?.direct_debit_authorised_at
                    ? "You haven't added a payment method or authorised direct debit yet."
                    : !stripeDetails?.stripe_payment_method_id
                      ? "You haven't added a payment method yet."
                      : "You haven't authorised direct debit yet."}
                  {" "}Until billing is complete, your profile won't appear in customer matches on the results page.
                </p>
              </div>
            </div>
            <Button size="sm" variant="default" className="md:self-center shrink-0" onClick={() => navigate("/vendor/billing")}>
              Set up billing
            </Button>
          </div>
        )}

        {/* Time period filter */}
        <div className="mb-4 -mx-4 md:mx-0 overflow-x-auto md:overflow-visible scrollbar-none">
          <div className="inline-flex md:flex w-max md:w-auto gap-1 rounded-md border bg-background p-0.5 px-4 md:px-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={period === opt.value ? "default" : "ghost"}
                className="h-8 px-3 text-xs whitespace-nowrap rounded-full md:rounded-md"
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className={stats.hotWaiting > 0 ? "border-red-300 bg-red-50/40" : ""}>
            <CardContent className="flex items-start gap-3 p-4">
              <Flame className={`h-8 w-8 shrink-0 ${stats.hotWaiting > 0 ? "text-red-600" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Hot leads waiting</p>
                {emptyToday ? (
                  <span className="text-sm font-medium text-muted-foreground">No leads today yet</span>
                ) : (
                  <span className={`text-2xl font-bold ${stats.hotWaiting > 0 ? "text-red-700" : ""}`}>
                    {stats.hotWaiting}
                  </span>
                )}
                {stats.hotWaiting > 0 && (
                  <p className="text-[11px] text-red-700 mt-0.5">Action these first</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <Users className="h-8 w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Total Leads</p>
              {renderValue(stats.total)}
              {showCompare && !emptyToday && <div className="mt-0.5"><TrendBadge change={pctChange(stats.total, prevStats.total)} /></div>}
            </div>
          </CardContent></Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">New / Pending</p>
              {renderValue(stats.new)}
              {showCompare && !emptyToday && <div className="mt-0.5"><TrendBadge change={pctChange(stats.new, prevStats.new)} /></div>}
            </div>
          </CardContent></Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <FileText className="h-8 w-8 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Won</p>
              {renderValue(stats.won)}
              {showCompare && !emptyToday && <div className="mt-0.5"><TrendBadge change={pctChange(stats.won, prevStats.won)} /></div>}
            </div>
          </CardContent></Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <DollarSign className="h-8 w-8 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              {emptyToday ? (
                <span className="text-sm font-medium text-muted-foreground">No leads today yet</span>
              ) : (
                <span className="text-2xl font-bold">${stats.totalInvoiced.toFixed(0)}</span>
              )}
              {showCompare && !emptyToday && <div className="mt-0.5"><TrendBadge change={pctChange(stats.totalInvoiced, prevStats.totalInvoiced)} /></div>}
            </div>
          </CardContent></Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <Clock className="h-8 w-8 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              {emptyToday ? (
                <p className="text-sm font-medium text-muted-foreground mt-1">No leads today yet</p>
              ) : stats.respondedCount >= 3 ? (
                <>
                  <p className={`text-2xl font-bold ${responseColorClass(stats.avgResponseMs)}`}>
                    {formatResponseTime(stats.avgResponseMs)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Faster responses win more leads</p>
                </>
              ) : (
                <p className="text-sm font-medium text-muted-foreground mt-1">Not enough data yet</p>
              )}
            </div>
          </CardContent></Card>
          <Card><CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Win Rate</p>
              {emptyToday ? (
                <span className="text-sm font-medium text-muted-foreground">No leads today yet</span>
              ) : stats.hasClosed ? (
                <span className="text-2xl font-bold">{Math.round(stats.winRate)}%</span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">No closed leads</span>
              )}
              {showCompare && !emptyToday && stats.hasClosed && prevStats.hasClosed && (
                <div className="mt-0.5"><TrendBadge change={pctChange(stats.winRate, prevStats.winRate)} /></div>
              )}
            </div>
          </CardContent></Card>
        </div>

        {/* Leads */}
        <div id="vendor-leads-section" className="mb-3 flex items-center justify-between gap-3 scroll-mt-4">
          <h2 className="text-lg font-semibold">Your Leads</h2>
          <span className="text-xs text-muted-foreground">
            {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
          </span>
        </div>
        <Card className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Systems</TableHead>
                <TableHead className="text-right">Est. Fee</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {period === "today" ? "No leads today yet" : period === "all" ? "No leads yet" : `No leads in ${PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase()}`}
                </TableCell></TableRow>
              ) : filteredLeads.map((lead) => {
                const isNew = lead.lead_status === "new" || lead.lead_status === "sent";
                return (
                <TableRow
                  key={lead.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors ${isNew ? "font-bold border-l-4 border-primary" : ""}`}
                  onClick={() => { setSelectedLead(lead); setVendorNotes(lead.vendor_notes || ""); }}
                >
                  <TableCell className="text-xs">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{lead.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    {lead.ownership_status === "Own" ? (
                      <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">Owner</Badge>
                    ) : lead.ownership_status === "Rent" ? (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Renter</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {(lead.concerns || []).includes("replacement") && (
                      <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] tracking-wide">REPLACEMENT</Badge>
                    )}
                    {lead.lead_temperature && LEAD_TEMPERATURE_LABEL[lead.lead_temperature as "hot" | "warm" | "cold"] && (
                      <Badge
                        variant="outline"
                        className={`ml-1 text-[10px] tracking-wide ${LEAD_TEMPERATURE_BADGE_CLASS[lead.lead_temperature as "hot" | "warm" | "cold"]}`}
                      >
                        {LEAD_TEMPERATURE_LABEL[lead.lead_temperature as "hot" | "warm" | "cold"]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[lead.customer_suburb, lead.customer_state, lead.customer_postcode].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(lead.recommended_systems || []).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{formatSystemType(s)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    ${estimatedLeadFee(lead.ownership_status)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[lead.lead_status] || ""} text-xs`}>{lead.lead_status}</Badge>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        {/* Invoices */}
        <h2 className="mb-3 text-lg font-semibold">Invoices</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices yet</TableCell></TableRow>
              ) : invoices.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedInvoice(inv)}
                >
                  <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{inv.period_start} — {inv.period_end}</TableCell>
                  <TableCell>{inv.lead_count}</TableCell>
                  <TableCell className="font-semibold">${Number(inv.total_amount).toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{inv.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Lead Details — {selectedLead.customer_name}</span>
                  <span className="flex items-center gap-2">
                    {(selectedLead.concerns || []).includes("replacement") && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] tracking-wide">
                        REPLACEMENT
                      </Badge>
                    )}
                    {selectedLead.lead_temperature && LEAD_TEMPERATURE_LABEL[selectedLead.lead_temperature as "hot" | "warm" | "cold"] && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] tracking-wide ${LEAD_TEMPERATURE_BADGE_CLASS[selectedLead.lead_temperature as "hot" | "warm" | "cold"]}`}
                      >
                        {LEAD_TEMPERATURE_LABEL[selectedLead.lead_temperature as "hot" | "warm" | "cold"]}
                      </Badge>
                    )}
                    <Badge className={`${statusColors[selectedLead.lead_status] || ""} text-xs ml-1`}>
                      {selectedLead.lead_status}
                    </Badge>
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
                  {(() => {
                    const pref = (selectedLead as any).contact_preference as string | null | undefined;
                    const map: Record<string, { Icon: typeof Phone; text: string }> = {
                      phone: { Icon: PhoneCall, text: "Prefers phone calls — okay to call anytime" },
                      sms: { Icon: MessageSquare, text: "Prefers SMS first — text before calling" },
                      email: { Icon: Mail, text: "Prefers email first — email before calling" },
                      no_preference: { Icon: Sparkles, text: "No preference — contact however suits you" },
                    };
                    const entry = pref && map[pref];
                    if (!entry) return null;
                    const { Icon, text } = entry;
                    return (
                      <div className="mb-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                        <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Preferred contact method</p>
                          <p className="text-sm font-semibold text-foreground">{text}</p>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${selectedLead.customer_email}`} className="text-sm font-medium text-primary hover:underline">
                          {selectedLead.customer_email}
                        </a>
                      </div>
                    </div>
                    {selectedLead.customer_mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Mobile</p>
                          <a href={`tel:${selectedLead.customer_mobile}`} className="text-sm font-medium text-primary hover:underline">
                            {selectedLead.customer_mobile}
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="text-sm font-medium">
                          {[selectedLead.customer_suburb, selectedLead.customer_state, selectedLead.customer_postcode].filter(Boolean).join(", ") || "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-sm font-medium">{format(new Date(selectedLead.created_at), "dd MMM yyyy 'at' h:mm a")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Property & Water Details */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Property & Water Details</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedLead.property_type && (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Property Type</p>
                          <p className="text-sm font-medium capitalize">{selectedLead.property_type}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.property_age && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Property Age</p>
                          <p className="text-sm font-medium">{selectedLead.property_age}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.household_size && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Household Size</p>
                          <p className="text-sm font-medium">{selectedLead.household_size} people</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.water_source && (
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Water Source</p>
                          <p className="text-sm font-medium capitalize">{selectedLead.water_source}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.water_tested_recently && (
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Water Tested (last 2 yrs)</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{selectedLead.water_tested_recently}</p>
                            {selectedLead.water_tested_recently === "No, not tested" && (
                              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] gap-1">
                                <AlertTriangle className="h-3 w-3" /> UV likely required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedLead.water_usage_type && (
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Water Usage</p>
                          <p className="text-sm font-medium">{selectedLead.water_usage_type}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.budget && (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium">{selectedLead.budget}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.maintenance_tolerance && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Wrench className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Maintenance preference</p>
                          <p className="text-sm font-medium">{selectedLead.maintenance_tolerance}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.installation_timeline && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <CalendarClock className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Installation timeline</p>
                          <p className="text-sm font-medium">{selectedLead.installation_timeline}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Water Concerns */}
                {selectedLead.concerns && selectedLead.concerns.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" /> Water Concerns
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.concerns.map((concern: string) => (
                          <Badge key={concern} variant="secondary" className="capitalize text-sm">
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Recommended Systems */}
                {selectedLead.recommended_systems && selectedLead.recommended_systems.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recommended Systems</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.recommended_systems.map((sys: string) => (
                          <Badge key={sys} className="bg-primary/10 text-primary border border-primary/20 text-sm">
                            {formatSystemType(sys)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Customer Message */}
                {selectedLead.message && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" /> Customer Message
                      </h3>
                      <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                        {selectedLead.message}
                      </div>
                    </div>
                  </>
                )}

                {/* Update Status */}
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "new", label: "New", icon: ClipboardList, variant: "outline" as const },
                      { value: "contacted", label: "Contacted", icon: PhoneCall, variant: "outline" as const },
                      { value: "quoted", label: "Quoted", icon: FileText, variant: "outline" as const },
                      { value: "won", label: "Won", icon: CheckCircle2, variant: "outline" as const },
                      { value: "lost", label: "Lost", icon: XCircle, variant: "outline" as const },
                    ].map(({ value, label, icon: Icon, variant }) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={selectedLead.lead_status === value ? "default" : variant}
                        className={selectedLead.lead_status === value ? "" : ""}
                        disabled={updateLeadStatus.isPending || selectedLead.lead_status === value}
                        onClick={() => updateLeadStatus.mutate({ id: selectedLead.id, status: value, currentLead: selectedLead })}
                      >
                        <Icon className="h-4 w-4 mr-1.5" />
                        {label}
                        {updateLeadStatus.isPending && updateLeadStatus.variables?.status === value && (
                          <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Vendor Notes */}
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <StickyNote className="h-4 w-4" /> Vendor Notes
                  </h3>
                  <Textarea
                    placeholder="Add follow-up notes, call outcomes, next steps..."
                    value={vendorNotes}
                    onChange={(e) => setVendorNotes(e.target.value)}
                    rows={3}
                    className="mb-2"
                  />
                  <Button
                    size="sm"
                    disabled={saveVendorNotes.isPending || vendorNotes === (selectedLead.vendor_notes || "")}
                    onClick={() => saveVendorNotes.mutate({ id: selectedLead.id, notes: vendorNotes })}
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Notes
                    {saveVendorNotes.isPending && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
                  </Button>
                </div>

                {/* Contact actions */}
                <Separator />
                <div className="flex gap-3">
                  {selectedLead.customer_mobile && (
                    <Button asChild size="sm">
                      <a href={`tel:${selectedLead.customer_mobile}`}>
                        <Phone className="h-4 w-4 mr-1.5" /> Call Customer
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <a href={`mailto:${selectedLead.customer_email}`}>
                      <Mail className="h-4 w-4 mr-1.5" /> Send Email
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedInvoice && (() => {
            const invoiceLeads = leads.filter((l) => {
              const leadDate = new Date(l.created_at);
              const start = new Date(selectedInvoice.period_start);
              const end = new Date(selectedInvoice.period_end);
              end.setDate(end.getDate() + 1);
              return leadDate >= start && leadDate < end;
            });

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>Invoice {selectedInvoice.invoice_number}</span>
                    <Badge variant="outline" className="capitalize ml-2">{selectedInvoice.status}</Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                  {/* Invoice Summary */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Period</p>
                      <p className="text-sm font-medium">{selectedInvoice.period_start} — {selectedInvoice.period_end}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Leads</p>
                      <p className="text-sm font-medium">{selectedInvoice.lead_count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold text-primary">${Number(selectedInvoice.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium capitalize">{selectedInvoice.status}</p>
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm rounded-lg bg-muted/50 p-3">{selectedInvoice.notes}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Lead Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Breakdown</h3>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>System</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Lead Fee</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceLeads.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                No leads found for this period
                              </TableCell>
                            </TableRow>
                          ) : invoiceLeads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <div className="text-sm font-medium">{lead.customer_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {[lead.customer_suburb, lead.customer_state].filter(Boolean).join(", ")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(lead.recommended_systems || []).map((s: string) => (
                                    <Badge key={s} variant="outline" className="text-xs">{formatSystemType(s)}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${statusColors[lead.lead_status] || ""} text-xs`}>{lead.lead_status}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                ${Number(lead.lead_price || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {invoiceLeads.length > 0 && (
                            <TableRow className="bg-muted/30 font-semibold">
                              <TableCell colSpan={3} className="text-right text-sm">Total</TableCell>
                              <TableCell className="text-right text-primary">
                                ${invoiceLeads.reduce((sum, l) => sum + Number(l.lead_price || 0), 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
