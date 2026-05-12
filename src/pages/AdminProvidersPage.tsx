import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, Loader2, Star, Eye, CheckCircle2, XCircle, Building2, MapPin, Wrench, Shield, Phone, ExternalLink, FileDown, FileCheck, AlertTriangle, ShieldCheck, CreditCard, History as HistoryIcon, Link2, Search } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { normalizeSystemTypeIds } from "@/lib/canonicalSystemTypes";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

import { systemTypes } from "@/data/systemTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import SystemTypeIdsManager from "@/components/admin/SystemTypeIdsManager";
import ProviderBillingActivityLog from "@/components/admin/ProviderBillingActivityLog";
import InstallationModelFields, {
  emptyInstallationModelValue,
  type InstallationModelValue,
} from "@/components/vendor/InstallationModelFields";
import InsuranceCertificateBlock from "@/components/admin/InsuranceCertificateBlock";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"] as const;

type ProviderRow = Tables<"providers">;

const emptyForm: Omit<TablesInsert<"providers">, "id" | "created_at" | "updated_at"> = {
  name: "",
  slug: "",
  description: "",
  logo: null,
  states: [],
  system_types: [],
  brands: [],
  price_range: "mid",
  rating: 0,
  review_count: 0,
  years_in_business: 0,
  certifications: [],
  highlights: [],
  available_for_quote: true,
  response_time: "Within 48 hours",
  warranty: "",
  website: null,
  phone: null,
  trading_name: null,
  abn: "",
  contact_email: null,
  google_business_url: "",
  plumber_licence_number: "",
  has_public_liability: false,
  insurer_name: "",
  service_base_suburb: null,
  service_base_postcode: null,
  service_base_state: null,
  service_radius_km: 50,
};

function installationFromProvider(p: ProviderRow | null): InstallationModelValue {
  if (!p) return emptyInstallationModelValue();
  return {
    installation_model:
      ((p as any).installation_model as
        | "in_house_licensed"
        | "sub_contracted"
        | null) ?? null,
    plumber_licence_number: p.plumber_licence_number ?? "",
    plumbing_licence_state:
      ((p as any).plumbing_licence_state as string | null) ?? "",
    has_public_liability: p.has_public_liability ?? false,
    insurer_name: p.insurer_name ?? "",
    public_liability_insurance_amount:
      (p as any).public_liability_insurance_amount != null
        ? String((p as any).public_liability_insurance_amount)
        : "",
    sub_contractor_confirmed: !!(p as any).sub_contractor_confirmation_at,
    insurance_expiry_date: (p as any).insurance_expiry_date ?? "",
    insurance_certificate_file: null,
    insurance_certificate_url: (p as any).insurance_certificate_url ?? "",
  };
}

function modelBadgeMeta(model: string | null | undefined) {
  if (model === "in_house_licensed")
    return {
      label: "In-house",
      title: "In-house licensed plumbing team",
      cls: "border-emerald-300 text-emerald-700",
    };
  if (model === "sub_contracted")
    return {
      label: "Sub-contracted",
      title: "Uses sub-contracted licensed plumbers",
      cls: "border-sky-300 text-sky-700",
    };
  return {
    label: "Not set",
    title: "Installation model not set",
    cls: "border-amber-300 text-amber-700",
  };
}

function arrayFieldToString(arr: string[] | null | undefined): string {
  return (arr || []).join(", ");
}

function stringToArray(s: string): string[] {
  return s.split(",").map((v) => v.trim()).filter(Boolean);
}

