import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink, FileText, X, Download, ArrowLeft, DollarSign, Receipt } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ── Stripe publishable key ────────────────────────────────────────────────────
const stripePromise = loadStripe("pk_live_51TGc4iFAFFjkrVg3A5F9bsS2XXQkwKVWE8wnnPcT8onOI4jeUt8Sjq0H71AAd15jCDm57kDwH0dOzVuojTq3DJqj006YmVTHZi");

// Lead price defaults; live values are fetched from the lead_prices table (admin-editable)
const DEFAULT_OWNER_PRICE = 85;
const DEFAULT_RENTAL_PRICE = 50;

// ── Card brand SVG icons ──────────────────────────────────────────────────────
function CardBrandIcon({ brand }: { brand: string }) {
  const b = brand.toLowerCase();
  if (b === "visa") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12 shrink-0" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text x="24" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">VISA</text>
      </svg>
    );
  }
  if (b === "mastercard") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12 shrink-0" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 9.4a8 8 0 0 1 0 13.2 8 8 0 0 1 0-13.2z" fill="#FF5F00" />
      </svg>
    );
  }
  if (b === "amex" || b === "american_express") {
    return (
      <svg viewBox="0 0 48 32" className="h-8 w-12 shrink-0" aria-label="Amex">
        <rect width="48" height="32" rx="4" fill="#2E77BC" />
        <text x="24" y="21" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AMEX</text>
      </svg>
    );
  }
  return <CreditCard className="h-6 w-6 text-muted-foreground shrink-0" />;
}

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
  const [authorised, setAuthorised] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!authorised) {
      toast.error("Please tick the direct debit authorisation to continue");
      return;
    }

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
        body: {
          payment_method_id: setupIntent.payment_method as string,
          direct_debit_authorised: true,
        },
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

      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Checkbox
          id="dd-authorisation"
          checked={authorised}
          onCheckedChange={(v) => setAuthorised(v === true)}
          className="mt-0.5"
        />
        <label htmlFor="dd-authorisation" className="text-sm leading-relaxed cursor-pointer select-none">
          <strong>Direct debit authorisation:</strong> I authorise Compare Water Filters to
          automatically charge this payment method on the 1st of each month for leads received in the previous month,
          in accordance with the lead pricing shown above. I understand I can update or remove this payment method at
          any time, and I can dispute invalid leads within 14 days of invoicing.
        </label>
      </div>

      <Button type="submit" disabled={!stripe || saving || !authorised} className="w-full gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {authorised ? "Save card & authorise direct debit" : "Tick authorisation to continue"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

