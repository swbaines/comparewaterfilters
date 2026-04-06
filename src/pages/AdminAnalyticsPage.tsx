import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, TrendingUp, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { format, subDays, startOfDay } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import SubmissionsChart from "@/components/analytics/SubmissionsChart";
import LeadsByProviderChart from "@/components/analytics/LeadsByProviderChart";
import LeadsByStatusChart from "@/components/analytics/LeadsByStatusChart";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;
  const rounded = Math.round(change);
  if (rounded === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
  const positive = rounded > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positive ? "+" : ""}{rounded}%
    </span>
  );
}

function MetricCard({ title, value, icon: Icon, change }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; change: number | null }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <ChangeBadge change={change} />
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const since = rangeDays > 0
    ? startOfDay(subDays(new Date(), rangeDays)).toISOString()
    : "2000-01-01T00:00:00Z";

  // Previous period: same length window ending where current starts
  const prevSince = rangeDays > 0
    ? startOfDay(subDays(new Date(), rangeDays * 2)).toISOString()
    : null;

  // --- Current period queries ---
  const { data: quizSubmissions = [], isLoading: quizLoading } = useQuery({
    queryKey: ["analytics-quiz", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .select("id, created_at, state, ownership_status")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: quoteRequests = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["analytics-quotes", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, created_at, lead_status, lead_price, provider_name, ownership_status")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["analytics-invoices", since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, total_amount, status, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- Previous period queries (only when a finite range is selected) ---
  const { data: prevQuiz = [] } = useQuery({
    queryKey: ["analytics-quiz-prev", prevSince, since],
    enabled: !!prevSince,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_submissions")
        .select("id, created_at")
        .gte("created_at", prevSince!)
        .lt("created_at", since);
      if (error) throw error;
      return data;
    },
  });

  const { data: prevQuotes = [] } = useQuery({
    queryKey: ["analytics-quotes-prev", prevSince, since],
    enabled: !!prevSince,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, lead_status, created_at")
        .gte("created_at", prevSince!)
        .lt("created_at", since);
      if (error) throw error;
      return data;
    },
  });

  const { data: prevInvoices = [] } = useQuery({
    queryKey: ["analytics-invoices-prev", prevSince, since],
    enabled: !!prevSince,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, total_amount, status, created_at")
        .gte("created_at", prevSince!)
        .lt("created_at", since);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = quizLoading || quotesLoading || invoicesLoading;

  const totalQuizzes = quizSubmissions.length;
  const totalLeads = quoteRequests.length;
  const conversionRate = totalQuizzes > 0
    ? ((totalLeads / totalQuizzes) * 100).toFixed(1)
    : "0";
  const wonLeads = quoteRequests.filter((q) => q.lead_status === "won").length;
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount), 0);
  const pendingRevenue = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + Number(i.total_amount), 0);

  // Previous period metrics
  const prevQuizzes = prevQuiz.length;
  const prevLeads = prevQuotes.length;
  const prevConversion = prevQuizzes > 0 ? (prevLeads / prevQuizzes) * 100 : 0;
  const prevWon = prevQuotes.filter((q) => q.lead_status === "won").length;
  const prevRevenue = prevInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount), 0);

  const pctChange = (current: number, previous: number): number | null => {
    if (!prevSince) return null; // "All time" has no comparison
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // leads by provider
  const byProvider: Record<string, { total: number; won: number; revenue: number }> = {};
  quoteRequests.forEach((q) => {
    const name = q.provider_name;
    if (!byProvider[name]) byProvider[name] = { total: 0, won: 0, revenue: 0 };
    byProvider[name].total++;
    if (q.lead_status === "won") byProvider[name].won++;
    byProvider[name].revenue += Number(q.lead_price ?? 0);
  });

  // leads by status
  const byStatus: Record<string, number> = {};
  quoteRequests.forEach((q) => {
    byStatus[q.lead_status] = (byStatus[q.lead_status] || 0) + 1;
  });

  // leads by state
  const byState: Record<string, number> = {};
  quizSubmissions.forEach((q) => {
    const st = q.state || "Unknown";
    byState[st] = (byState[st] || 0) + 1;
  });

  return (
    <div>
      <AdminNav />
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Platform performance overview</p>
          </div>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r.days}
                size="sm"
                variant={rangeDays === r.days ? "default" : "outline"}
                onClick={() => setRangeDays(r.days)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard title="Quiz Completions" value={totalQuizzes} icon={Users} change={pctChange(totalQuizzes, prevQuizzes)} />
              <MetricCard title="Quote Requests" value={totalLeads} icon={FileText} change={pctChange(totalLeads, prevLeads)} />
              <MetricCard title="Conversion Rate" value={`${conversionRate}%`} icon={TrendingUp} change={pctChange(parseFloat(conversionRate), prevConversion)} />
              <MetricCard title="Won Leads" value={wonLeads} icon={BarChart3} change={pctChange(wonLeads, prevWon)} />
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue (Paid)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    <ChangeBadge change={pctChange(totalRevenue, prevRevenue)} />
                    {pendingRevenue > 0 && (
                      <span className="text-xs text-muted-foreground">${pendingRevenue} pending</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <SubmissionsChart quizSubmissions={quizSubmissions} quoteRequests={quoteRequests} />

            <div className="grid gap-6 lg:grid-cols-2">
              <LeadsByProviderChart byProvider={byProvider} />
              <LeadsByStatusChart byStatus={byStatus} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
