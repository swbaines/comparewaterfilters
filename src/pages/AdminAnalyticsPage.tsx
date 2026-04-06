import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { format, subDays, startOfDay } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

export default function AdminAnalyticsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const since = rangeDays > 0
    ? startOfDay(subDays(new Date(), rangeDays)).toISOString()
    : "2000-01-01T00:00:00Z";

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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Quiz Completions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalQuizzes}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Quote Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalLeads}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{conversionRate}%</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Won Leads</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">{wonLeads}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue (Paid)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                  {pendingRevenue > 0 && (
                    <p className="text-xs text-muted-foreground">${pendingRevenue} pending</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Breakdown tables */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* By Provider */}
              <Card>
                <CardHeader><CardTitle className="text-base">Leads by Provider</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Won</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byProvider).map(([name, v]) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium text-sm">{name}</TableCell>
                          <TableCell className="text-right">{v.total}</TableCell>
                          <TableCell className="text-right">{v.won}</TableCell>
                        </TableRow>
                      ))}
                      {Object.keys(byProvider).length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* By Status */}
              <Card>
                <CardHeader><CardTitle className="text-base">Leads by Status</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byStatus).map(([status, count]) => (
                        <TableRow key={status}>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                      {Object.keys(byStatus).length === 0 && (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* By State */}
              <Card>
                <CardHeader><CardTitle className="text-base">Quiz Submissions by State</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>State</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(byState)
                        .sort((a, b) => b[1] - a[1])
                        .map(([state, count]) => (
                          <TableRow key={state}>
                            <TableCell className="font-medium">{state}</TableCell>
                            <TableCell className="text-right">{count}</TableCell>
                          </TableRow>
                        ))}
                      {Object.keys(byState).length === 0 && (
                        <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
