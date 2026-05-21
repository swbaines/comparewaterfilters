import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Flag, ArrowUp, ArrowDown, CheckCircle2, XCircle, RotateCcw, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type AdminStatus = "pending" | "refunded" | "dismissed";

const STATUS_OPTIONS: { value: AdminStatus; label: string; className: string }[] = [
  { value: "pending", label: "Pending review", className: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "refunded", label: "Refunded", className: "bg-green-100 text-green-800 border-green-200" },
  { value: "dismissed", label: "Dismissed", className: "bg-slate-100 text-slate-700 border-slate-200" },
];

function statusMeta(value: string | null | undefined) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
}

type SortKey = "flagged_at" | "status";
type SortDir = "asc" | "desc";

export default function AdminFlaggedLeadsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | AdminStatus>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("flagged_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["admin-flagged-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("flagged_for_review", true)
        .order("flagged_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateFlag = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: AdminStatus; notes?: string }) => {
      const updates: any = { flag_admin_status: status };
      if (typeof notes === "string") updates.vendor_notes = notes;
      const { error } = await supabase.from("quote_requests").update(updates as any).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: ({ id, status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-flagged-leads"] });
      setSelected((prev: any) => (prev && prev.id === id ? { ...prev, flag_admin_status: status } : prev));
      toast.success("Flag updated");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to update flag"),
  });

  const { data: creditsForSelected = [] } = useQuery({
    queryKey: ["provider-credits-for-lead", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_credits" as any)
        .select("*")
        .eq("quote_request_id", selected.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const issueRefund = useMutation({
    mutationFn: async ({ id, providerId, amount, reason }: { id: string; providerId: string; amount: number; reason: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error: credErr } = await supabase
        .from("provider_credits" as any)
        .insert({
          provider_id: providerId,
          quote_request_id: id,
          amount,
          reason,
          status: "pending",
          created_by: userData.user?.id ?? null,
        } as any);
      if (credErr) throw credErr;

      const { error: flagErr } = await supabase
        .from("quote_requests")
        .update({
          flag_admin_status: "refunded",
          vendor_notes: adminNote || null,
        } as any)
        .eq("id", id);
      if (flagErr) throw flagErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-flagged-leads"] });
      queryClient.invalidateQueries({ queryKey: ["provider-credits-for-lead", selected?.id] });
      setSelected((prev: any) => prev ? { ...prev, flag_admin_status: "refunded" } : prev);
      setRefundOpen(false);
      setRefundReason("");
      toast.success("Refund credit issued — will apply to next invoice");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to issue refund"),
  });

  const voidCredit = useMutation({
    mutationFn: async (creditId: string) => {
      const { error } = await supabase
        .from("provider_credits" as any)
        .update({ status: "voided" } as any)
        .eq("id", creditId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-credits-for-lead", selected?.id] });
      toast.success("Credit voided");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to void credit"),
  });

  const clearFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({
          flagged_for_review: false,
          flag_admin_status: null,
          flag_reason: null,
          flagged_at: null,
        } as any)
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-flagged-leads"] });
      if (selected?.id === id) setSelected(null);
      toast.success("Flag cleared");
    },
    onError: (e: any) => toast.error(e?.message || "Failed to clear flag"),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = leads.filter((l: any) => {
      const effectiveStatus = (l.flag_admin_status as AdminStatus | null) ?? "pending";
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        l.customer_name?.toLowerCase().includes(q) ||
        l.customer_email?.toLowerCase().includes(q) ||
        l.provider_name?.toLowerCase().includes(q) ||
        l.flag_reason?.toLowerCase().includes(q)
      );
    });
    const sorted = rows.slice().sort((a: any, b: any) => {
      let diff = 0;
      if (sortKey === "flagged_at") {
        const at = a.flagged_at ? new Date(a.flagged_at).getTime() : 0;
        const bt = b.flagged_at ? new Date(b.flagged_at).getTime() : 0;
        diff = at - bt;
      } else {
        const order = { pending: 0, refunded: 1, dismissed: 2 } as Record<string, number>;
        const as = order[(a.flag_admin_status as string) ?? "pending"] ?? 0;
        const bs = order[(b.flag_admin_status as string) ?? "pending"] ?? 0;
        diff = as - bs;
      }
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [leads, statusFilter, search, sortKey, sortDir]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, pending: 0, refunded: 0, dismissed: 0 };
    for (const l of leads as any[]) {
      const s = (l.flag_admin_status as string) || "pending";
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [leads]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <>
      <PageMeta title="Flagged Leads — Admin" description="Review leads flagged by providers for investigation and potential refund." path="/admin/flagged-leads" />
      <AdminNav />
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Flag className="h-6 w-6 text-amber-600" /> Flagged Leads
            </h1>
            <p className="text-muted-foreground">Leads flagged by providers for investigation and possible refund.</p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          {(["all", "pending", "refunded", "dismissed"] as const).map((s) => (
            <Card
              key={s}
              className={`cursor-pointer transition-colors ${statusFilter === s ? "border-primary" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize text-muted-foreground">{s === "all" ? "All flags" : s}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search by customer, provider, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">{filtered.length} of {leads.length}</div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No flagged leads match your filters.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("flagged_at")}>
                        Flagged
                        {sortKey === "flagged_at" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    </TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("status")}>
                        Status
                        {sortKey === "status" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </button>
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l: any) => {
                    const meta = statusMeta(l.flag_admin_status);
                    return (
                      <TableRow key={l.id} className="cursor-pointer" onClick={() => { setSelected(l); setAdminNote(l.vendor_notes || ""); }}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {l.flagged_at ? format(new Date(l.flagged_at), "dd MMM yyyy h:mm a") : "—"}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{l.provider_name}</TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{l.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{l.customer_email}</div>
                        </TableCell>
                        <TableCell className="max-w-sm text-sm">
                          <div className="line-clamp-2 text-muted-foreground">{l.flag_reason || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelected(l); setAdminNote(l.vendor_notes || ""); }}>Review</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-amber-600" /> Review flag — {selected.customer_name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-muted-foreground">Provider</div><div className="font-medium">{selected.provider_name}</div></div>
                  <div><div className="text-xs text-muted-foreground">Flagged</div><div className="font-medium">{selected.flagged_at ? format(new Date(selected.flagged_at), "dd MMM yyyy h:mm a") : "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Customer email</div><div className="font-medium">{selected.customer_email}</div></div>
                  <div><div className="text-xs text-muted-foreground">Customer mobile</div><div className="font-medium">{selected.customer_mobile || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Lead status</div><div className="font-medium capitalize">{selected.lead_status}</div></div>
                  <div><div className="text-xs text-muted-foreground">Lead price</div><div className="font-medium">${Number(selected.lead_price || 0).toFixed(2)}</div></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Provider's reason</div>
                  <div className="rounded-md border bg-muted/40 p-3 whitespace-pre-wrap">{selected.flag_reason || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Internal notes (shared with provider)</div>
                  <Textarea rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
                    setRefundAmount(String(Number(selected.lead_price || 0).toFixed(2)));
                    setRefundReason("");
                    setRefundOpen(true);
                  }}>
                    <DollarSign className="h-4 w-4 mr-1.5" /> Issue refund credit
                  </Button>
                  <Button size="sm" variant="outline" disabled={updateFlag.isPending} onClick={() => updateFlag.mutate({ id: selected.id, status: "dismissed", notes: adminNote })}>
                    <XCircle className="h-4 w-4 mr-1.5" /> Dismiss
                  </Button>
                  <Button size="sm" variant="outline" disabled={updateFlag.isPending} onClick={() => updateFlag.mutate({ id: selected.id, status: "pending", notes: adminNote })}>
                    Reset to pending
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground" disabled={clearFlag.isPending} onClick={() => clearFlag.mutate(selected.id)}>
                    <RotateCcw className="h-4 w-4 mr-1.5" /> Clear flag
                  </Button>
                </div>

                {creditsForSelected.length > 0 && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" /> Refund credits
                    </div>
                    <div className="space-y-2">
                      {creditsForSelected.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">${Number(c.amount).toFixed(2)} — <span className="capitalize">{c.status}</span></div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(c.created_at), "dd MMM yyyy h:mm a")}
                              {c.status === "applied" && c.applied_at && ` · applied ${format(new Date(c.applied_at), "dd MMM yyyy")}`}
                            </div>
                            {c.reason && <div className="text-xs text-muted-foreground mt-1">{c.reason}</div>}
                          </div>
                          {c.status === "pending" && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => voidCredit.mutate(c.id)} disabled={voidCredit.isPending}>
                              Void
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" /> Issue refund credit
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border bg-muted/40 p-3">
                <div className="text-xs text-muted-foreground">Provider</div>
                <div className="font-medium">{selected.provider_name}</div>
                <div className="mt-2 text-xs text-muted-foreground">Lead price</div>
                <div className="font-medium">${Number(selected.lead_price || 0).toFixed(2)}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Credit amount (AUD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Applied as a credit on the provider's next monthly invoice.
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Reason / admin note</label>
                <Textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Why is this lead being refunded?"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={issueRefund.isPending}>
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={issueRefund.isPending || !Number(refundAmount) || Number(refundAmount) <= 0}
                  onClick={() => issueRefund.mutate({
                    id: selected.id,
                    providerId: selected.provider_id,
                    amount: Number(refundAmount),
                    reason: refundReason || selected.flag_reason || "Refund issued for flagged lead",
                  })}
                >
                  {issueRefund.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Issue credit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}