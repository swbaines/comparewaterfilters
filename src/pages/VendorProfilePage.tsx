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
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { isValidAbn, cleanAbn } from "@/lib/abn";
import ServiceAreaPicker, { type ServiceAreaValue } from "@/components/ServiceAreaPicker";
import { computeCoverageStates, detectCoverageMode, CAPITAL_METROS } from "@/lib/serviceArea";
import InstallationModelFields, {
  emptyInstallationModelValue,
  validateInstallationModel,
  type InstallationModelValue,
  type InstallationPartner,
} from "@/components/vendor/InstallationModelFields";
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
import { normalizeSystemTypeIds } from "@/lib/canonicalSystemTypes";

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
    trading_name: "",
    abn: "",
    description: "",
    system_types: [] as string[],
    brands: "",
    price_range: "mid" as string,
    years_in_business: 0,
    certifications: [] as string[],
    highlights: "",
    response_time: "Within 48 hours",
    warranty_product: "",
    warranty_workmanship: "",
    website: "",
    phone: "",
    contact_email: "",
    system_pricing: {} as Record<string, { min: string; max: string }>,
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

  const [installation, setInstallation] = useState<InstallationModelValue>(
    emptyInstallationModelValue(),
  );

  useEffect(() => {
    if (provider) {
      const radius = provider.service_radius_km ?? 50;
      // Parse stored warranty string into product / workmanship parts.
      // Format on save: "Product: X | Installation: Y" (either side optional)
      const rawWarranty: string = provider.warranty || "";
      let warrantyProduct = "";
      let warrantyWorkmanship = "";
      const productMatch = rawWarranty.match(/Product:\s*([^|]*)/i);
      const installMatch = rawWarranty.match(/Installation:\s*([^|]*)/i);
      if (productMatch || installMatch) {
        warrantyProduct = productMatch?.[1].trim() || "";
        warrantyWorkmanship = installMatch?.[1].trim() || "";
      } else {
        // Legacy single-value warranty — surface it under Product as the default.
        warrantyProduct = rawWarranty;
      }
      setForm({
        name: provider.name || "",
        trading_name: provider.trading_name || "",
        abn: provider.abn || "",
        description: provider.description || "",
        system_types: provider.system_types || [],
        brands: (provider.brands || []).join(", "),
        price_range: provider.price_range || "mid",
        years_in_business: provider.years_in_business || 0,
        certifications: provider.certifications || [],
        highlights: (provider.highlights || []).join(", "),
        response_time: provider.response_time || "Within 48 hours",
        warranty_product: warrantyProduct,
        warranty_workmanship: warrantyWorkmanship,
        website: provider.website || "",
        phone: provider.phone || "",
        contact_email: provider.contact_email || "",
        system_pricing: (() => {
          const raw = (provider.system_pricing || {}) as Record<string, { min?: number | string; max?: number | string }>;
          const out: Record<string, { min: string; max: string }> = {};
          for (const [key, val] of Object.entries(raw)) {
            out[key] = {
              min: val?.min != null ? String(val.min) : "",
              max: val?.max != null ? String(val.max) : "",
            };
          }
          return out;
        })(),
      });
      const mode = detectCoverageMode(provider.service_base_lat, provider.service_base_lng);
      const savedStates: string[] = provider.states || [];
      const metroValues: Set<string> = new Set(CAPITAL_METROS.map((m) => m.value));
      setServiceArea({
        mode,
        baseSuburb: provider.service_base_suburb || "",
        basePostcode: provider.service_base_postcode || "",
        baseState: provider.service_base_state || "",
        baseLat: provider.service_base_lat != null ? Number(provider.service_base_lat) : null,
        baseLng: provider.service_base_lng != null ? Number(provider.service_base_lng) : null,
        radiusKm: radius >= 2000 ? 500 : radius,
        statewide: radius >= 2000,
        regions: mode === "regions" ? savedStates.filter((s: string) => metroValues.has(s) || /^[A-Z]{2,3}$/.test(s)) : [],
      });

      const partnersRaw = (provider as any).installation_partners as
        | InstallationPartner[]
        | null
        | undefined;
      const partners =
        Array.isArray(partnersRaw) && partnersRaw.length > 0
          ? partnersRaw.map((p) => ({
              business_name: p?.business_name ?? "",
              licence_number: p?.licence_number ?? "",
              state: p?.state ?? "",
            }))
          : [{ business_name: "", licence_number: "", state: "" }];
      setInstallation({
        installation_model:
          ((provider as any).installation_model as
            | "in_house_licensed"
            | "sub_contracted"
            | null) ?? null,
        plumber_licence_number: provider.plumber_licence_number ?? "",
        plumbing_licence_state:
          ((provider as any).plumbing_licence_state as string | null) ?? "",
        has_public_liability: provider.has_public_liability ?? false,
        insurer_name: provider.insurer_name ?? "",
        public_liability_insurance_amount:
          (provider as any).public_liability_insurance_amount != null
            ? String((provider as any).public_liability_insurance_amount)
            : "",
        installation_partners: partners,
        sub_contractor_confirmed: !!(provider as any)
          .sub_contractor_confirmation_at,
      });
    }
  }, [provider]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Normalise aliases (e.g. whole-home-filtration → whole-house-filtration)
      // before validation and persistence so the canonical ID is the only
      // value that ever reaches the database.
      const normalizedSystemTypes = normalizeSystemTypeIds(form.system_types);
      const invalid = normalizedSystemTypes.filter((id) => !VALID_SYSTEM_TYPE_IDS.has(id));
      if (invalid.length > 0) {
        throw new Error(`Invalid system type(s): ${invalid.join(", ")}`);
      }

      // Validate ABN (11 digits, optional spaces)
      const abnClean = form.abn.replace(/\s/g, "");
      if (abnClean && !/^\d{11}$/.test(abnClean)) {
        throw new Error("ABN must be exactly 11 digits");
      }
      // Recompute verification each save so a corrected ABN flips status correctly.
      const abnVerified = abnClean ? isValidAbn(abnClean) : false;

      const installationError = validateInstallationModel(installation);
      if (installationError) throw new Error(installationError);

      let radiusToSave = 0;
      let baseFields: Record<string, any> = {
        service_base_suburb: null,
        service_base_postcode: null,
        service_base_state: null,
        service_base_lat: null,
        service_base_lng: null,
      };
      let statesToSave: string[] = [];

      if (serviceArea.mode === "radius") {
        if (!serviceArea.baseLat || !serviceArea.baseLng) {
          throw new Error("Please select your base service location");
        }
        radiusToSave = serviceArea.statewide ? 5000 : serviceArea.radiusKm;
        baseFields = {
          service_base_suburb: serviceArea.baseSuburb,
          service_base_postcode: serviceArea.basePostcode,
          service_base_state: serviceArea.baseState,
          service_base_lat: serviceArea.baseLat,
          service_base_lng: serviceArea.baseLng,
        };
        statesToSave = computeCoverageStates({
          mode: "radius",
          baseLat: serviceArea.baseLat,
          baseLng: serviceArea.baseLng,
          baseState: serviceArea.baseState,
          radiusKm: radiusToSave,
          regionSelections: [],
        });
      } else {
        if (serviceArea.regions.length === 0) {
          throw new Error("Please select at least one state or metro region");
        }
        // Persist the raw selections so metros are preserved across edits.
        // The matching engine maps metros → states via regionsToStates() at read time.
        statesToSave = serviceArea.regions;
      }

      const { error } = await supabase
        .from("providers")
        .update({
          name: form.name,
          trading_name: form.trading_name.trim() || null,
          abn: form.abn.replace(/\s/g, "") || null,
          abn_verified: abnVerified,
          abn_verified_at: abnVerified ? new Date().toISOString() : null,
          description: form.description,
          states: statesToSave,
          ...baseFields,
          service_radius_km: radiusToSave,
          system_types: normalizedSystemTypes,
          brands: form.brands.split(",").map((s) => s.trim()).filter(Boolean),
          price_range: form.price_range as any,
          years_in_business: form.years_in_business,
          certifications: form.certifications,
          highlights: form.highlights.split(",").map((s) => s.trim()).filter(Boolean),
          response_time: form.response_time,
          warranty: [
            form.warranty_product.trim() && `Product: ${form.warranty_product.trim()}`,
            form.warranty_workmanship.trim() && `Installation: ${form.warranty_workmanship.trim()}`,
          ].filter(Boolean).join(" | "),
          website: form.website ? (/^https?:\/\//i.test(form.website.trim()) ? form.website.trim() : `https://${form.website.trim()}`) : null,
          phone: form.phone || null,
          contact_email: form.contact_email || null,
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
          installation_partners: (
            installation.installation_model === "sub_contracted"
              ? installation.installation_partners.filter(
                  (p) => p.business_name.trim() && p.licence_number.trim(),
                )
              : []
          ) as any,
          sub_contractor_confirmation_at:
            installation.installation_model === "sub_contracted" &&
            installation.sub_contractor_confirmed
              ? (provider as any)?.sub_contractor_confirmation_at ||
                new Date().toISOString()
              : null,
            system_pricing: (() => {
              const out: Record<string, { min: number; max: number }> = {};
              for (const id of normalizedSystemTypes) {
                const entry = form.system_pricing[id];
                if (!entry) continue;
                const min = Number(entry.min);
                const max = Number(entry.max);
                if (!isFinite(min) || !isFinite(max) || min <= 0 || max <= 0) continue;
                if (max < min) continue;
                out[id] = { min: Math.round(min), max: Math.round(max) };
              }
              return out as any;
            })(),
        })
        .eq("id", vendorAccount!.provider_id);
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      toast.success("Profile updated successfully");
      // Live ABN verification (uses ABR API when ABR_API_GUID is configured,
      // otherwise falls back to checksum-only). Errors surface as soft warnings.
      const abnClean = form.abn.replace(/\s/g, "");
      if (vendorAccount?.provider_id && /^\d{11}$/.test(abnClean)) {
        try {
          const { data, error } = await supabase.functions.invoke("verify-abn", {
            body: {
              provider_id: vendorAccount.provider_id,
              abn: abnClean,
              business_name: form.name,
            },
          });
          if (error) throw error;
          if (data?.review_flag === "name_mismatch") {
            toast.warning("ABN found, but the registered name doesn't match — flagged for admin review.");
          } else if (data?.reason === "abn_cancelled") {
            toast.error("This ABN is marked Cancelled by the ABR. Lead delivery has been paused.");
          } else if (data?.verified) {
            toast.success("ABN verified");
          }
          queryClient.invalidateQueries({ queryKey: ["vendor-account"] });
        } catch (e) {
          console.error("verify-abn failed", e);
        }
      }
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
                <p className="text-xs text-muted-foreground">Registered legal name (as on your ABN).</p>
              </div>
              <div className="space-y-2">
                <Label>Trading Name</Label>
                <Input
                  value={form.trading_name}
                  onChange={(e) => setForm((p) => ({ ...p, trading_name: e.target.value }))}
                  placeholder="If different from business name"
                />
                <p className="text-xs text-muted-foreground">Optional — the name customers know you by.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  ABN
                  {cleanAbn(form.abn).length === 11 && (
                    isValidAbn(form.abn) ? (
                      <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <ShieldAlert className="h-3 w-3" /> Unverified
                      </Badge>
                    )
                  )}
                </Label>
                <Input
                  value={form.abn}
                  onChange={(e) => setForm((p) => ({ ...p, abn: e.target.value }))}
                  placeholder="12 345 678 901"
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  Australian Business Number — 11 digits. Verified ABNs display a trust badge on your public listing.
                </p>
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
          <CardContent>
            <ServiceAreaPicker value={serviceArea} onChange={setServiceArea} idPrefix="profile" />
          </CardContent>
        </Card>

        {/* Installation Model & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" /> Installation & Compliance
            </CardTitle>
            <CardDescription>
              How installations are carried out, plus licence and insurance details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstallationModelFields
              value={installation}
              onChange={setInstallation}
            />
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
                <Label>Overall Price Tier</Label>
                <Select value={form.price_range} onValueChange={(v) => setForm((p) => ({ ...p, price_range: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid">Mid-range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Used as a fallback when per-system pricing isn't set.</p>
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
            {/* Per-system pricing — appears once vendor has selected at least one system type */}
            {form.system_types.length > 0 && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <Label className="text-base">Indicative Price Range per System</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Give a typical installed price (AUD) for each system you offer. We use this to better match customers based on their budget.
                  </p>
                </div>
                <div className="space-y-3">
                  {form.system_types.map((id) => {
                    const label = SYSTEM_TYPES.find((s) => s.value === id)?.label || id;
                    const entry = form.system_pricing[id] || { min: "", max: "" };
                    return (
                      <div key={id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 sm:items-center">
                        <Label className="text-sm font-medium sm:pr-2">{label}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Min $</span>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            placeholder="800"
                            value={entry.min}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                system_pricing: {
                                  ...p.system_pricing,
                                  [id]: { min: e.target.value, max: p.system_pricing[id]?.max ?? "" },
                                },
                              }))
                            }
                            className="w-28"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Max $</span>
                          <Input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            placeholder="1600"
                            value={entry.max}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                system_pricing: {
                                  ...p.system_pricing,
                                  [id]: { min: p.system_pricing[id]?.min ?? "", max: e.target.value },
                                },
                              }))
                            }
                            className="w-28"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Warranty</Label>
                <Input
                  value={form.warranty_product}
                  onChange={(e) => setForm((p) => ({ ...p, warranty_product: e.target.value }))}
                  placeholder="e.g. 5 years (manufacturer)"
                />
                <p className="text-xs text-muted-foreground">Cover provided by the system manufacturer.</p>
              </div>
              <div className="space-y-2">
                <Label>Installation / Workmanship Warranty</Label>
                <Input
                  value={form.warranty_workmanship}
                  onChange={(e) => setForm((p) => ({ ...p, warranty_workmanship: e.target.value }))}
                  placeholder="e.g. 2 years on installation"
                />
                <p className="text-xs text-muted-foreground">Your guarantee on the install and labour.</p>
              </div>
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
