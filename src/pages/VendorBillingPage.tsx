import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
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
  { type: "Whole home filtration", price: "$85" },
  { type: "Water softener", price: "$65" },
  { type: "Reverse osmosis", price: "$40" },
  { type: "UV system", price: "$40" },
  { type: "Under-sink carbon", price: "$35" },
  { type: "All other systems", price: "$35" },
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: vendorAccount } = await supabase
        .from("vendor_accounts")
        .select("provider_id")
        .eq("user_id", user.id)
        .single();

      if (!vendorAccount) throw new Error("Vendor account not found");

      const { error: updateError } = await supabase
        .from("providers")
        .update({ stripe_payment_method_id: setupIntent.payment_method as string } as any)
        .eq("id", vendorAccount.provider_id);

      if (updateError) throw updateError;

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
    const systems: string[] = l.recommended_systems || [];
    let price = 35;
    if (systems.includes("whole-house")) price = 85;
    else if (systems.includes("water-softener")) price = 65;
    else if (systems.includes("reverse-osmosis") || systems.includes("uv-system")) price = 40;
    return sum + price;
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
                    <TableHead>System type</TableHead>
                    <TableHead className="text-right">Per lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEAD_PRICES.map((lp) => (
                    <TableRow key={lp.type}>
                      <TableCell>{lp.type}</TableCell>
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
          <Card>
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
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
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

        {/* Monthly subscription teaser */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="space-y-3">
                <Badge variant="outline">Coming soon</Badge>
                <h3 className="text-lg font-semibold">Monthly subscription plan</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Once the platform reaches volume, we'll introduce optional monthly subscriptions with featured placement, priority lead matching, and enhanced profile visibility.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Featured placement in results", "Priority lead matching", "Predictable monthly cost", "Enhanced profile badge"].map(f => (
                    <Badge key={f} variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {f}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