export default function AdminProvidersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [installation, setInstallation] = useState<InstallationModelValue>(
    emptyInstallationModelValue(),
  );
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [reviewProvider, setReviewProvider] = useState<ProviderRow | null>(null);
  const [verifyingAbn, setVerifyingAbn] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to limit DB hits
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Server-side provider search (ilike on name), limited to 8 results
  const { data: searchResults = [], isFetching: searchLoading } = useQuery({
    queryKey: ["admin-providers-search", debouncedSearch],
    enabled: debouncedSearch.length > 0,
    queryFn: async () => {
      const term = debouncedSearch.replace(/[%_]/g, (c) => `\\${c}`);
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .ilike("name", `%${term}%`)
        .order("name", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as ProviderRow[];
    },
    staleTime: 30_000,
  });
  const [pendingReject, setPendingReject] = useState<{ id: string; name: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [pendingApprove, setPendingApprove] = useState<{ id: string; name: string } | null>(null);
  const [pendingApplicationReject, setPendingApplicationReject] = useState<{ id: string; name: string } | null>(null);

  const sendApplicationDecisionEmail = async (id: string, decision: "approved" | "rejected") => {
    const { data: p } = await supabase.from("providers").select("name, contact_email").eq("id", id).maybeSingle();
    const recipient = p?.contact_email;
    if (!recipient) {
      toast.warning("No notification email sent", {
        description: `${p?.name ?? "This provider"} has no contact email on file.`,
      });
      return;
    }
    const templateName = decision === "approved" ? "vendor-application-approved" : "vendor-application-rejected";
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName,
        recipientEmail: recipient,
        idempotencyKey: `vendor-app-${decision}-${id}`,
        templateData: { businessName: p?.name },
      },
    }).then(({ error }) => {
      if (error) console.error(`Failed to send ${decision} email:`, error);
    });
  };

  const approveApplication = async (id: string, name: string) => {
    const { error } = await supabase.from("providers").update({ approval_status: "approved" as any, available_for_quote: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${name} approved!`);
    queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    supabase.functions.invoke('create-stripe-customer', { body: { provider_id: id } })
      .then(({ error: stripeErr }) => {
        if (stripeErr) console.error('Stripe customer creation failed:', stripeErr);
        else toast.success('Stripe customer created');
      });
    sendApplicationDecisionEmail(id, "approved");
  };

  const rejectApplication = async (id: string, name: string) => {
    const { error } = await supabase.from("providers").update({ approval_status: "rejected" as any }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`${name} rejected`);
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      sendApplicationDecisionEmail(id, "rejected");
    }
  };

  const updateApprovalStatus = async (id: string, value: ProviderRow["approval_status"]) => {
    const { error } = await supabase
      .from("providers")
      .update({ approval_status: value })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Status updated to ${value}`);
    queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
    queryClient.invalidateQueries({ queryKey: ["providers"] });
    if (value === "approved" || value === "rejected") {
      sendApplicationDecisionEmail(id, value);
    }
  };

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProviderRow[];
    },
  });

  // Deep-link: open Review dialog when ?review=<providerId> is present
  useEffect(() => {
    if (!providers.length) return;
    const params = new URLSearchParams(window.location.search);
    const reviewId = params.get("review");
    if (reviewId && !reviewProvider) {
      const match = providers.find((p) => p.id === reviewId);
      if (match) setReviewProvider(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  const { data: stripeDetails = [] } = useQuery({
    queryKey: ["admin-provider-stripe-details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_stripe_details")
        .select("provider_id, stripe_payment_method_id, direct_debit_authorised_at");
      if (error) throw error;
      return data;
    },
  });

  const billingReadyMap = new Map(
    stripeDetails.map((d) => [
      d.provider_id,
      Boolean(d.stripe_payment_method_id) && Boolean(d.direct_debit_authorised_at),
    ]),
  );
  const isBillingReady = (id: string) => billingReadyMap.get(id) === true;

  const [showOnlyNotBillingReady, setShowOnlyNotBillingReady] = useState(false);

  const validSystemTypeIds = new Set(systemTypes.map((s) => s.id));
  const auditResults = providers
    .map((p) => {
      const invalid = (p.system_types || []).filter((id) => !validSystemTypeIds.has(id));
      return invalid.length > 0 ? { id: p.id, name: p.name, slug: p.slug, invalid } : null;
    })
    .filter((r): r is { id: string; name: string; slug: string; invalid: string[] } => r !== null);

  const upsertMutation = useMutation({
    mutationFn: async (provider: TablesInsert<"providers">) => {
      // Normalise alias IDs (e.g. whole-home-filtration → whole-house-filtration)
      // before validating, so the canonical taxonomy stays the source of truth.
      const normalizedSystemTypes = normalizeSystemTypeIds(provider.system_types || []);
      const validIds = new Set(systemTypes.map((s) => s.id));
      const invalid = normalizedSystemTypes.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        throw new Error(`Invalid system type ID(s): ${invalid.join(", ")}. Pick from the dropdown.`);
      }
      provider = { ...provider, system_types: normalizedSystemTypes };
      if (editId) {
        const { error } = await supabase.from("providers").update(provider).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("providers").insert(provider);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success(editId ? "Provider updated" : "Provider added");
      closeDialog();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("providers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Provider deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
    setInstallation(emptyInstallationModelValue());
    setScrapeUrl("");
  };

  const openEdit = (p: ProviderRow) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      logo: p.logo,
      states: p.states,
      system_types: p.system_types,
      brands: p.brands,
      price_range: p.price_range,
      rating: p.rating,
      review_count: p.review_count,
      years_in_business: p.years_in_business,
      certifications: p.certifications,
      highlights: p.highlights,
      available_for_quote: p.available_for_quote,
      response_time: p.response_time,
      warranty: p.warranty,
      website: p.website,
      phone: p.phone,
      trading_name: p.trading_name ?? null,
      abn: p.abn ?? "",
      contact_email: p.contact_email ?? null,
      google_business_url: p.google_business_url ?? "",
      plumber_licence_number: p.plumber_licence_number ?? "",
      has_public_liability: p.has_public_liability ?? false,
      insurer_name: p.insurer_name ?? "",
      service_base_suburb: p.service_base_suburb ?? null,
      service_base_postcode: p.service_base_postcode ?? null,
      service_base_state: p.service_base_state ?? null,
      service_radius_km: p.service_radius_km ?? 50,
    });
    setInstallation(installationFromProvider(p));
    setDialogOpen(true);
  };

  const handleImport = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const res = await firecrawlApi.scrape(scrapeUrl);
      if (res.success && res.data) {
        const d = res.data;
        setForm((prev) => ({
          ...prev,
          name: d.name || prev.name,
          slug: (d.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          description: d.description || prev.description,
          states: d.states?.length ? d.states : prev.states,
          system_types: d.system_types?.length ? d.system_types : prev.system_types,
          brands: d.brands?.length ? d.brands : prev.brands,
          certifications: d.certifications?.length ? d.certifications : prev.certifications,
          highlights: d.highlights?.length ? d.highlights : prev.highlights,
          years_in_business: d.years_in_business || prev.years_in_business,
          warranty: d.warranty || prev.warranty,
          website: d.website || prev.website,
          phone: d.phone || prev.phone,
        }));
        toast.success("Provider details imported — review and save");
      } else {
        toast.error(res.error || "Failed to scrape website");
      }
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setScraping(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    // If admin uploaded a new certificate file, push it to storage first.
    let insuranceCertUrl: string | null =
      installation.insurance_certificate_url || null;
    if (
      installation.has_public_liability &&
      installation.insurance_certificate_file &&
      editId
    ) {
      try {
        const file = installation.insurance_certificate_file;
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
        const path = `${editId}/certificate-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vendor-insurance-certificates")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) throw upErr;
        insuranceCertUrl = path;
      } catch (e: any) {
        toast.error("Insurance certificate upload failed: " + e.message);
        return;
      }
    }

    const payload: any = {
      ...form,
      installation_model: installation.installation_model,
      plumber_licence_number:
        installation.installation_model === "in_house_licensed"
          ? installation.plumber_licence_number.trim()
          : "",
      plumbing_licence_state:
        installation.installation_model === "in_house_licensed"
          ? installation.plumbing_licence_state || null
          : null,
      has_public_liability: installation.has_public_liability,
      insurer_name: installation.has_public_liability
        ? installation.insurer_name.trim()
        : "",
      public_liability_insurance_amount:
        installation.has_public_liability &&
        installation.public_liability_insurance_amount.trim()
          ? Number(installation.public_liability_insurance_amount)
          : null,
      sub_contractor_confirmation_at:
        installation.installation_model === "sub_contracted" &&
        installation.sub_contractor_confirmed
          ? new Date().toISOString()
          : null,
      insurance_expiry_date:
        installation.has_public_liability && installation.insurance_expiry_date
          ? installation.insurance_expiry_date
          : null,
      insurance_certificate_url: insuranceCertUrl,
    };
    upsertMutation.mutate(payload);
  };

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      <div className="container max-w-6xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Provider Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage water filtration providers</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showOnlyNotBillingReady ? "default" : "outline"}
              onClick={() => setShowOnlyNotBillingReady((v) => !v)}
              className="gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {showOnlyNotBillingReady ? "Showing not billing-ready" : "Filter: not billing-ready"}
              {(() => {
                const count = providers.filter(
                  (p) => p.approval_status === "approved" && !isBillingReady(p.id),
                ).length;
                return count > 0 ? (
                  <Badge variant="destructive" className="ml-1">{count}</Badge>
                ) : null;
              })()}
            </Button>
            <Button variant="outline" onClick={() => setAuditOpen(true)} className="gap-2">
              <ShieldCheck className="h-4 w-4" /> Audit System Types
              {auditResults.length > 0 && (
                <Badge variant="destructive" className="ml-1">{auditResults.length}</Badge>
              )}
            </Button>
            <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Add Provider
            </Button>
          </div>
        </div>

        <details className="mb-6 rounded-lg border bg-card">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium hover:bg-accent/40 rounded-lg">
            System Type IDs (lookup table)
          </summary>
          <div className="border-t p-4">
            <SystemTypeIdsManager />
          </div>
        </details>

        {/* Quick search by provider name */}
        <div className="mb-6">
          <Popover open={searchOpen && searchQuery.trim().length > 0} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search providers by name… (press Enter to open the top match)"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!debouncedSearch) return;
                      if (searchLoading) return;
                      const match = searchResults[0];
                      if (match) {
                        setReviewProvider(match);
                        setSearchOpen(false);
                        setSearchQuery("");
                      } else {
                        toast.error("No matching provider found");
                      }
                    } else if (e.key === "Escape") {
                      setSearchOpen(false);
                    }
                  }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {(() => {
                if (searchLoading && searchResults.length === 0) {
                  return (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                    </div>
                  );
                }
                const matches = searchResults;
                if (matches.length === 0) {
                  return <div className="p-3 text-sm text-muted-foreground">No providers match “{searchQuery}”.</div>;
                }
                return (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {matches.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewProvider(p);
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="font-medium">{p.name}</span>
                          <Badge
                            variant={p.approval_status === "approved" ? "default" : p.approval_status === "pending" ? "secondary" : "destructive"}
                            className="capitalize"
                          >
                            {p.approval_status}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </PopoverContent>
          </Popover>
        </div>

        {/* Pending Applications */}
        {(() => {
          const pending = providers.filter(p => p.approval_status === "pending");
          if (pending.length === 0) return null;
          return (
            <Card className="mb-6 border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-xs font-bold">{pending.length}</span>
                  Pending Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>States</TableHead>
                      <TableHead>Systems</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <button
                                type="button"
                                onClick={() => setReviewProvider(p)}
                                className="font-medium text-primary hover:underline text-left"
                              >
                                {p.name}
                              </button>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</div>
                            </div>
                            {p.certification_files && typeof p.certification_files === "object" && Object.keys(p.certification_files as Record<string, unknown>).length > 0 && (
                              <Badge variant="outline" className="gap-1 border-green-300 text-green-700 text-xs whitespace-nowrap">
                                <FileCheck className="h-3 w-3" /> Docs
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.states.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {p.system_types.slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                            {p.system_types.length > 2 && <Badge variant="secondary" className="text-xs">+{p.system_types.length - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">{p.phone || "—"}</div>
                          {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Website</a>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => setReviewProvider(p)} className="gap-1">
                              <Eye className="h-3 w-3" /> Review
                            </Button>
                            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => setPendingApprove({ id: p.id, name: p.name })}>
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={() => setPendingApplicationReject({ id: p.id, name: p.name })}>
                              <XCircle className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })()}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ABN</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Terms</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers
                  .filter(p => p.approval_status !== "pending")
                  .filter(p => !showOnlyNotBillingReady || (p.approval_status === "approved" && !isBillingReady(p.id)))
                  .map((p) => (
                   <TableRow key={p.id}>
                     <TableCell className="font-medium">
                       <button
                         type="button"
                         onClick={() => setReviewProvider(p)}
                         className="text-primary hover:underline text-left"
                       >
                         {p.name}
                       </button>
                     </TableCell>
                    <TableCell>
                      {p.states.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : p.states.length === 1 ? (
                        <Badge variant="outline" className="text-xs">{p.states[0]}</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs cursor-help"
                          title={p.states.join(", ")}
                        >
                          Multiple ({p.states.length})
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{p.price_range}</Badge></TableCell>
                    <TableCell className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {p.rating}</TableCell>
                    <TableCell>
                      <Select
                        value={p.approval_status}
                        onValueChange={(value) => {
                          if (value === "rejected" && p.approval_status !== "rejected") {
                            setPendingReject({ id: p.id, name: p.name });
                            return;
                          }
                          updateApprovalStatus(p.id, value as ProviderRow["approval_status"]);
                        }}
                      >
                        <SelectTrigger
                          className={`h-7 w-[120px] text-xs capitalize ${
                            p.approval_status === "approved"
                              ? "border-green-300 text-green-700"
                              : p.approval_status === "pending"
                                ? "border-amber-300 text-amber-700"
                                : "border-red-300 text-red-700"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      {p.approval_status === "approved" && (p as any).approved_at && (() => {
                        const approvedAt = new Date((p as any).approved_at as string);
                        const days = Math.max(0, Math.floor((Date.now() - approvedAt.getTime()) / 86400000));
                        const reminders = ((p as any).setup_reminder_count as number) ?? 0;
                        const billingReady = isBillingReady(p.id);
                        const termsOk = !!(p as any).terms_accepted_at;
                        const setupComplete = billingReady && termsOk;
                        if (setupComplete) return null;
                        return (
                          <div className="mt-1 text-[10px] text-muted-foreground leading-tight">
                            Approved {days === 0 ? "today" : `${days}d ago`}
                            {reminders > 0 && ` — ${reminders} reminder${reminders === 1 ? "" : "s"} sent`}
                            {days >= 7 && reminders >= 3 && (
                              <span className="ml-1 text-red-600 font-medium">⚠ review</span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const flag = (p as any).abn_review_flag as string | null;
                        const verified = (p as any).abn_verified as boolean;
                        if (flag) {
                          const label =
                            flag === "name_mismatch"
                              ? "Name mismatch"
                              : flag === "abn_cancelled"
                                ? "Cancelled"
                                : flag === "abr_lookup_failed"
                                  ? "Lookup failed"
                                  : flag === "checksum_failed"
                                    ? "Invalid"
                                    : "Review";
                          return (
                            <Badge variant="outline" className="text-xs border-red-300 text-red-700 gap-1">
                              <AlertTriangle className="h-3 w-3" /> {label}
                            </Badge>
                          );
                        }
                        if (verified) {
                          return (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700 gap-1">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </Badge>
                          );
                        }
                        return (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 gap-1">
                            <Shield className="h-3 w-3" /> Unverified
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const m = modelBadgeMeta((p as any).installation_model);
                        return (
                          <Badge
                            variant="outline"
                            className={`text-xs ${m.cls}`}
                            title={m.title}
                          >
                            {m.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {(p as any).terms_accepted_at ? (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Accepted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 gap-1">
                          <XCircle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isBillingReady(p.id) ? (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700 gap-1">
                          <CreditCard className="h-3 w-3" /> Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 gap-1">
                          <AlertTriangle className="h-3 w-3" /> Not ready
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.available_for_quote}
                        onCheckedChange={async (checked) => {
                          const { error } = await supabase
                            .from("providers")
                            .update({ available_for_quote: checked })
                            .eq("id", p.id);
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          toast.success(checked ? "Provider activated" : "Provider deactivated");
                          queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                          queryClient.invalidateQueries({ queryKey: ["providers"] });
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete({ id: p.id, name: p.name })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {providers
                  .filter(p => p.approval_status !== "pending")
                  .filter(p => !showOnlyNotBillingReady || (p.approval_status === "approved" && !isBillingReady(p.id)))
                  .length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{showOnlyNotBillingReady ? "All approved providers are billing-ready 🎉" : "No providers yet"}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Delete confirmation */}
        <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the provider and all of their data. This action cannot be undone. Consider rejecting them instead if you might re-enable them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (pendingDelete) {
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                  }
                }}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject confirmation */}
        <AlertDialog open={pendingReject !== null} onOpenChange={(open) => { if (!open) setPendingReject(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject {pendingReject?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the provider from customer-facing results immediately. They will no longer appear in matches or quote requests. You can re-approve them later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (pendingReject) {
                    updateApprovalStatus(pendingReject.id, "rejected");
                    setPendingReject(null);
                  }
                }}
              >
                Reject provider
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pending application: Approve confirmation */}
        <AlertDialog open={pendingApprove !== null} onOpenChange={(open) => { if (!open) setPendingApprove(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve {pendingApprove?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will activate the provider and make them visible in customer-facing matches and quote requests. A Stripe customer will also be created for billing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => {
                  if (pendingApprove) {
                    approveApplication(pendingApprove.id, pendingApprove.name);
                    setPendingApprove(null);
                  }
                }}
              >
                Approve provider
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Pending application: Reject confirmation */}
        <AlertDialog open={pendingApplicationReject !== null} onOpenChange={(open) => { if (!open) setPendingApplicationReject(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject {pendingApplicationReject?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the application as rejected. They will not appear in customer-facing results. You can re-approve them later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (pendingApplicationReject) {
                    rejectApplication(pendingApplicationReject.id, pendingApplicationReject.name);
                    setPendingApplicationReject(null);
                  }
                }}
              >
                Reject application
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the provider and cannot be undone. Consider rejecting them instead if you may want to restore them later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (pendingDelete) {
                    deleteMutation.mutate(pendingDelete.id);
                    setPendingDelete(null);
                  }
                }}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogContent className="sm:max-w-4xl lg:max-w-5xl">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Provider" : "Add Provider"}</DialogTitle>
            </DialogHeader>

            {/* Import from URL */}
            {!editId && (
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <p className="mb-2 text-sm font-medium flex items-center gap-2"><Globe className="h-4 w-4" /> Import from website</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://provider-website.com.au"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                    />
                    <Button onClick={handleImport} disabled={scraping || !scrapeUrl.trim()} variant="outline">
                      {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Scrapes the website and pre-fills the form below for your review</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => {
                    updateField("name", e.target.value);
                    if (!editId) updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug *</Label>
                  <Input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Trading name</Label>
                  <Input value={form.trading_name ?? ""} onChange={(e) => updateField("trading_name", e.target.value || null)} placeholder="If different from business name" />
                </div>
                <div className="space-y-1.5">
                  <Label>ABN</Label>
                  <Input value={form.abn ?? ""} onChange={(e) => updateField("abn", e.target.value)} placeholder="11-digit ABN" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>States</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        {form.states && form.states.length > 0 ? form.states.join(", ") : "Select states..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3">
                      <div className="space-y-2">
                        {AU_STATES.map((state) => (
                          <label key={state} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={(form.states || []).includes(state)}
                              onCheckedChange={(checked) => {
                                const current = form.states || [];
                                updateField("states", checked ? [...current, state] : current.filter(s => s !== state));
                              }}
                            />
                            {state}
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Systems & brands */}
              <div className="space-y-1.5">
                <Label>System types</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      {form.system_types && form.system_types.length > 0
                        ? form.system_types.map(id => systemTypes.find(s => s.id === id)?.name || id).join(", ")
                        : "Select system types..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <div className="space-y-2">
                      {systemTypes.filter((st) => st.id !== "hybrid").map((st) => (
                        <label key={st.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={(form.system_types || []).includes(st.id)}
                            onCheckedChange={(checked) => {
                              const current = form.system_types || [];
                              updateField("system_types", checked ? [...current, st.id] : current.filter(id => id !== st.id));
                            }}
                          />
                          {st.name}
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Brands</Label>
                <Input value={arrayFieldToString(form.brands)} onChange={(e) => updateField("brands", stringToArray(e.target.value))} placeholder="Puretec, 3M, Aquasana" />
              </div>

              {/* Pricing & stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Price range</Label>
                  <Select value={form.price_range} onValueChange={(v) => updateField("price_range", v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="mid">Mid-range</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rating (0-5)</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={form.rating === 0 ? "" : form.rating} onChange={(e) => updateField("rating", e.target.value === "" ? 0 : parseFloat(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label>Review count</Label>
                  <Input type="number" value={form.review_count} onChange={(e) => updateField("review_count", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Years in business</Label>
                  <Input type="number" value={form.years_in_business} onChange={(e) => updateField("years_in_business", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Response time</Label>
                  <Input value={form.response_time} onChange={(e) => updateField("response_time", e.target.value)} />
                </div>
              </div>

              {/* Certifications & highlights */}
              <div className="space-y-1.5">
                <Label>Certifications</Label>
                <Input value={arrayFieldToString(form.certifications)} onChange={(e) => updateField("certifications", stringToArray(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Highlights</Label>
                <Input value={arrayFieldToString(form.highlights)} onChange={(e) => updateField("highlights", stringToArray(e.target.value))} />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={form.website || ""} onChange={(e) => updateField("website", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone || ""} onChange={(e) => updateField("phone", e.target.value || null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Contact email</Label>
                  <Input type="email" value={form.contact_email || ""} onChange={(e) => updateField("contact_email", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Google Business URL</Label>
                  <Input value={form.google_business_url ?? ""} onChange={(e) => updateField("google_business_url", e.target.value)} />
                </div>
              </div>

              {/* Service base location */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <Label>Base suburb</Label>
                  <Input value={form.service_base_suburb ?? ""} onChange={(e) => updateField("service_base_suburb", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Postcode</Label>
                  <Input value={form.service_base_postcode ?? ""} onChange={(e) => updateField("service_base_postcode", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input value={form.service_base_state ?? ""} onChange={(e) => updateField("service_base_state", e.target.value || null)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Service radius (km)</Label>
                <Input type="number" value={form.service_radius_km ?? 0} onChange={(e) => updateField("service_radius_km", parseInt(e.target.value) || 0)} />
              </div>

              {/* Installation model & compliance */}
              <div className="rounded-md border border-border p-3">
                <h4 className="mb-3 text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Installation & Compliance
                </h4>
                <InstallationModelFields
                  value={installation}
                  onChange={setInstallation}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Warranty</Label>
                <Input value={form.warranty} onChange={(e) => updateField("warranty", e.target.value)} />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.available_for_quote} onCheckedChange={(v) => updateField("available_for_quote", v)} />
                <Label>Available for quotes</Label>
              </div>

              <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full">
                {upsertMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editId ? "Update Provider" : "Save Provider"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Application Dialog */}
        <Dialog open={!!reviewProvider} onOpenChange={(open) => { if (!open) setReviewProvider(null); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <Eye className="h-5 w-5" />
                <span>Review Application: {reviewProvider?.name}</span>
                {reviewProvider && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="ml-auto gap-1.5"
                    onClick={async () => {
                      const url = `${window.location.origin}/admin/providers?review=${reviewProvider.id}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Provider link copied", { description: url });
                      } catch {
                        toast.error("Could not copy link", { description: url });
                      }
                    }}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Copy provider link
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            {reviewProvider && (
              <div className="space-y-5">
                {/* Business Details */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-primary" /> Business Details</h3>
                  {reviewProvider.logo && (
                    <div className="mb-3 flex items-center gap-3">
                      <img
                        src={reviewProvider.logo}
                        alt={`${reviewProvider.name} logo`}
                        className="h-14 w-14 rounded border object-contain bg-white"
                      />
                      <span className="text-xs text-muted-foreground">Business logo</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Business Name:</span> <span className="font-medium">{reviewProvider.name}</span></div>
                    {reviewProvider.trading_name && (
                      <div><span className="text-muted-foreground">Trading Name:</span> <span className="font-medium">{reviewProvider.trading_name}</span></div>
                    )}
                    <div>
                      <span className="text-muted-foreground">ABN:</span>{" "}
                      <span className="font-medium font-mono">{reviewProvider.abn || "—"}</span>
                      {reviewProvider.abn && (
                        (reviewProvider as any).abn_verified ? (
                          <Badge variant="outline" className="ml-2 border-green-300 text-green-700 gap-1">
                            <ShieldCheck className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700 gap-1">
                            <AlertTriangle className="h-3 w-3" /> Unverified
                          </Badge>
                        )
                      )}
                      {(reviewProvider as any).abn_review_flag && (
                        <Badge variant="destructive" className="ml-2">{((reviewProvider as any).abn_review_flag as string).replace(/_/g, " ")}</Badge>
                      )}
                      {reviewProvider.abn && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="ml-2 h-7 gap-1 text-xs"
                          disabled={verifyingAbn}
                          onClick={async () => {
                            setVerifyingAbn(true);
                            try {
                              const { data, error } = await supabase.functions.invoke("verify-abn", {
                                body: {
                                  provider_id: reviewProvider.id,
                                  abn: reviewProvider.abn,
                                  business_name: reviewProvider.name,
                                },
                              });
                              if (error) throw error;
                              if (data?.verified) {
                                toast.success(
                                  data.mode === "checksum-only"
                                    ? "ABN passed checksum (live ABR lookup not configured)"
                                    : "ABN verified against the ABR",
                                );
                              } else if (data?.reason === "abn_cancelled") {
                                toast.error("ABN is Cancelled — provider hidden from quotes");
                              } else if (data?.review_flag === "name_mismatch") {
                                toast.warning(`Name mismatch — ABR has “${data.entityName ?? "different entity"}”`);
                              } else if (data?.reason) {
                                toast.error(`Verification failed: ${data.error || data.reason}`);
                              }
                              const { data: refreshed } = await supabase
                                .from("providers")
                                .select("*")
                                .eq("id", reviewProvider.id)
                                .maybeSingle();
                              if (refreshed) setReviewProvider(refreshed as ProviderRow);
                              queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                            } catch (e: any) {
                              toast.error(e.message || "Verification failed");
                            } finally {
                              setVerifyingAbn(false);
                            }
                          }}
                        >
                          {verifyingAbn ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                          {verifyingAbn ? "Verifying…" : "Verify ABN"}
                        </Button>
                      )}
                      {(reviewProvider as any).abn_verified_at && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Last verified {new Date((reviewProvider as any).abn_verified_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div><span className="text-muted-foreground">Slug:</span> <span className="font-medium font-mono">{reviewProvider.slug}</span></div>
                    <div><span className="text-muted-foreground">Years in business:</span> <span className="font-medium">{reviewProvider.years_in_business}</span></div>
                    <div><span className="text-muted-foreground">Price Range:</span> <span className="font-medium capitalize">{reviewProvider.price_range}</span></div>
                    <div><span className="text-muted-foreground">Response Time:</span> <span className="font-medium">{reviewProvider.response_time}</span></div>
                    <div><span className="text-muted-foreground">Rating:</span> <span className="font-medium">{reviewProvider.rating || 0} ({reviewProvider.review_count || 0} reviews)</span></div>
                    <div><span className="text-muted-foreground">Available for quote:</span> <span className="font-medium">{reviewProvider.available_for_quote ? "Yes" : "No"}</span></div>
                    <div><span className="text-muted-foreground">Approval status:</span> <span className="font-medium capitalize">{reviewProvider.approval_status}</span></div>
                    {reviewProvider.contact_email && <div><span className="text-muted-foreground">Contact email:</span> <a href={`mailto:${reviewProvider.contact_email}`} className="font-medium text-primary hover:underline">{reviewProvider.contact_email}</a></div>}
                    {reviewProvider.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{reviewProvider.phone}</span></div>}
                    {reviewProvider.website && <div><span className="text-muted-foreground">Website:</span> <a href={reviewProvider.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{reviewProvider.website}</a></div>}
                    {reviewProvider.google_business_url && <div><span className="text-muted-foreground">Google Business:</span> <a href={reviewProvider.google_business_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">View profile</a></div>}
                  </div>
                  {reviewProvider.description && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1 bg-muted/50 rounded p-2">{reviewProvider.description}</p>
                    </div>
                  )}
                </div>

                {/* Service Area */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-primary" /> Service Area</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-2">
                    {(reviewProvider.service_base_suburb || reviewProvider.service_base_state) && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Base location:</span>{" "}
                        <span className="font-medium">
                          {[reviewProvider.service_base_suburb, reviewProvider.service_base_postcode, reviewProvider.service_base_state].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                    {reviewProvider.service_radius_km != null && (
                      <div>
                        <span className="text-muted-foreground">Service radius:</span>{" "}
                        <span className="font-medium">{reviewProvider.service_radius_km >= 2000 ? "Statewide" : `${reviewProvider.service_radius_km} km`}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">Coverage states / regions:</span>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {reviewProvider.states.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    {reviewProvider.states.length === 0 && <span className="text-sm text-muted-foreground italic">None specified</span>}
                  </div>
                </div>

                {/* Systems & Expertise */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Wrench className="h-4 w-4 text-primary" /> Systems & Expertise</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">System Types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewProvider.system_types.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                        {reviewProvider.system_types.length === 0 && <span className="text-sm text-muted-foreground italic">None specified</span>}
                      </div>
                    </div>
                    {reviewProvider.system_pricing && typeof reviewProvider.system_pricing === "object" && Object.keys(reviewProvider.system_pricing as Record<string, unknown>).length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">System Pricing (AUD):</span>
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                          {Object.entries(reviewProvider.system_pricing as Record<string, { min?: number; max?: number }>).map(([key, val]) => (
                            <div key={key} className="rounded border bg-muted/30 px-2 py-1">
                              <span className="font-medium">{key}:</span>{" "}
                              <span>${val?.min ?? "—"} – ${val?.max ?? "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-muted-foreground">Brands:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewProvider.brands.map((b) => <Badge key={b} variant="outline">{b}</Badge>)}
                        {reviewProvider.brands.length === 0 && <span className="text-sm text-muted-foreground italic">None specified</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Certifications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewProvider.certifications.map((c) => <Badge key={c} variant="outline" className="border-green-300 text-green-700">{c}</Badge>)}
                        {reviewProvider.certifications.length === 0 && <span className="text-sm text-muted-foreground italic">None specified</span>}
                      </div>
                      {/* Certification proof files */}
                      {(() => {
                        const certFiles = (reviewProvider as any).certification_files as Record<string, string> | null;
                        if (!certFiles || Object.keys(certFiles).length === 0) return null;
                        return (
                          <div className="mt-2 space-y-1.5">
                            <span className="text-sm text-muted-foreground">Proof documents:</span>
                            {Object.entries(certFiles).map(([certKey, filePath]) => (
                              <div key={certKey} className="flex items-center gap-2 rounded-md border border-input p-2 text-sm">
                                <FileCheck className="h-4 w-4 text-primary shrink-0" />
                                <span className="flex-1 truncate capitalize">{certKey.replace(/-/g, " ")}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 h-7 text-xs"
                                  onClick={async () => {
                                    const { data, error } = await supabase.storage
                                      .from("certification-files")
                                      .createSignedUrl(filePath, 300);
                                    if (error) { toast.error("Failed to get file"); return; }
                                    window.open(data.signedUrl, "_blank");
                                  }}
                                >
                                  <FileDown className="h-3 w-3" /> View
                                </Button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Compliance & Insurance */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-primary" /> Compliance & Insurance</h3>
                  {(() => {
                    const m = modelBadgeMeta(
                      (reviewProvider as any).installation_model,
                    );
                    return (
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Installation model:</span>
                        <Badge variant="outline" className={`text-xs ${m.cls}`}>
                          {m.label}
                        </Badge>
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Plumber licence #:</span> <span className="font-medium">{reviewProvider.plumber_licence_number || "—"}</span></div>
                    <div><span className="text-muted-foreground">Licence state:</span> <span className="font-medium">{(reviewProvider as any).plumbing_licence_state || "—"}</span></div>
                    <div><span className="text-muted-foreground">Public liability:</span> <span className="font-medium">{reviewProvider.has_public_liability ? "Yes" : "No"}</span></div>
                    <div><span className="text-muted-foreground">Cover amount:</span> <span className="font-medium">{(reviewProvider as any).public_liability_insurance_amount ? `A$${Number((reviewProvider as any).public_liability_insurance_amount).toLocaleString()}` : "—"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Insurer:</span> <span className="font-medium">{reviewProvider.insurer_name || "—"}</span></div>
                    <div className="col-span-2"><span className="text-muted-foreground">Terms accepted:</span> <span className="font-medium">{reviewProvider.terms_accepted_at ? new Date(reviewProvider.terms_accepted_at).toLocaleString() : "—"}</span></div>
                    {(reviewProvider as any).sub_contractor_confirmation_at && (
                      <div className="col-span-2"><span className="text-muted-foreground">Sub-contractor declaration accepted:</span> <span className="font-medium">{new Date((reviewProvider as any).sub_contractor_confirmation_at).toLocaleString()}</span></div>
                    )}
                  </div>
                  <InsuranceCertificateBlock provider={reviewProvider} />
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-primary" /> Additional Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="col-span-2"><span className="text-muted-foreground">Warranty:</span> <span className="font-medium">{reviewProvider.warranty || "—"}</span></div>
                  </div>
                  {reviewProvider.highlights.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Highlights:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {reviewProvider.highlights.map((h) => <Badge key={h} variant="secondary">{h}</Badge>)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Submitted: {new Date(reviewProvider.created_at).toLocaleString()}
                </div>

                {/* Billing Activity Log — admin record for disputes */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <HistoryIcon className="h-4 w-4 text-primary" /> Billing Activity Log
                  </h3>
                  <ProviderBillingActivityLog providerId={reviewProvider.id} />
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2 border-t">
                  {/* Status + visibility controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Approval status</Label>
                      <Select
                        value={reviewProvider.approval_status}
                        onValueChange={async (value) => {
                          await updateApprovalStatus(reviewProvider.id, value as ProviderRow["approval_status"]);
                          const { data } = await supabase.from("providers").select("*").eq("id", reviewProvider.id).maybeSingle();
                          if (data) setReviewProvider(data as ProviderRow);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Available for quote</Label>
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border">
                        <Switch
                          checked={reviewProvider.available_for_quote}
                          onCheckedChange={async (checked) => {
                            const { error } = await supabase
                              .from("providers")
                              .update({ available_for_quote: checked })
                              .eq("id", reviewProvider.id);
                            if (error) { toast.error(error.message); return; }
                            toast.success(checked ? "Provider is now visible to customers" : "Provider hidden from customers");
                            queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                            queryClient.invalidateQueries({ queryKey: ["providers"] });
                            setReviewProvider({ ...reviewProvider, available_for_quote: checked });
                          }}
                        />
                        <span className="text-sm">{reviewProvider.available_for_quote ? "Visible" : "Hidden"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="flex-1 min-w-[140px] gap-2 bg-green-600 hover:bg-green-700 text-white"
                      disabled={reviewProvider.approval_status === "approved"}
                      onClick={async () => {
                        const { error } = await supabase.from("providers").update({ approval_status: "approved" as any, available_for_quote: true }).eq("id", reviewProvider.id);
                        if (error) { toast.error(error.message); return; }
                        toast.success(`${reviewProvider.name} approved!`);
                        queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                        setReviewProvider(null);
                        supabase.functions.invoke('create-stripe-customer', { body: { provider_id: reviewProvider.id } })
                          .then(({ error: stripeErr }) => {
                            if (stripeErr) console.error('Stripe customer creation failed:', stripeErr);
                            else toast.success('Stripe customer created');
                          });
                        sendApplicationDecisionEmail(reviewProvider.id, "approved");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 min-w-[140px] gap-2"
                      disabled={reviewProvider.approval_status === "rejected"}
                      onClick={() => setPendingApplicationReject({ id: reviewProvider.id, name: reviewProvider.name })}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const p = reviewProvider;
                        setReviewProvider(null);
                        openEdit(p);
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete({ id: reviewProvider.id, name: reviewProvider.name })}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* System Type Audit Dialog */}
        <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> System Types Audit
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scans all providers for <code className="text-xs bg-muted px-1 rounded">system_types</code> values that don't match a known ID in the recommendation engine.
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Valid IDs:</strong>{" "}
                {systemTypes.map((s) => s.id).join(", ")}
              </div>

              {auditResults.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <div className="font-medium">All clean</div>
                    <div className="text-sm">All {providers.length} provider(s) use valid system type IDs.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {auditResults.length} provider(s) have invalid system type IDs
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Invalid IDs</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {r.invalid.map((id) => (
                                <Badge key={id} variant="destructive" className="text-xs">{id}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const provider = providers.find((p) => p.id === r.id);
                                if (provider) {
                                  setEditId(provider.id);
                                  setForm({
                                    name: provider.name,
                                    slug: provider.slug,
                                    description: provider.description,
                                    logo: provider.logo,
                                    states: provider.states,
                                    system_types: provider.system_types,
                                    brands: provider.brands,
                                    price_range: provider.price_range,
                                    rating: provider.rating,
                                    review_count: provider.review_count,
                                    years_in_business: provider.years_in_business,
                                    certifications: provider.certifications,
                                    highlights: provider.highlights,
                                    available_for_quote: provider.available_for_quote,
                                    response_time: provider.response_time,
                                    warranty: provider.warranty,
                                    website: provider.website,
                                    phone: provider.phone,
                                  });
                                  setAuditOpen(false);
                                  setDialogOpen(true);
                                }
                              }}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Fix
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
