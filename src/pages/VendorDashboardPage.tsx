import { useState } from "react";
import VendorTermsAcceptance from "@/components/VendorTermsAcceptance";
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
import { Loader2, Users, DollarSign, TrendingUp, FileText, Phone, Mail, MapPin, Home, Droplets, ShieldAlert, Wallet, MessageSquare, ClipboardList, CheckCircle2, PhoneCall, XCircle, StickyNote, Save, Settings, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  sent: "bg-purple-100 text-purple-800",
  contacted: "bg-yellow-100 text-yellow-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const systemTypeLabels: Record<string, string> = {
  "under-sink-carbon": "Under-Sink Carbon Filter",
  "reverse-osmosis": "Reverse Osmosis",
  "whole-house-carbon": "Whole House Filtration",
  "whole-house-combo": "Whole House Combo",
  "water-softener": "Water Softener",
  "uv-system": "UV Disinfection System",
  "reverse-osmosis-whole-home-filtration": "Reverse Osmosis (Whole Home)",
};

function formatSystemType(type: string) {
  return systemTypeLabels[type] || type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function VendorDashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [vendorNotes, setVendorNotes] = useState("");
  const queryClient = useQueryClient();

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ lead_status: status, status_updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-leads"] });
      setSelectedLead((prev: any) => prev ? { ...prev, lead_status: status } : null);
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

  // Terms acceptance gate — approved but haven't accepted terms yet
  if (!provider?.terms_accepted_at) {
    return (
      <VendorTermsAcceptance
        providerId={providerId!}
        onAccepted={() => queryClient.invalidateQueries({ queryKey: ["vendor-account"] })}
      />
    );
  }

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
          <div className="flex gap-2">
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
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Systems</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No leads yet</TableCell></TableRow>
              ) : leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                  <Badge className={`${statusColors[selectedLead.lead_status] || ""} text-xs ml-2`}>
                    {selectedLead.lead_status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
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
                    {selectedLead.budget && (
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Budget</p>
                          <p className="text-sm font-medium">{selectedLead.budget}</p>
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
                      { value: "won", label: "Won", icon: CheckCircle2, variant: "outline" as const },
                      { value: "lost", label: "Lost", icon: XCircle, variant: "outline" as const },
                    ].map(({ value, label, icon: Icon, variant }) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={selectedLead.lead_status === value ? "default" : variant}
                        className={selectedLead.lead_status === value ? "" : ""}
                        disabled={updateLeadStatus.isPending || selectedLead.lead_status === value}
                        onClick={() => updateLeadStatus.mutate({ id: selectedLead.id, status: value })}
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
