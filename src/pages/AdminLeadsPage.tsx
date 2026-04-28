import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, DollarSign, Users, TrendingUp, Settings, Trash2 } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { format } from "date-fns";
import { LEAD_TEMPERATURE_BADGE_CLASS, LEAD_TEMPERATURE_LABEL } from "@/lib/leadTemperature";

const LEAD_STATUSES = ["new", "sent", "contacted", "won", "lost"] as const;

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  contacted: "bg-yellow-100 text-yellow-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

export default function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTemperature, setFilterTemperature] = useState<string>("all");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceProvider, setInvoiceProvider] = useState<string>("");
  const [invoicePeriod, setInvoicePeriod] = useState({ start: "", end: "" });
  const [pricesDialogOpen, setPricesDialogOpen] = useState(false);
  const [ownerPrice, setOwnerPrice] = useState<string>("");
  const [rentalPrice, setRentalPrice] = useState<string>("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const RESET_PHRASE = "RESET TEST DATA";

  const { data: leadPrices = [] } = useQuery({
    queryKey: ["lead-prices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_prices").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: vendorEmailStats } = useQuery({
    queryKey: ["approved-vendor-email-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("name, contact_email")
        .eq("approval_status", "approved");
      if (error) throw error;
      const total = data?.length ?? 0;
      const missing = (data ?? []).filter((v) => !v.contact_email || !v.contact_email.trim());
      return { total, missing: missing.map((v) => v.name), missingCount: missing.length };
    },
  });

  const ownerLeadPrice = Number(leadPrices.find((p) => p.system_type === "owner_lead")?.price_per_lead ?? 85);
  const rentalLeadPrice = Number(leadPrices.find((p) => p.system_type === "rental_lead")?.price_per_lead ?? 50);

  const openPricesDialog = () => {
    setOwnerPrice(String(ownerLeadPrice));
    setRentalPrice(String(rentalLeadPrice));
    setPricesDialogOpen(true);
  };

  const updatePricesMutation = useMutation({
    mutationFn: async () => {
      const owner = Number(ownerPrice);
      const rental = Number(rentalPrice);
      if (!Number.isFinite(owner) || owner < 0) throw new Error("Owner price must be a positive number");
      if (!Number.isFinite(rental) || rental < 0) throw new Error("Rental price must be a positive number");

      const ownerChanged = owner !== ownerLeadPrice;
      const rentalChanged = rental !== rentalLeadPrice;

      if (ownerChanged) {
        const { error } = await supabase
          .from("lead_prices")
          .update({ price_per_lead: owner, updated_at: new Date().toISOString() })
          .eq("system_type", "owner_lead");
        if (error) throw error;
      }
      if (rentalChanged) {
        const { error } = await supabase
          .from("lead_prices")
          .update({ price_per_lead: rental, updated_at: new Date().toISOString() })
          .eq("system_type", "rental_lead");
        if (error) throw error;
      }

      // If anything actually changed, send notice emails to all approved vendors (effective immediately)
      if (ownerChanged || rentalChanged) {
        const effectiveDateDisplay = new Date().toLocaleDateString("en-AU", {
          day: "numeric", month: "long", year: "numeric",
        });
        const changes = [
          ownerChanged && { leadType: "Owner lead", oldPrice: ownerLeadPrice, newPrice: owner },
          rentalChanged && { leadType: "Rental lead", oldPrice: rentalLeadPrice, newPrice: rental },
        ].filter(Boolean);

        const { data: vendors } = await supabase
          .from("providers")
          .select("id, name, contact_email")
          .eq("approval_status", "approved")
          .not("contact_email", "is", null);

        const sends = (vendors || [])
          .filter((v) => v.contact_email)
          .map((v) =>
            supabase.functions.invoke("send-transactional-email", {
              body: {
                templateName: "vendor-price-change-notice",
                recipientEmail: v.contact_email,
                idempotencyKey: `price-change-${v.id}-${Date.now()}`,
                templateData: {
                  businessName: v.name,
                  effectiveDate: effectiveDateDisplay,
                  changes,
                },
              },
            })
          );
        await Promise.allSettled(sends);
        return { notified: vendors?.length || 0, effectiveDate: effectiveDateDisplay };
      }
      return { notified: 0, effectiveDate: null };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["lead-prices"] });
      if (res.effectiveDate && res.notified > 0) {
        toast.success(`Lead prices updated. ${res.notified} vendor${res.notified === 1 ? "" : "s"} notified — effective immediately.`);
      } else if (res.effectiveDate) {
        toast.success(`Lead prices updated — effective immediately. (No approved vendors with a contact email to notify.)`);
      } else {
        toast.success("No changes to save");
      }
      setPricesDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
        const price = Number(lead.lead_price) || (lead.ownership_status === "Rent" ? rentalLeadPrice : ownerLeadPrice);
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
        const price = Number(lead.lead_price) || (lead.ownership_status === "Rent" ? rentalLeadPrice : ownerLeadPrice);
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
    if (filterTemperature !== "all" && (l.lead_temperature || "") !== filterTemperature) return false;
    return true;
  });

  const resetTestDataMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("reset-test-data", {
        body: { confirm: RESET_PHRASE },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { ok: true; deleted: { leads: number; invoices: number } };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      setResetDialogOpen(false);
      setResetConfirmText("");
      toast.success(
        `Test data cleared — ${res.deleted.leads} lead(s), ${res.deleted.invoices} invoice(s) removed.`,
      );
    },
    onError: (e: Error) => toast.error(e.message || "Failed to reset test data"),
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.lead_status === "new").length,
    won: leads.filter((l) => l.lead_status === "won").length,
    revenue: invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0),
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      <div className="container max-w-7xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lead Tracking</h1>
            <p className="text-muted-foreground">Track leads, manage status, and generate invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openPricesDialog} className="gap-1">
              <Settings className="h-4 w-4" /> Lead Prices
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Reset Test Data
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
          <Select value={filterTemperature} onValueChange={setFilterTemperature}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All Temperatures" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Temperatures</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
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
                  <TableHead>Temp</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Systems</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Property Age</TableHead>
                  <TableHead>Water</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-8">No leads found</TableCell></TableRow>
                ) : filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{lead.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.provider_name}</TableCell>
                    <TableCell>
                      {lead.lead_temperature && LEAD_TEMPERATURE_LABEL[lead.lead_temperature as "hot" | "warm" | "cold"] ? (
                        <Badge
                          variant="outline"
                          className={`text-[10px] tracking-wide ${LEAD_TEMPERATURE_BADGE_CLASS[lead.lead_temperature as "hot" | "warm" | "cold"]}`}
                        >
                          {LEAD_TEMPERATURE_LABEL[lead.lead_temperature as "hot" | "warm" | "cold"]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {lead.installation_timeline || "—"}
                    </TableCell>
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
                      {(lead.concerns || []).includes("replacement") && (
                        <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] tracking-wide">
                          REPLACEMENT
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.property_age || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-col gap-1">
                        <span className="capitalize text-muted-foreground">{lead.water_source || "—"}</span>
                        {lead.water_tested_recently === "No, not tested" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] w-fit">
                            ⚠ Untested — UV likely
                          </Badge>
                        )}
                        {lead.water_usage_type && (
                          <span className="text-[10px] text-muted-foreground">{lead.water_usage_type}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                      {lead.maintenance_tolerance ? (
                        <span title={lead.maintenance_tolerance} className="line-clamp-2">
                          {lead.maintenance_tolerance}
                        </span>
                      ) : (
                        "—"
                      )}
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Lead prices are determined by the customer's property ownership status, set automatically when a quote request is submitted.
            </p>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <strong>30-day notice required (Terms 19.3).</strong> Saving will email all approved vendors immediately and the new pricing takes effect <strong>30 days from today</strong>. Until then, new leads continue to use the current rates.
            </div>
            {vendorEmailStats && vendorEmailStats.missingCount > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <strong>
                  {vendorEmailStats.missingCount} of {vendorEmailStats.total} approved vendor
                  {vendorEmailStats.total === 1 ? "" : "s"} won't be notified.
                </strong>{" "}
                The following are missing a contact email and will not receive the 30-day notice:
                <ul className="mt-1 ml-4 list-disc">
                  {vendorEmailStats.missing.slice(0, 8).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                  {vendorEmailStats.missing.length > 8 && (
                    <li>…and {vendorEmailStats.missing.length - 8} more</li>
                  )}
                </ul>
                <p className="mt-2">Add a contact email on each vendor's profile to ensure compliance.</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <Label htmlFor="owner-price">Owner lead price (AUD)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="owner-price"
                    type="number"
                    min="0"
                    step="1"
                    value={ownerPrice}
                    onChange={(e) => setOwnerPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customer owns their property (Own)</p>
              </div>
              <div>
                <Label htmlFor="rental-price">Rental lead price (AUD)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="rental-price"
                    type="number"
                    min="0"
                    step="1"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Customer is renting (Rent)</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPricesDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => updatePricesMutation.mutate()} disabled={updatePricesMutation.isPending}>
                {updatePricesMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={(open) => {
        setResetDialogOpen(open);
        if (!open) setResetConfirmText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset test data?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every lead and invoice flagged as
              <span className="font-mono"> is_test = true</span>. Real customer
              leads and invoices are not touched. This cannot be undone.
              <br /><br />
              Type <span className="font-mono font-semibold">{RESET_PHRASE}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
            placeholder={RESET_PHRASE}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetConfirmText !== RESET_PHRASE || resetTestDataMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                resetTestDataMutation.mutate();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetTestDataMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete test data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
