import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, DollarSign, FileText, CheckCircle, Clock, MoreHorizontal, Send, Ban, ChevronRight, ChevronDown } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { format } from "date-fns";
import { Fragment, useState } from "react";
import { toast } from "sonner";

function InvoiceLeadsDetail({ invoiceId }: { invoiceId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-invoice-leads", invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("id, customer_name, customer_email, customer_suburb, customer_state, ownership_status, lead_price, lead_status, created_at")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading billed leads…
      </div>
    );
  }
  if (error) {
    return <div className="px-6 py-4 text-sm text-destructive">Failed to load billed leads</div>;
  }
  if (!data || data.length === 0) {
    return <div className="px-6 py-4 text-sm text-muted-foreground">No leads linked to this invoice.</div>;
  }

  return (
    <div className="px-6 py-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        Billed leads ({data.length})
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Ownership</TableHead>
            <TableHead>Lead status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">{lead.customer_name}</div>
                <div className="text-xs text-muted-foreground">{lead.customer_email}</div>
              </TableCell>
              <TableCell className="text-sm">
                {[lead.customer_suburb, lead.customer_state].filter(Boolean).join(", ") || "—"}
              </TableCell>
              <TableCell className="text-sm">{lead.ownership_status || "—"}</TableCell>
              <TableCell className="text-sm capitalize">{lead.lead_status}</TableCell>
              <TableCell className="text-right font-medium">
                ${Number(lead.lead_price ?? 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(lead.created_at), "dd MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};

function getBillingMode(inv: { stripe_invoice_id: string | null; invoice_number: string }) {
  const sid = inv.stripe_invoice_id ?? "";
  // Manual: Stripe-hosted invoice (in_...) or invoice number prefixed INV-M-
  if (sid.startsWith("in_") || inv.invoice_number.startsWith("INV-M-")) {
    return { label: "Manual invoice", className: "bg-amber-100 text-amber-800 border-amber-200" };
  }
  // Auto-charged: PaymentIntent (pi_...) means direct debit succeeded
  if (sid.startsWith("pi_")) {
    return { label: "Auto-charged", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  return { label: "Pending", className: "bg-slate-100 text-slate-600 border-slate-200" };
}

type InvoiceAction = {
  type: "mark_paid" | "mark_sent" | "mark_overdue" | "cancel";
  invoiceId: string;
  invoiceNumber: string;
};

export default function AdminInvoicesPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<InvoiceAction | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, providers(name, contact_email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ invoiceId, type }: { invoiceId: string; type: InvoiceAction["type"] }) => {
      const statusMap: Record<string, string> = {
        mark_paid: "paid",
        mark_sent: "sent",
        mark_overdue: "overdue",
        cancel: "cancelled",
      };
      const newStatus = statusMap[type];
      const updates: { status: string; paid_at?: string } = { status: newStatus };
      if (type === "mark_paid") updates.paid_at = new Date().toISOString();

      const { error } = await supabase
        .from("invoices")
        .update(updates as any)
        .eq("id", invoiceId);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success(`Invoice marked as ${newStatus}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update invoice");
    },
  });

  const sendReminder = useMutation({
    mutationFn: async ({ invoiceId }: { invoiceId: string }) => {
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) throw new Error("Invoice not found");

      const providerEmail = (inv as any).providers?.contact_email;
      if (!providerEmail) throw new Error("Provider has no contact email configured");

      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-reminder",
          recipientEmail: providerEmail,
          idempotencyKey: `invoice-reminder-${invoiceId}-${Date.now()}`,
          templateData: {
            providerName: (inv as any).providers?.name || "Provider",
            invoiceNumber: inv.invoice_number,
            totalAmount: `$${Number(inv.total_amount).toLocaleString()}`,
            leadCount: inv.lead_count,
            periodStart: inv.period_start,
            periodEnd: inv.period_end,
            status: inv.status,
          },
        },
      });
      // For now we just mark as sent if not already
      if (inv.status === "draft") {
        await supabase.from("invoices").update({ status: "sent" }).eq("id", invoiceId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      toast.success("Invoice marked as sent");
    },
    onError: () => {
      toast.error("Failed to send reminder");
    },
  });

  const handleAction = (action: InvoiceAction) => {
    if (action.type === "mark_paid" || action.type === "cancel") {
      setConfirmAction(action);
    } else if (action.type === "mark_sent") {
      sendReminder.mutate({ invoiceId: action.invoiceId });
    } else {
      updateStatus.mutate({ invoiceId: action.invoiceId, type: action.type });
    }
  };

  const confirmAndExecute = () => {
    if (!confirmAction) return;
    updateStatus.mutate({ invoiceId: confirmAction.invoiceId, type: confirmAction.type });
    setConfirmAction(null);
  };

  const filtered = filterStatus === "all"
    ? invoices
    : invoices.filter((i) => i.status === filterStatus);

  const totalAmount = invoices.reduce((s, i) => s + Number(i.total_amount), 0);
  const paidAmount = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.total_amount), 0);
  const pendingAmount = invoices.filter((i) => i.status === "sent" || i.status === "draft").reduce((s, i) => s + Number(i.total_amount), 0);
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  const getActions = (status: string) => {
    switch (status) {
      case "draft":
        return [
          { type: "mark_sent" as const, label: "Send Invoice", icon: Send },
          { type: "mark_paid" as const, label: "Mark as Paid", icon: CheckCircle },
          { type: "cancel" as const, label: "Cancel", icon: Ban },
        ];
      case "sent":
        return [
          { type: "mark_paid" as const, label: "Mark as Paid", icon: CheckCircle },
          { type: "mark_overdue" as const, label: "Mark Overdue", icon: Clock },
          { type: "mark_sent" as const, label: "Send Reminder", icon: Send },
          { type: "cancel" as const, label: "Cancel", icon: Ban },
        ];
      case "overdue":
        return [
          { type: "mark_paid" as const, label: "Mark as Paid", icon: CheckCircle },
          { type: "mark_sent" as const, label: "Send Reminder", icon: Send },
          { type: "cancel" as const, label: "Cancel", icon: Ban },
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      <AdminNav />
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">View and track all vendor invoices</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold">${pendingAmount.toLocaleString()}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent><div className="text-2xl font-bold text-red-600">{overdueCount}</div></CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">{filtered.length} invoices</span>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[32px]"></TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((inv) => {
                      const actions = getActions(inv.status);
                      const isOpen = expanded.has(inv.id);
                      return (
                        <Fragment key={inv.id}>
                        <TableRow>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setExpanded((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(inv.id)) next.delete(inv.id);
                                  else next.add(inv.id);
                                  return next;
                                });
                              }}
                              aria-label={isOpen ? "Hide billed leads" : "Show billed leads"}
                            >
                              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                          <TableCell className="font-medium">
                            {(inv.providers as any)?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(inv.period_start), "dd MMM")} – {format(new Date(inv.period_end), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>{inv.lead_count}</TableCell>
                          <TableCell className="font-medium">${Number(inv.total_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[inv.status] ?? ""} capitalize`}>
                              {inv.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const mode = getBillingMode(inv);
                              return (
                                <Badge variant="outline" className={mode.className}>
                                  {mode.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(inv.created_at), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>
                            {actions.length > 0 ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {actions.map((a) => (
                                    <DropdownMenuItem
                                      key={a.type}
                                      onClick={() =>
                                        handleAction({
                                          type: a.type,
                                          invoiceId: inv.id,
                                          invoiceNumber: inv.invoice_number,
                                        })
                                      }
                                      className={a.type === "cancel" ? "text-destructive" : ""}
                                    >
                                      <a.icon className="mr-2 h-4 w-4" />
                                      {a.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={10} className="p-0">
                              <InvoiceLeadsDetail invoiceId={inv.id} />
                            </TableCell>
                          </TableRow>
                        )}
                        </Fragment>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "mark_paid" ? "Mark Invoice as Paid?" : "Cancel Invoice?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "mark_paid"
                ? `This will mark invoice ${confirmAction?.invoiceNumber} as paid and record the payment date.`
                : `This will cancel invoice ${confirmAction?.invoiceNumber}. This action cannot be easily undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndExecute}
              className={confirmAction?.type === "cancel" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === "mark_paid" ? "Confirm Payment" : "Cancel Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
