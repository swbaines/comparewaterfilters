import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink, FileText, X, Download } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ── Stripe publishable key ────────────────────────────────────────────────────
const stripePromise = loadStripe("pk_test_51TGc4tFU68zxLrQXO6emd9pwIuhsswQvxP20juxUrRgoJEFfMy2ZFHjZR5bee7E5kt7WaAdlH8weeFtcv56UORqY00rUvp2yi0");

const LEAD_PRICES = [
  { type: "Owner lead", price: "$85", description: "Customer owns their property" },
  { type: "Rental lead", price: "$50", description: "Customer is renting" },
];

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  sent: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-700",
  overdue: "bg-red-100 text-red-800",
};

// ── Card setup form (inside Stripe Elements) ──────────────────────────────────
function CardSetupForm({
  stripeCustomerId,
  onSuccess,
}: {
  stripeCustomerId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-setup-intent", {
        body: { stripe_customer_id: stripeCustomerId },
      });

      if (error || !data?.client_secret) {
        throw new Error(error?.message || "Failed to create setup intent");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        data.client_secret,
        { payment_method: { card: cardElement } }
      );

      if (stripeError) throw new Error(stripeError.message);
      if (!setupIntent?.payment_method) throw new Error("No payment method returned");

      // Save payment method via edge function (uses service role to bypass RLS)
      const { error: saveError } = await supabase.functions.invoke("save-payment-method", {
        body: { payment_method_id: setupIntent.payment_method as string },
      });

      if (saveError) throw new Error(saveError.message || "Failed to save payment method");

      toast.success("Card saved successfully — you're all set for automatic billing");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 bg-background">
        <CardElement
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
              invalid: { color: "#9e2146" },
            },
          }}
        />
      </div>

      <Button type="submit" disabled={!stripe || saving} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Save card
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

