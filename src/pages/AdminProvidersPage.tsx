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
import { Plus, Pencil, Trash2, Globe, Loader2, Star, LogOut } from "lucide-react";
import { firecrawlApi } from "@/lib/api/firecrawl";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };
  const [scraping, setScraping] = useState(false);

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
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Provider Management</h1>
            <p className="text-muted-foreground">Add, edit, and manage water filtration providers</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setEditId(null); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add Provider
          </Button>
        </div>

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
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.states.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{p.price_range}</Badge></TableCell>
                    <TableCell className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {p.rating}</TableCell>
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
                {providers.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No providers yet</TableCell></TableRow>
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
                  <Label>States (comma-separated)</Label>
                  <Input value={arrayFieldToString(form.states)} onChange={(e) => updateField("states", stringToArray(e.target.value))} placeholder="NSW, VIC, QLD" />
                </div>
                <div className="space-y-1.5">
                  <Label>Postcode ranges</Label>
                  <Input value={arrayFieldToString(form.postcode_ranges)} onChange={(e) => updateField("postcode_ranges", stringToArray(e.target.value))} placeholder="2000-2999, 3000-3999" />
                </div>
              </div>

              {/* Systems & brands */}
              <div className="space-y-1.5">
                <Label>System types (comma-separated IDs)</Label>
                <Input value={arrayFieldToString(form.system_types)} onChange={(e) => updateField("system_types", stringToArray(e.target.value))} placeholder="under-sink-carbon, reverse-osmosis, whole-house-carbon" />
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
                  <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => updateField("rating", parseFloat(e.target.value) || 0)} />
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
      </div>
    </div>
  );
}
