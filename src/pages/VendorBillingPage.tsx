import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Loader2, DollarSign, TrendingUp, FileText, CreditCard,
  ArrowLeft, CheckCircle2, Zap, Bell, ClipboardList, Sparkles, ShieldCheck, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import PageMeta from "@/components/PageMeta";

const invoiceStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export default function VendorBillingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: vendorAccount, isLoading: vaLoading } = useQuery({
    queryKey: ["vendor-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("provider_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const providerId = vendorAccount?.provider_id;

  // Leads this month
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

  const { data: leadsThisMonth = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["billing-leads-month", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, lead_price, created_at")
        .eq("provider_id", providerId!)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: leadsLastMonth = [] } = useQuery({
    queryKey: ["billing-leads-last-month", providerId],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, lead_price")
        .eq("provider_id", providerId!)
        .gte("created_at", lastMonthStart)
        .lte("created_at", lastMonthEnd);
      if (error) throw error;
      return data;
    },
  });

  const { data: leadPrices = [], isLoading: pricesLoading } = useQuery({
    queryKey: ["lead-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_prices")
        .select("*")
        .order("system_type");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["billing-invoices", providerId],
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

  const isLoading = vaLoading || leadsLoading || pricesLoading || invoicesLoading;

  const estimatedThisMonth = leadsThisMonth.reduce((sum, l) => sum + (Number(l.lead_price) || 0), 0);
  const lastMonthTotal = leadsLastMonth.reduce((sum, l) => sum + (Number(l.lead_price) || 0), 0);
  const outstandingBalance = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatSystemLabel = (type: string) =>
    type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <PageMeta title="Billing & Lead Pricing — Compare Water Filters" description="View your lead costs, invoices, and billing details." />
      <div className="container max-w-5xl py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendor/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billing & Lead Pricing</h1>
            <p className="text-muted-foreground text-sm">Track your costs, view invoices, and understand how billing works.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Leads This Month"
            value={String(leadsThisMonth.length)}
            accent="text-primary"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Estimated This Month"
            value={`$${estimatedThisMonth.toFixed(2)}`}
            accent="text-primary"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Last Month Total"
            value={`$${lastMonthTotal.toFixed(2)}`}
            accent="text-muted-foreground"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Outstanding Balance"
            value={`$${outstandingBalance.toFixed(2)}`}
            accent={outstandingBalance > 0 ? "text-destructive" : "text-green-600"}
          />
        </div>

        {/* Lead Pricing Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" /> Lead Pricing by System Type
            </CardTitle>
            <CardDescription>You are charged per qualified lead sent to your business. Prices vary by system type.</CardDescription>
          </CardHeader>
          <CardContent>
            {leadPrices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>System Type</TableHead>
                    <TableHead className="text-right">Price Per Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadPrices.map((lp) => (
                    <TableRow key={lp.id}>
                      <TableCell className="font-medium">{formatSystemLabel(lp.system_type)}</TableCell>
                      <TableCell className="text-right font-semibold">${Number(lp.price_per_lead).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No pricing configured yet.</p>
            )}
          </CardContent>
        </Card>

        {/* How Billing Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> How Billing Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: 1, title: "Customer Submits Quiz", desc: "A homeowner completes our recommendation quiz and requests a quote." },
                { step: 2, title: "Lead Matched to You", desc: "Based on your service area, system types, and availability, the lead is sent to you." },
                { step: 3, title: "You Receive the Lead", desc: "You get an email notification with the customer's details and recommended systems." },
                { step: 4, title: "Monthly Invoice", desc: "At the end of each billing period, you receive an invoice for all leads delivered." },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What Counts as a Lead */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> What Counts as a Lead?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">A lead is counted when a qualified customer request is matched to your business. Each lead includes:</p>
            <ul className="space-y-2 text-sm">
              {[
                "Customer name, email, and mobile number",
                "Property type, household size, and location details",
                "Water concerns and recommended system types",
                "Budget range and any additional notes",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <p className="text-xs text-muted-foreground">
              If you believe a lead is invalid (e.g. fake details, duplicate, or outside your service area), contact us within 7 days to dispute.
            </p>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <CreditCard className="h-7 w-7 text-muted-foreground" />
              </div>
              <h4 className="font-semibold">Stripe Integration — Coming Soon</h4>
              <p className="text-sm text-muted-foreground max-w-md">
                We're working on automatic payments via Stripe. For now, invoices are sent monthly and can be paid via bank transfer using the details on your invoice.
              </p>
              <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Invoice History
            </CardTitle>
            <CardDescription>All invoices for your account are listed below.</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(inv.period_start), "dd MMM")} – {format(new Date(inv.period_end), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-center">{inv.lead_count}</TableCell>
                        <TableCell className="text-right font-semibold">${Number(inv.total_amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={invoiceStatusColors[inv.status] || ""}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {inv.paid_at ? format(new Date(inv.paid_at), "dd MMM yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">No invoices yet. Invoices will appear here once your first billing period is complete.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Subscription Teaser */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Monthly Subscription Plans — Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              We're designing subscription tiers that give you unlimited leads in your service area for a fixed monthly fee.
              Stay tuned — early adopters will get exclusive launch pricing.
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">Unlimited Leads</Badge>
              <Badge variant="secondary">Fixed Monthly Fee</Badge>
              <Badge variant="secondary">Priority Matching</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold ${accent}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
