import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Users, DollarSign, TrendingUp, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  contacted: "bg-yellow-100 text-yellow-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function VendorDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: vendorAccount, isLoading: vaLoading } = useQuery({
    queryKey: ["vendor-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("*, providers(*)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
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
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead_status === "new" || l.lead_status === "sent").length,
    won: leads.filter((l) => l.lead_status === "won").length,
    totalInvoiced: invoices.reduce((s, i) => s + Number(i.total_amount), 0),
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{provider?.name || "Vendor"} Dashboard</h1>
            <p className="text-muted-foreground">View your leads, track sales, and manage invoices</p>
          </div>
          <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/vendor/login"); }}>
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card><CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div><p className="text-sm text-muted-foreground">New / Pending</p><p className="text-2xl font-bold">{stats.new}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-green-500" />
            <div><p className="text-sm text-muted-foreground">Won</p><p className="text-2xl font-bold">{stats.won}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-8 w-8 text-amber-500" />
            <div><p className="text-sm text-muted-foreground">Total Invoiced</p><p className="text-2xl font-bold">${stats.totalInvoiced.toFixed(0)}</p></div>
          </CardContent></Card>
        </div>

        {/* Leads */}
        <h2 className="mb-3 text-lg font-semibold">Your Leads</h2>
        <Card className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Systems</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-xs">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{lead.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                    {lead.customer_mobile && <div className="text-xs text-muted-foreground">{lead.customer_mobile}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[lead.customer_suburb, lead.customer_state, lead.customer_postcode].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(lead.recommended_systems || []).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[lead.lead_status] || ""} text-xs`}>{lead.lead_status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
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
                <TableRow key={inv.id}>
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
    </div>
  );
}