// ── Main billing page ─────────────────────────────────────────────────────────
export default function VendorBillingPage() {
  const [provider, setProvider] = useState<any>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Fetch leads for the selected invoice's billing period
  const { data: invoiceLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["invoice-leads", selectedInvoice?.id],
    enabled: !!selectedInvoice && !!provider?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, customer_name, customer_email, customer_suburb, customer_state, recommended_systems, lead_price, created_at")
        .eq("provider_id", provider.id)
        .gte("created_at", new Date(selectedInvoice.period_start).toISOString())
        .lte("created_at", new Date(selectedInvoice.period_end + "T23:59:59").toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const fetchProvider = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: va } = await supabase
        .from("vendor_accounts")
        .select("provider_id")
        .eq("user_id", user.id)
        .single();

      if (!va) return;

      const { data: prov } = await supabase
        .from("providers")
        .select("id, name, contact_email, approval_status, stripe_customer_id, stripe_payment_method_id")
        .eq("id", va.provider_id)
        .single();

      setProvider(prov);
      setCardSaved(!!(prov as any)?.stripe_payment_method_id);
    };

    fetchProvider();
  }, [cardSaved]);

  const { data: invoices = [] } = useQuery({
    queryKey: ["vendor-invoices", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leadsThisMonth = [] } = useQuery({
    queryKey: ["vendor-leads-this-month", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, lead_price, recommended_systems")
        .eq("provider_id", provider.id)
        .neq("lead_status", "lost")
        .gte("created_at", firstOfMonth);
      if (error) throw error;
      return data;
    },
  });

  const estimatedThisMonth = leadsThisMonth.reduce((sum: number, l: any) => {
    if (l.lead_price) return sum + Number(l.lead_price);
    // Fallback: Owner = $85, Rental = $50
    return sum + 85;
  }, 0);

  const lastMonthInvoice = invoices[0];
  const outstanding = invoices
    .filter((inv: any) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-5xl py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing &amp; lead pricing</h1>
          <p className="text-muted-foreground">
            You are invoiced on the 1st of each month for leads received. Payment is due within 14 days.
          </p>
        </div>

        {/* Warning banners */}
        {provider?.stripe_customer_id && !cardSaved && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>No payment method on file.</strong> Add a card below to enable automatic billing and avoid overdue invoices.
              </span>
              <Button
                variant="destructive"
                size="sm"
                className="ml-4 shrink-0"
                onClick={() => {
                  setShowCardForm(true);
                  document.getElementById("payment-method-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" /> Add card now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {outstanding > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>You have ${outstanding.toFixed(2)} in outstanding invoices.</strong> Please ensure your payment method is up to date to avoid service interruptions.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Leads this month</p>
              <p className="text-2xl font-bold">{leadsThisMonth.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Est. this month</p>
              <p className="text-2xl font-bold">${estimatedThisMonth.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Last invoice</p>
              <p className="text-2xl font-bold">
                {lastMonthInvoice ? `$${Number(lastMonthInvoice.total_amount).toFixed(0)}` : "$0"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className={`text-2xl font-bold ${outstanding > 0 ? "text-destructive" : ""}`}>
                ${outstanding.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lead pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Lead pricing</CardTitle>
              <CardDescription>Charged per quote request received</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Per lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEAD_PRICES.map((lp) => (
                    <TableRow key={lp.type}>
                      <TableCell className="font-medium">{lp.type}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lp.description}</TableCell>
                      <TableCell className="text-right font-medium">{lp.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Invoices issued on the 1st of each month</p>
                <p>Dispute invalid leads within 14 days at hello@comparewaterfilters.com.au</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment method */}
          <Card id="payment-method-section">
            <CardHeader>
              <CardTitle>Payment method</CardTitle>
              <CardDescription>Save a card for automatic monthly billing</CardDescription>
            </CardHeader>
            <CardContent>
              {!(provider as any)?.stripe_customer_id ? (
                <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <p>
                    Your account is pending approval. Payment setup will be available once approved.
                  </p>
                </div>
              ) : cardSaved ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium">Card on file</p>
                      <p className="text-sm text-muted-foreground">
                        Your account will be charged automatically on the 1st of each month
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setCardSaved(false); setShowCardForm(true); }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" /> Update card
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <p>
                      No card saved — add a card to enable automatic monthly billing. Without a card on file, invoices will be sent by email.
                    </p>
                  </div>
                  {!showCardForm ? (
                    <Button onClick={() => setShowCardForm(true)} className="w-full gap-2">
                      <CreditCard className="h-4 w-4" /> Add payment card
                    </Button>
                  ) : (
                    <Elements stripe={stripePromise}>
                      <CardSetupForm
                        stripeCustomerId={(provider as any)?.stripe_customer_id || ""}
                        onSuccess={() => { setCardSaved(true); setShowCardForm(false); }}
                      />
                    </Elements>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoice history */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice history</CardTitle>
            <CardDescription>All invoices are also sent to your registered email address</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No invoices yet — your first invoice will appear here after your first month of leads
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedInvoice(inv)}>
                      <TableCell className="font-medium text-primary hover:underline">{inv.invoice_number}</TableCell>
                      <TableCell>
                        {format(new Date(inv.period_start), "d MMM")} — {format(new Date(inv.period_end), "d MMM yyyy")}
                      </TableCell>
                      <TableCell>{inv.lead_count}</TableCell>
                      <TableCell>${Number(inv.total_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[inv.status] || ""}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(inv as any).stripe_invoice_id && (
                          <a
                            href={`https://dashboard.stripe.com/invoices/${(inv as any).stripe_invoice_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Invoice detail dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedInvoice && (
              <>
                <DialogHeader className="flex flex-row items-center justify-between pr-8">
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {selectedInvoice.invoice_number}
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const printContent = document.getElementById("invoice-print-area");
                      if (!printContent) return;
                      const win = window.open("", "_blank");
                      if (!win) return;
                      win.document.write(`
                        <html><head><title>${selectedInvoice.invoice_number}</title>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; }
                          h1 { font-size: 22px; margin-bottom: 4px; }
                          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; font-size: 14px; }
                          .meta .label { color: #666; margin-bottom: 2px; }
                          .meta .value { font-weight: 600; }
                          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
                          th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; font-weight: 600; }
                          td { padding: 8px 12px; border-bottom: 1px solid #eee; }
                          .text-right { text-align: right; }
                          .total-row td { border-top: 2px solid #333; font-weight: 700; }
                          .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                          .badge-paid { background: #dcfce7; color: #166534; }
                          .badge-sent { background: #dbeafe; color: #1e40af; }
                          .badge-overdue { background: #fee2e2; color: #991b1b; }
                          .badge-draft { background: #f3f4f6; color: #374151; }
                          .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
                          @media print { body { padding: 20px; } }
                        </style></head><body>
                        <h1>Invoice ${selectedInvoice.invoice_number}</h1>
                        <p style="color:#666;margin-top:0">Compare Water Filters</p>
                        <div class="meta">
                          <div><div class="label">Billing period</div><div class="value">${format(new Date(selectedInvoice.period_start), "d MMM yyyy")} — ${format(new Date(selectedInvoice.period_end), "d MMM yyyy")}</div></div>
                          <div><div class="label">Status</div><div class="value"><span class="badge badge-${selectedInvoice.status}">${selectedInvoice.status}</span></div></div>
                          <div><div class="label">Total leads</div><div class="value">${selectedInvoice.lead_count}</div></div>
                          <div><div class="label">Total amount</div><div class="value">$${Number(selectedInvoice.total_amount).toFixed(2)}</div></div>
                          ${selectedInvoice.paid_at ? `<div><div class="label">Paid</div><div class="value">${format(new Date(selectedInvoice.paid_at), "d MMM yyyy")}</div></div>` : ""}
                        </div>
                        <h3>Leads in this period</h3>
                        <table>
                          <thead><tr><th>Date</th><th>Customer</th><th>Location</th><th>System</th><th class="text-right">Price</th></tr></thead>
                          <tbody>
                            ${invoiceLeads.map((l: any) => `<tr>
                              <td>${format(new Date(l.created_at), "d MMM")}</td>
                              <td>${l.customer_name}</td>
                              <td>${[l.customer_suburb, l.customer_state].filter(Boolean).join(", ") || "—"}</td>
                              <td>${(l.recommended_systems || []).join(", ") || "—"}</td>
                              <td class="text-right">$${Number(l.lead_price || 0).toFixed(2)}</td>
                            </tr>`).join("")}
                            <tr class="total-row"><td colspan="4" class="text-right">Total</td><td class="text-right">$${invoiceLeads.reduce((s: number, l: any) => s + Number(l.lead_price || 0), 0).toFixed(2)}</td></tr>
                          </tbody>
                        </table>
                        <div class="footer">Generated from Compare Water Filters vendor portal — comparewaterfilters.lovable.app</div>
                        </body></html>
                      `);
                      win.document.close();
                      win.focus();
                      setTimeout(() => win.print(), 300);
                    }}
                  >
                    <Download className="h-4 w-4" /> Print / Save PDF
                  </Button>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Invoice summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Billing period</p>
                      <p className="font-medium">
                        {format(new Date(selectedInvoice.period_start), "d MMM yyyy")} — {format(new Date(selectedInvoice.period_end), "d MMM yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant="secondary" className={statusColors[selectedInvoice.status] || ""}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total leads</p>
                      <p className="font-medium">{selectedInvoice.lead_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total amount</p>
                      <p className="font-bold text-lg">${Number(selectedInvoice.total_amount).toFixed(2)}</p>
                    </div>
                    {selectedInvoice.paid_at && (
                      <div>
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-medium">{format(new Date(selectedInvoice.paid_at), "d MMM yyyy")}</p>
                      </div>
                    )}
                    {selectedInvoice.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="font-medium">{selectedInvoice.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Leads table */}
                  <div>
                    <h3 className="font-semibold mb-2">Leads in this period</h3>
                    {leadsLoading ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : invoiceLeads.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No leads found for this period</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>System</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceLeads.map((lead: any) => (
                            <TableRow key={lead.id}>
                              <TableCell className="text-sm">{format(new Date(lead.created_at), "d MMM")}</TableCell>
                              <TableCell className="text-sm">{lead.customer_name}</TableCell>
                              <TableCell className="text-sm">
                                {[lead.customer_suburb, lead.customer_state].filter(Boolean).join(", ") || "—"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {(lead.recommended_systems || []).join(", ") || "—"}
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium">
                                ${Number(lead.lead_price || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell colSpan={4} className="text-right font-semibold">Total</TableCell>
                            <TableCell className="text-right font-bold">
                              ${invoiceLeads.reduce((sum: number, l: any) => sum + Number(l.lead_price || 0), 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
