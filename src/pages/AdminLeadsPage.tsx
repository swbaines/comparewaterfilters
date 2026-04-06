import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, DollarSign, Users, TrendingUp, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const LEAD_STATUSES = ["new", "sent", "contacted", "won", "lost"] as const;

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  contacted: "bg-yellow-100 text-yellow-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function AdminLeadsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceProvider, setInvoiceProvider] = useState<string>("");
  const [invoicePeriod, setInvoicePeriod] = useState({ start: "", end: "" });
  const [pricesDialogOpen, setPricesDialogOpen] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["admin-providers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });


  const { data: invoices = [] } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ lead_status: status, status_updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead status updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!invoiceProvider || !invoicePeriod.start || !invoicePeriod.end) {
        throw new Error("Select a provider and date range");
      }
      const providerLeads = leads.filter(
        (l) =>
          l.provider_id === invoiceProvider &&
          l.lead_status !== "lost" &&
          !l.invoice_id &&
          new Date(l.created_at) >= new Date(invoicePeriod.start) &&
          new Date(l.created_at) <= new Date(invoicePeriod.end + "T23:59:59")
      );
      if (providerLeads.length === 0) throw new Error("No uninvoiced leads in this period");

      let totalAmount = 0;
      for (const lead of providerLeads) {
        // Use the lead_price set at quote submission (TEST: $1)
        const price = Number(lead.lead_price) || 1;
        totalAmount += price;
      }

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          provider_id: invoiceProvider,
          invoice_number: invoiceNumber,
          period_start: invoicePeriod.start,
          period_end: invoicePeriod.end,
          total_amount: totalAmount,
          lead_count: providerLeads.length,
          status: "draft",
        })
        .select()
        .single();
      if (invoiceError) throw invoiceError;

      for (const lead of providerLeads) {
        const price = Number(lead.lead_price) || 1;
        await supabase
          .from("quote_requests")
          .update({ invoice_id: invoice.id, lead_price: price })
          .eq("id", lead.id);
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      setInvoiceDialogOpen(false);
      toast.success("Invoice generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const filteredLeads = leads.filter((l) => {
    if (filterProvider !== "all" && l.provider_id !== filterProvider) return false;
    if (filterStatus !== "all" && l.lead_status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead_status === "new").length,
    won: leads.filter((l) => l.lead_status === "won").length,
    revenue: invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lead Tracking</h1>
            <p className="text-muted-foreground">Track leads, manage status, and generate invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/providers">
              <Button variant="outline" size="sm">Manage Providers</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setPricesDialogOpen(true)} className="gap-1">
              <Settings className="h-4 w-4" /> Lead Prices
            </Button>
            <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate("/admin/login"); }} className="gap-1">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card><CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div><p className="text-sm text-muted-foreground">Total Leads</p><p className="text-2xl font-bold">{stats.total}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div><p className="text-sm text-muted-foreground">New</p><p className="text-2xl font-bold">{stats.new}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-green-500" />
            <div><p className="text-sm text-muted-foreground">Won</p><p className="text-2xl font-bold">{stats.won}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-8 w-8 text-amber-500" />
            <div><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Providers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setInvoiceDialogOpen(true)} className="ml-auto gap-1">
            <FileText className="h-4 w-4" /> Generate Invoice
          </Button>
        </div>

        {/* Leads table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Systems</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No leads found</TableCell></TableRow>
                ) : filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{lead.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.provider_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(lead.recommended_systems || []).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${lead.ownership_status === "Rent" ? "bg-amber-50 text-amber-700 border-amber-200" : lead.ownership_status === "Own" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}`}>
                        {lead.ownership_status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={lead.lead_status}
                        onValueChange={(val) => updateStatusMutation.mutate({ id: lead.id, status: val })}
                      >
                        <SelectTrigger className="h-7 w-28">
                          <Badge className={`${statusColors[lead.lead_status] || ""} text-xs`}>{lead.lead_status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{lead.lead_price ? `$${Number(lead.lead_price).toFixed(0)}` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.invoice_id ? "✓" : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Invoices section */}
        {invoices.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Invoices</h2>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>{providers.find((p) => p.id === inv.provider_id)?.name || "—"}</TableCell>
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
        )}
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Provider</Label>
              <Select value={invoiceProvider} onValueChange={setInvoiceProvider}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Period Start</Label><Input type="date" value={invoicePeriod.start} onChange={(e) => setInvoicePeriod((p) => ({ ...p, start: e.target.value }))} /></div>
              <div><Label>Period End</Label><Input type="date" value={invoicePeriod.end} onChange={(e) => setInvoicePeriod((p) => ({ ...p, end: e.target.value }))} /></div>
            </div>
            <Button onClick={() => generateInvoiceMutation.mutate()} disabled={generateInvoiceMutation.isPending} className="w-full">
              {generateInvoiceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Invoice"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lead Prices Dialog */}
      <Dialog open={pricesDialogOpen} onOpenChange={setPricesDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lead Pricing</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Lead prices are determined by the customer's property ownership status, set automatically when a quote request is submitted.
            </p>
            <Table>
              <TableHeader><TableRow><TableHead>Lead Type</TableHead><TableHead>Price</TableHead><TableHead>Criteria</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Owner lead</TableCell>
                  <TableCell>$85</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Customer owns their property (Own)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Rental lead</TableCell>
                  <TableCell>$50</TableCell>
                  <TableCell className="text-muted-foreground text-sm">Customer is renting (Rent)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