// ── Main billing page ─────────────────────────────────────────────────────────
export default function VendorBillingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<any>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payCooldownIds, setPayCooldownIds] = useState<Set<string>>(new Set());

  // Fetch leads assigned to this specific invoice
  const { data: invoiceLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["invoice-leads", selectedInvoice?.id],
    enabled: !!selectedInvoice && !!provider?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, customer_name, customer_email, customer_mobile, customer_suburb, customer_state, customer_postcode, recommended_systems, lead_price, created_at, ownership_status, property_type, household_size, water_source, budget")
        .eq("provider_id", provider.id)
        .eq("invoice_id", selectedInvoice.id)
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
        .select("id, name, contact_email, approval_status")
        .eq("id", va.provider_id)
        .single();

      // Fetch Stripe details from dedicated table
      let { data: stripeDetails } = await supabase
        .from("provider_stripe_details")
        .select("stripe_customer_id, stripe_payment_method_id, direct_debit_authorised_at, updated_at")
        .eq("provider_id", va.provider_id)
        .maybeSingle();

      // Auto-provision a Stripe customer for approved providers that don't have one yet
      if (prov?.approval_status === "approved" && !stripeDetails?.stripe_customer_id) {
        const { data: created, error: createErr } = await supabase.functions.invoke("create-stripe-customer", {
          body: { provider_id: va.provider_id },
        });
        if (!createErr && created?.customer_id) {
          stripeDetails = {
            stripe_customer_id: created.customer_id,
            stripe_payment_method_id: stripeDetails?.stripe_payment_method_id ?? null,
            direct_debit_authorised_at: stripeDetails?.direct_debit_authorised_at ?? null,
            updated_at: stripeDetails?.updated_at ?? null,
          };
        }
      }

      setProvider({
        ...prov,
        stripe_customer_id: stripeDetails?.stripe_customer_id,
        stripe_payment_method_id: stripeDetails?.stripe_payment_method_id,
        direct_debit_authorised_at: stripeDetails?.direct_debit_authorised_at,
        stripe_updated_at: stripeDetails?.updated_at,
      });
      if (!showCardForm) {
        setCardSaved(!!stripeDetails?.stripe_payment_method_id);
      }
    };

    fetchProvider();
  }, []);

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
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  // Fetch card brand/last4 from Stripe
  const { data: cardInfo } = useQuery({
    queryKey: ["card-details", cardSaved],
    enabled: cardSaved,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-card-details");
      if (error) throw error;
      return data?.card as { brand: string; last4: string; exp_month: number; exp_year: number } | null;
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

  const { data: leadPrices = [] } = useQuery({
    queryKey: ["lead-prices-public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_prices").select("system_type, price_per_lead");
      if (error) throw error;
      return data;
    },
  });

  const ownerLeadPrice = Number(leadPrices.find((p) => p.system_type === "owner_lead")?.price_per_lead ?? DEFAULT_OWNER_PRICE);
  const rentalLeadPrice = Number(leadPrices.find((p) => p.system_type === "rental_lead")?.price_per_lead ?? DEFAULT_RENTAL_PRICE);

  const livePriceRows = [
    { type: "Owner lead", price: `$${ownerLeadPrice}`, description: "Customer owns their property" },
    { type: "Rental lead", price: `$${rentalLeadPrice}`, description: "Customer is renting" },
  ];


  const estimatedThisMonth = leadsThisMonth.reduce((sum: number, l: any) => {
    if (l.lead_price) return sum + Number(l.lead_price);
    // Fallback uses the current owner price (most common case)
    return sum + ownerLeadPrice;
  }, 0);


  const lastMonthInvoice = invoices[0];
  const handlePayNow = async (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    setPayCooldownIds((prev) => {
      const next = new Set(prev);
      next.add(invoiceId);
      return next;
    });
    setTimeout(() => {
      setPayCooldownIds((prev) => {
        const next = new Set(prev);
        next.delete(invoiceId);
        return next;
      });
    }, 5000);
    try {
      const { data, error } = await supabase.functions.invoke("pay-invoice-now", {
        body: { invoice_id: invoiceId },
      });
      if (error) throw new Error(error.message || "Payment failed");
      if (data?.error) throw new Error(data.error);
      toast.success("Payment successful! Invoice marked as paid.");
      queryClient.invalidateQueries({ queryKey: ["vendor-invoices"] });
    } catch (err: any) {
      toast.error(err.message || "Payment failed. Please try again.");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const outstanding = invoices
    .filter((inv: any) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum: number, inv: any) => sum + Number(inv.total_amount), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing &amp; lead pricing</h1>
            <p className="text-muted-foreground">
              You are invoiced on the 1st of each month for leads received. Payment is due within 14 days.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/vendor/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
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
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>You have ${outstanding.toFixed(2)} in outstanding invoices.</strong> Please ensure your payment method is up to date to avoid service interruptions.
              </span>
              {cardSaved && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-4 shrink-0 gap-2"
                  disabled={!!payingInvoiceId || payCooldownIds.size > 0}
                  onClick={() => {
                    const unpaid = invoices.find((inv: any) => inv.status === "sent" || inv.status === "overdue");
                    if (unpaid) handlePayNow(unpaid.id);
                  }}
                >
                  {payingInvoiceId ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                  Pay now
                </Button>
              )}
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
                  {livePriceRows.map((lp) => (
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
                    {provider?.approval_status === "approved"
                      ? "Setting up your billing account… please refresh in a moment. If this persists, ensure your provider profile has a contact email."
                      : "Your account is pending approval. Payment setup will be available once approved."}
                  </p>
                </div>
              ) : cardSaved && !showCardForm ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {cardInfo ? (
                      <CardBrandIcon brand={cardInfo.brand} />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">
                        {cardInfo
                          ? `${cardInfo.brand.charAt(0).toUpperCase() + cardInfo.brand.slice(1)} •••• ${cardInfo.last4}`
                          : "Card on file"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cardInfo
                          ? `Expires ${String(cardInfo.exp_month).padStart(2, "0")}/${cardInfo.exp_year} · Charged automatically on the 1st`
                          : "Your account will be charged automatically on the 1st of each month"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowCardForm(true); }}
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
                        onSuccess={() => { setCardSaved(true); setShowCardForm(false); queryClient.invalidateQueries({ queryKey: ["card-details"] }); }}
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
                      <TableCell className="text-right space-x-2">
                        {(inv.status === "sent" || inv.status === "overdue") && cardSaved && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            disabled={payingInvoiceId === inv.id || payCooldownIds.has(inv.id)}
                            onClick={(e) => { e.stopPropagation(); handlePayNow(inv.id); }}
                          >
                            {payingInvoiceId === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <DollarSign className="h-3 w-3" />}
                            Pay now
                          </Button>
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
                          <thead><tr><th>Date</th><th>Customer</th><th>Type</th><th>Location</th><th class="text-right">Price</th></tr></thead>
                          <tbody>
                            ${invoiceLeads.map((l: any) => `<tr>
                              <td>${format(new Date(l.created_at), "d MMM")}</td>
                              <td>${l.customer_name}<br/><span style="font-size:11px;color:#888">${l.customer_email}${l.customer_mobile ? '<br/>' + l.customer_mobile : ''}</span></td>
                              <td>${l.ownership_status || "—"}</td>
                              <td>${[l.customer_suburb, l.customer_state, l.customer_postcode].filter(Boolean).join(", ") || "—"}</td>
                              <td class="text-right">$${Number(l.lead_price || 0).toFixed(2)}</td>
                            </tr>`).join("")}
                            <tr class="total-row"><td colspan="4" class="text-right">Total</td><td class="text-right">$${invoiceLeads.reduce((s: number, l: any) => s + Number(l.lead_price || 0), 0).toFixed(2)}</td></tr>
                          </tbody>
                        </table>
                        <div class="footer">Generated from Compare Water Filters vendor portal — comparewaterfilters.com.au</div>
                        </body></html>
                      `);
                      win.document.close();
                      win.focus();
                      setTimeout(() => win.print(), 300);
                    }}
                  >
                    <Download className="h-4 w-4" /> Print / Save PDF
                  </Button>
                  {selectedInvoice.status === "paid" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        const win = window.open("", "_blank");
                        if (!win) return;
                        win.document.write(`
                          <html><head><title>Receipt — ${selectedInvoice.invoice_number}</title>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; }
                            h1 { font-size: 24px; margin-bottom: 4px; }
                            .subtitle { color: #666; margin-top: 0; font-size: 14px; }
                            .success { display: flex; align-items: center; gap: 8px; background: #dcfce7; color: #166534; padding: 12px 16px; border-radius: 8px; font-weight: 600; margin: 20px 0; font-size: 14px; }
                            .success svg { flex-shrink: 0; }
                            .details { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 20px 0; }
                            .details-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
                            .details-row:last-child { border-bottom: none; }
                            .details-row .label { color: #6b7280; }
                            .details-row .value { font-weight: 600; }
                            .total-row { background: #f9fafb; }
                            .total-row .value { font-size: 18px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                            th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #ddd; font-weight: 600; color: #6b7280; }
                            td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
                            .text-right { text-align: right; }
                            .footer { margin-top: 40px; font-size: 11px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px; text-align: center; }
                            @media print { body { padding: 20px; } }
                          </style></head><body>
                          <h1>Payment Receipt</h1>
                          <p class="subtitle">Compare Water Filters — ${selectedInvoice.invoice_number}</p>
                          <div class="success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
                            Payment successful
                          </div>
                          <div class="details">
                            <div class="details-row"><span class="label">Invoice</span><span class="value">${selectedInvoice.invoice_number}</span></div>
                            <div class="details-row"><span class="label">Billing period</span><span class="value">${format(new Date(selectedInvoice.period_start), "d MMM yyyy")} — ${format(new Date(selectedInvoice.period_end), "d MMM yyyy")}</span></div>
                            <div class="details-row"><span class="label">Leads</span><span class="value">${selectedInvoice.lead_count}</span></div>
                            <div class="details-row"><span class="label">Date paid</span><span class="value">${selectedInvoice.paid_at ? format(new Date(selectedInvoice.paid_at), "d MMM yyyy 'at' h:mm a") : "—"}</span></div>
                            ${selectedInvoice.stripe_invoice_id ? `<div class="details-row"><span class="label">Reference</span><span class="value" style="font-family:monospace;font-size:12px">${selectedInvoice.stripe_invoice_id}</span></div>` : ""}
                            <div class="details-row total-row"><span class="label">Amount paid</span><span class="value">$${Number(selectedInvoice.total_amount).toFixed(2)} AUD</span></div>
                          </div>
                          <h3 style="font-size:14px;color:#374151;margin-bottom:4px">Lead breakdown</h3>
                          <table>
                            <thead><tr><th>Date</th><th>Customer</th><th>Location</th><th class="text-right">Price</th></tr></thead>
                            <tbody>
                              ${invoiceLeads.map((l: any) => `<tr>
                                <td>${format(new Date(l.created_at), "d MMM")}</td>
                                <td>${l.customer_name}</td>
                                <td>${[l.customer_suburb, l.customer_state].filter(Boolean).join(", ") || "—"}</td>
                                <td class="text-right">$${Number(l.lead_price || 0).toFixed(2)}</td>
                              </tr>`).join("")}
                            </tbody>
                          </table>
                          <div class="footer">
                            This receipt was generated from the Compare Water Filters vendor portal.<br/>
                            comparewaterfilters.com.au
                          </div>
                          </body></html>
                        `);
                        win.document.close();
                        win.focus();
                        setTimeout(() => win.print(), 300);
                      }}
                    >
                      <Receipt className="h-4 w-4" /> Download Receipt
                    </Button>
                  )}
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
                    {selectedInvoice.stripe_invoice_id && (
                      <div>
                        <p className="text-muted-foreground">Stripe reference</p>
                        <p className="font-medium text-xs font-mono">{selectedInvoice.stripe_invoice_id}</p>
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
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            
                            <TableHead className="text-right">Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoiceLeads.map((lead: any) => (
                            <TableRow key={lead.id}>
                              <TableCell className="text-sm whitespace-nowrap">{format(new Date(lead.created_at), "d MMM")}</TableCell>
                              <TableCell className="text-sm">
                                <div className="font-medium">{lead.customer_name}</div>
                                <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
                                {lead.customer_mobile && <div className="text-xs text-muted-foreground">{lead.customer_mobile}</div>}
                              </TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="secondary" className={lead.ownership_status === "Own" ? "bg-blue-100 text-blue-800" : lead.ownership_status === "Rent" ? "bg-amber-100 text-amber-800" : ""}>
                                  {lead.ownership_status || "—"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {[lead.customer_suburb, lead.customer_state].filter(Boolean).join(", ") || "—"}
                                {lead.customer_postcode && <span className="text-muted-foreground"> {lead.customer_postcode}</span>}
                              </TableCell>
                              <TableCell className="text-sm text-right font-medium whitespace-nowrap">
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
