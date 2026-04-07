import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, Loader2, Star, Eye, CheckCircle2, XCircle, Building2, MapPin, Wrench, Shield, Phone, ExternalLink, FileDown, FileCheck } from "lucide-react";
import AdminNav from "@/components/AdminNav";
import { firecrawlApi } from "@/lib/api/firecrawl";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

import { systemTypes } from "@/data/systemTypes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"] as const;

type ProviderRow = Tables<"providers">;

const emptyForm: Omit<TablesInsert<"providers">, "id" | "created_at" | "updated_at"> = {
  name: "",
  slug: "",
  description: "",
  logo: null,
  states: [],
  postcode_ranges: [],
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
};

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
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [reviewProvider, setReviewProvider] = useState<ProviderRow | null>(null);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("providers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProviderRow[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (provider: TablesInsert<"providers">) => {
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
      postcode_ranges: p.postcode_ranges,
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
    });
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

  const handleSave = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    upsertMutation.mutate(form);
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
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Provider
          </Button>
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
                              <div className="font-medium">{p.name}</div>
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
                            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                              const { error } = await supabase.from("providers").update({ approval_status: "approved" as any, available_for_quote: true }).eq("id", p.id);
                              if (error) { toast.error(error.message); return; }
                              toast.success(`${p.name} approved!`);
                              queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                              // Auto-create Stripe customer
                              supabase.functions.invoke('create-stripe-customer', { body: { provider_id: p.id } })
                                .then(({ error: stripeErr }) => {
                                  if (stripeErr) console.error('Stripe customer creation failed:', stripeErr);
                                  else toast.success('Stripe customer created');
                                });
                            }}>
                              <CheckCircle2 className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" onClick={async () => {
                              const { error } = await supabase.from("providers").update({ approval_status: "rejected" as any }).eq("id", p.id);
                              if (error) toast.error(error.message);
                              else { toast.success(`${p.name} rejected`); queryClient.invalidateQueries({ queryKey: ["admin-providers"] }); }
                            }}>
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
                  <TableHead>Terms</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.filter(p => p.approval_status !== "pending").map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.states.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{p.price_range}</Badge></TableCell>
                    <TableCell className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {p.rating}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs capitalize ${p.approval_status === "approved" ? "border-green-300 text-green-700" : "border-red-300 text-red-700"}`}>
                        {p.approval_status}
                      </Badge>
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
                    <TableCell>{p.available_for_quote ? "✅" : "❌"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this provider?")) deleteMutation.mutate(p.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {providers.filter(p => (p as any).approval_status !== "pending").length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No providers yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                <div className="space-y-1.5">
                  <Label>Postcode ranges</Label>
                  <Input value={arrayFieldToString(form.postcode_ranges)} onChange={(e) => updateField("postcode_ranges", stringToArray(e.target.value))} placeholder="2000-2999, 3000-3999" />
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
                      {systemTypes.map((st) => (
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
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" /> Review Application: {reviewProvider?.name}
              </DialogTitle>
            </DialogHeader>
            {reviewProvider && (
              <div className="space-y-5">
                {/* Business Details */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Building2 className="h-4 w-4 text-primary" /> Business Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{reviewProvider.name}</span></div>
                    <div><span className="text-muted-foreground">Years:</span> <span className="font-medium">{reviewProvider.years_in_business}</span></div>
                    <div><span className="text-muted-foreground">Price Range:</span> <span className="font-medium capitalize">{reviewProvider.price_range}</span></div>
                    <div><span className="text-muted-foreground">Response Time:</span> <span className="font-medium">{reviewProvider.response_time}</span></div>
                    {reviewProvider.phone && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{reviewProvider.phone}</span></div>}
                    {reviewProvider.website && <div><span className="text-muted-foreground">Website:</span> <a href={reviewProvider.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{reviewProvider.website}</a></div>}
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
                  <div className="flex flex-wrap gap-1 mb-1">
                    {reviewProvider.states.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                  </div>
                  {reviewProvider.postcode_ranges && reviewProvider.postcode_ranges.length > 0 && (
                    <div className="text-sm text-muted-foreground">Postcodes: {reviewProvider.postcode_ranges.join(", ")}</div>
                  )}
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

                {/* Additional Details */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Shield className="h-4 w-4 text-primary" /> Additional Details</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Warranty:</span> <span className="font-medium">{reviewProvider.warranty || "—"}</span></div>
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

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={async () => {
                    const { error } = await supabase.from("providers").update({ approval_status: "approved" as any, available_for_quote: true }).eq("id", reviewProvider.id);
                    if (error) { toast.error(error.message); return; }
                    toast.success(`${reviewProvider.name} approved!`);
                    queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                    setReviewProvider(null);
                    // Auto-create Stripe customer
                    supabase.functions.invoke('create-stripe-customer', { body: { provider_id: reviewProvider.id } })
                      .then(({ error: stripeErr }) => {
                        if (stripeErr) console.error('Stripe customer creation failed:', stripeErr);
                        else toast.success('Stripe customer created');
                      });
                  }}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="destructive" className="flex-1 gap-2" onClick={async () => {
                    const { error } = await supabase.from("providers").update({ approval_status: "rejected" as any }).eq("id", reviewProvider.id);
                    if (error) toast.error(error.message);
                    else {
                      toast.success(`${reviewProvider.name} rejected`);
                      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
                      setReviewProvider(null);
                    }
                  }}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
