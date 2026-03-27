import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Users, DollarSign, TrendingUp, FileText, Phone, Mail, MapPin, Home, Droplets, ShieldAlert, Wallet, MessageSquare, ClipboardList } from "lucide-react";
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
  "whole-house-carbon": "Whole House Carbon",
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
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="text-xs">{format(new Date(lead.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{lead.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
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

                {/* Action buttons */}
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
    </div>
  );
}
