import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Save, ArrowLeft, Building2, MapPin, Wrench, Shield, ChevronsUpDown, Globe, Phone, Upload, ImageIcon, Mail } from "lucide-react";
import ServiceAreaPicker, { type ServiceAreaValue } from "@/components/ServiceAreaPicker";
import { computeCoverageStates, detectCoverageMode, CAPITAL_METROS } from "@/lib/serviceArea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AU_STATES = [
  { value: "NSW", label: "NSW" },
  { value: "VIC", label: "VIC" },
  { value: "QLD", label: "QLD" },
  { value: "WA", label: "WA" },
  { value: "SA", label: "SA" },
  { value: "TAS", label: "TAS" },
  { value: "ACT", label: "ACT" },
  { value: "NT", label: "NT" },
];

import { systemTypes } from "@/data/systemTypes";

const SYSTEM_TYPES = systemTypes.map((s) => ({ value: s.id, label: s.name }));
const VALID_SYSTEM_TYPE_IDS = new Set(SYSTEM_TYPES.map((s) => s.value));

const CERTIFICATIONS = [
  { value: "watermark-certified", label: "WaterMark Certified" },
  { value: "nsf-ansi", label: "NSF/ANSI" },
];

export default function VendorProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: vendorAccount, isLoading: loadingAccount } = useQuery({
    queryKey: ["vendor-account", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("*, providers(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user,
  });

  const provider = vendorAccount?.providers as any;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (provider?.logo) setLogoUrl(provider.logo);
  }, [provider]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${vendorAccount!.provider_id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("vendor-logos")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("vendor-logos").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      const { error: updateErr } = await supabase
        .from("providers")
        .update({ logo: publicUrl })
        .eq("id", vendorAccount!.provider_id);
      if (updateErr) throw updateErr;
      setLogoUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
      toast.success("Logo updated");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    description: "",
    system_types: [] as string[],
    brands: "",
    price_range: "mid" as string,
    years_in_business: 0,
    certifications: [] as string[],
    highlights: "",
    response_time: "Within 48 hours",
    warranty: "",
    website: "",
    phone: "",
    contact_email: "",
  });

  const [serviceArea, setServiceArea] = useState<ServiceAreaValue>({
    mode: "radius",
    baseSuburb: "",
    basePostcode: "",
    baseState: "",
    baseLat: null,
    baseLng: null,
    radiusKm: 50,
    statewide: false,
    regions: [],
  });

  useEffect(() => {
    if (provider) {
      const radius = provider.service_radius_km ?? 50;
      setForm({
        name: provider.name || "",
        description: provider.description || "",
        states: provider.states || [],
        service_base_suburb: provider.service_base_suburb || "",
        service_base_postcode: provider.service_base_postcode || "",
        service_base_state: provider.service_base_state || "",
        service_base_lat: provider.service_base_lat != null ? Number(provider.service_base_lat) : null,
        service_base_lng: provider.service_base_lng != null ? Number(provider.service_base_lng) : null,
        service_radius_km: radius >= 2000 ? 500 : radius,
        statewide: radius >= 2000,
        system_types: provider.system_types || [],
        brands: (provider.brands || []).join(", "),
        price_range: provider.price_range || "mid",
        years_in_business: provider.years_in_business || 0,
        certifications: provider.certifications || [],
        highlights: (provider.highlights || []).join(", "),
        response_time: provider.response_time || "Within 48 hours",
        warranty: provider.warranty || "",
        website: provider.website || "",
        phone: provider.phone || "",
        contact_email: provider.contact_email || "",
      });
    }
  }, [provider]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const invalid = form.system_types.filter((id) => !VALID_SYSTEM_TYPE_IDS.has(id));
      if (invalid.length > 0) {
        throw new Error(`Invalid system type(s): ${invalid.join(", ")}`);
      }
      if (!form.service_base_lat || !form.service_base_lng) {
        throw new Error("Please select your base service location");
      }
      const radiusToSave = form.statewide ? 5000 : form.service_radius_km;
      const derivedStates = deriveStatesFromBase(
        form.service_base_lat,
        form.service_base_lng,
        form.service_base_state,
        radiusToSave
      );
      const { error } = await supabase
        .from("providers")
        .update({
          name: form.name,
          description: form.description,
          states: derivedStates,
          service_base_suburb: form.service_base_suburb,
          service_base_postcode: form.service_base_postcode,
          service_base_state: form.service_base_state,
          service_base_lat: form.service_base_lat,
          service_base_lng: form.service_base_lng,
          service_radius_km: radiusToSave,
          system_types: form.system_types,
          brands: form.brands.split(",").map((s) => s.trim()).filter(Boolean),
          price_range: form.price_range as any,
          years_in_business: form.years_in_business,
          certifications: form.certifications,
          highlights: form.highlights.split(",").map((s) => s.trim()).filter(Boolean),
          response_time: form.response_time,
          warranty: form.warranty,
          website: form.website ? (/^https?:\/\//i.test(form.website.trim()) ? form.website.trim() : `https://${form.website.trim()}`) : null,
          phone: form.phone || null,
          contact_email: form.contact_email || null,
        })
        .eq("id", vendorAccount!.provider_id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => toast.error("Failed to save: " + err.message),
  });

  const toggleArrayItem = (field: "system_types" | "certifications", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  if (loadingAccount) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vendorAccount || !provider) {
    return (
      <div className="container max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">No vendor account found.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">Update your business listing details</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/vendor/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-6"
      >
        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" /> Business Information
            </CardTitle>
            <CardDescription>Your public-facing business details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                {logoUrl ? (
                  <AvatarImage src={logoUrl} alt="Business logo" />
                ) : null}
                <AvatarFallback>
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Label>Business Logo</Label>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP, max 2MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  {logoUrl ? "Change Logo" : "Upload Logo"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Years in Business</Label>
                <Input type="number" min={0} value={form.years_in_business} onChange={(e) => setForm((p) => ({ ...p, years_in_business: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Globe className="h-4 w-4" /> Website</Label>
                <Input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="h-4 w-4" /> Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0412 345 678" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="h-4 w-4" /> Lead Notification Email</Label>
              <Input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))}
                placeholder="leads@yourbusiness.com.au"
              />
              <p className="text-xs text-muted-foreground">Quote requests from customers will be sent to this email address.</p>
            </div>
          </CardContent>
        </Card>

        {/* Service Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" /> Service Area
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base Service Location</Label>
              <ServiceBaseAutocomplete
                value={
                  form.service_base_suburb
                    ? {
                        suburb: form.service_base_suburb,
                        postcode: form.service_base_postcode,
                        state: form.service_base_state,
                      }
                    : null
                }
                onSelect={(s) =>
                  setForm((p) => ({
                    ...p,
                    service_base_suburb: s.suburb,
                    service_base_postcode: s.postcode,
                    service_base_state: s.state,
                    service_base_lat: s.lat,
                    service_base_lng: s.lng,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                The suburb you operate out of. We use this to match you with nearby customers.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Service Radius</Label>
                <span className="text-sm font-medium tabular-nums">
                  {form.statewide ? "Statewide+" : `${form.service_radius_km} km`}
                </span>
              </div>
              <Slider
                min={5}
                max={500}
                step={5}
                value={[form.service_radius_km]}
                onValueChange={(v) => setForm((p) => ({ ...p, service_radius_km: v[0], statewide: false }))}
                disabled={form.statewide}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="statewide"
                  checked={form.statewide}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, statewide: !!v }))}
                />
                <Label htmlFor="statewide" className="text-sm font-normal cursor-pointer">
                  I service this whole state (or further)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Customers inside this radius from your base location are an exact match. Customers in your state but outside the radius will still see you ranked lower.
              </p>
            </div>

            {/* Auto-derived states preview */}
            <div className="space-y-1.5 rounded-md border border-dashed border-border bg-muted/30 p-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">States Covered (auto)</Label>
              {(() => {
                const derived = deriveStatesFromBase(
                  form.service_base_lat,
                  form.service_base_lng,
                  form.service_base_state,
                  form.statewide ? 5000 : form.service_radius_km
                );
                return derived.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {derived.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Pick a base location to see which states you'll cover.</p>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Systems & Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5" /> Systems & Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>System Types</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {form.system_types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {form.system_types.map((t) => {
                          const label = SYSTEM_TYPES.find((s) => s.value === t)?.label || t;
                          return <Badge key={t} variant="secondary" className="text-xs">{label}</Badge>;
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select system types...</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2">
                  {SYSTEM_TYPES.map((s) => (
                    <div key={s.value} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => toggleArrayItem("system_types", s.value)}>
                      <Checkbox checked={form.system_types.includes(s.value)} />
                      <span className="text-sm">{s.label}</span>
                    </div>
                  ))}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Brands (comma-separated)</Label>
              <Input value={form.brands} onChange={(e) => setForm((p) => ({ ...p, brands: e.target.value }))} placeholder="Puretec, 3M, Davey" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Select value={form.price_range} onValueChange={(v) => setForm((p) => ({ ...p, price_range: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid">Mid-range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Response Time</Label>
                <Select value={form.response_time} onValueChange={(v) => setForm((p) => ({ ...p, response_time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                    <SelectItem value="Within 48 hours">Within 48 hours</SelectItem>
                    <SelectItem value="2-3 business days">2-3 business days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warranty</Label>
              <Input value={form.warranty} onChange={(e) => setForm((p) => ({ ...p, warranty: e.target.value }))} placeholder="5 year warranty on all installations" />
            </div>
            <div className="space-y-2">
              <Label>Highlights (comma-separated)</Label>
              <Input value={form.highlights} onChange={(e) => setForm((p) => ({ ...p, highlights: e.target.value }))} placeholder="Free water testing, Same-day install" />
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" /> Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {form.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {form.certifications.map((c) => {
                        const label = CERTIFICATIONS.find((cert) => cert.value === c)?.label || c;
                        return <Badge key={c} variant="secondary" className="text-xs">{label}</Badge>;
                      })}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select certifications...</span>
                  )}
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                {CERTIFICATIONS.map((c) => (
                  <div key={c.value} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer" onClick={() => toggleArrayItem("certifications", c.value)}>
                    <Checkbox checked={form.certifications.includes(c.value)} />
                    <span className="text-sm">{c.label}</span>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending} size="lg">
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
