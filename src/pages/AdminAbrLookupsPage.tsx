import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminNav from "@/components/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Search, RefreshCw } from "lucide-react";

type AbrLookup = {
  id: string;
  created_at: string;
  user_id: string | null;
  provider_id: string | null;
  submitted_abn: string;
  submitted_business_name: string | null;
  mode: string;
  verified: boolean;
  status: string | null;
  entity_name: string | null;
  business_names: string[] | null;
  gst_registered: boolean | null;
  review_flag: string | null;
  error_message: string | null;
  duration_ms: number | null;
  raw_response: unknown;
};

const VERIFIED_OPTIONS = [
  { value: "all", label: "All results" },
  { value: "verified", label: "Verified only" },
  { value: "unverified", label: "Unverified / failed" },
];

export default function AdminAbrLookupsPage() {
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AbrLookup | null>(null);

  const { data: lookups = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["abr-lookups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abr_lookups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as AbrLookup[];
    },
  });

  const reviewFlags = useMemo(() => {
    const set = new Set<string>();
    lookups.forEach((l) => l.review_flag && set.add(l.review_flag));
    return Array.from(set).sort();
  }, [lookups]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lookups.filter((l) => {
      if (verifiedFilter === "verified" && !l.verified) return false;
      if (verifiedFilter === "unverified" && l.verified) return false;
      if (reviewFilter !== "all" && l.review_flag !== reviewFilter) return false;
      if (!q) return true;
      return (
        l.submitted_abn.includes(q) ||
        (l.submitted_business_name || "").toLowerCase().includes(q) ||
        (l.entity_name || "").toLowerCase().includes(q) ||
        (l.provider_id || "").toLowerCase().includes(q)
      );
    });
  }, [lookups, search, verifiedFilter, reviewFilter]);

  const stats = useMemo(() => {
    const total = lookups.length;
    const verified = lookups.filter((l) => l.verified).length;
    const failed = lookups.filter(
      (l) => l.review_flag === "abr_lookup_failed",
    ).length;
    const flagged = lookups.filter(
      (l) => l.review_flag && l.review_flag !== null,
    ).length;
    return { total, verified, failed, flagged };
  }, [lookups]);

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ABR Lookups</h1>
            <p className="text-muted-foreground mt-1">
              Audit log of every ABN verification request — for troubleshooting
              and trust.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Verified" value={stats.verified} tone="success" />
          <StatCard label="ABR failures" value={stats.failed} tone="warn" />
          <StatCard label="Flagged for review" value={stats.flagged} tone="warn" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent lookups (last 500)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ABN, business name, entity name, or provider id…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger className="md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERIFIED_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={reviewFilter} onValueChange={setReviewFilter}>
                <SelectTrigger className="md:w-56">
                  <SelectValue placeholder="Review flag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All review flags</SelectItem>
                  {reviewFlags.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading lookups…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No lookups match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>ABN</TableHead>
                      <TableHead>Submitted name</TableHead>
                      <TableHead>ABR entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Review flag</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow
                        key={l.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(l)}
                      >
                        <TableCell className="whitespace-nowrap text-xs">
                          {format(new Date(l.created_at), "dd MMM yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {l.submitted_abn}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {l.submitted_business_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {l.entity_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {l.status ? (
                            <Badge variant="outline" className="text-xs">
                              {l.status}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{l.mode}</TableCell>
                        <TableCell>
                          {l.review_flag ? (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-800 border-amber-200"
                            >
                              {l.review_flag}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {l.duration_ms != null ? `${l.duration_ms}ms` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {l.verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                              <CheckCircle2 className="h-4 w-4" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-medium">
                              <XCircle className="h-4 w-4" /> Failed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lookup details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <DetailRow label="When">
                {format(new Date(selected.created_at), "dd MMM yyyy HH:mm:ss")}
              </DetailRow>
              <DetailRow label="Submitted ABN">
                <span className="font-mono">{selected.submitted_abn}</span>
              </DetailRow>
              <DetailRow label="Submitted business name">
                {selected.submitted_business_name || "—"}
              </DetailRow>
              <DetailRow label="Provider ID">
                <span className="font-mono text-xs">
                  {selected.provider_id || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Requested by user">
                <span className="font-mono text-xs">
                  {selected.user_id || "—"}
                </span>
              </DetailRow>
              <DetailRow label="Mode">{selected.mode}</DetailRow>
              <DetailRow label="ABR status">{selected.status || "—"}</DetailRow>
              <DetailRow label="Entity name">
                {selected.entity_name || "—"}
              </DetailRow>
              <DetailRow label="Business names">
                {selected.business_names && selected.business_names.length > 0
                  ? selected.business_names.join(", ")
                  : "—"}
              </DetailRow>
              <DetailRow label="GST registered">
                {selected.gst_registered === null
                  ? "—"
                  : selected.gst_registered
                    ? "Yes"
                    : "No"}
              </DetailRow>
              <DetailRow label="Review flag">
                {selected.review_flag || "—"}
              </DetailRow>
              <DetailRow label="Error">
                {selected.error_message || "—"}
              </DetailRow>
              <DetailRow label="Duration">
                {selected.duration_ms != null ? `${selected.duration_ms}ms` : "—"}
              </DetailRow>
              <div>
                <div className="font-medium mb-1">Raw ABR response</div>
                <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto max-h-80">
                  {JSON.stringify(selected.raw_response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warn";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1 border-b border-border/50">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2 break-words">{children}</div>
    </div>
  );
}