import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  ImageIcon,
  MapPin,
  Send,
  Shield,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { QuizAnswers } from "@/lib/recommendationEngine";
import { useMatchedVendors, type MatchedVendor } from "@/hooks/useMatchedVendors";
import {
  scoreVendorBudgetFit,
  formatStartingFrom,
  type BudgetBand,
} from "@/lib/budgetMatching";
import { deriveLeadTemperature } from "@/lib/leadTemperature";

interface Props {
  customerLat: number | null;
  customerLng: number | null;
  answers: QuizAnswers;
  recommendedSystems: string[];
}

function formatResponseMinutes(mins: number | null): string {
  if (mins == null) return "New on platform";
  if (mins < 60) return `~${Math.round(mins)} min avg`;
  const hrs = mins / 60;
  if (hrs < 24) return `~${hrs.toFixed(1)} hr avg`;
  return `~${(hrs / 24).toFixed(1)} day avg`;
}

function VendorRow({
  vendor,
  selected,
  onToggle,
  rank,
  budgetBadge,
  startingFromLabel,
}: {
  vendor: MatchedVendor;
  selected: boolean;
  onToggle: () => void;
  rank: number;
  budgetBadge: "best-budget" | "within-budget" | null;
  startingFromLabel: string | null;
}) {
  const rankLabels: Record<number, string> = {
    0: "Top match",
    1: "Strong match",
    2: "Good match",
  };

  return (
    <Card
      className={`overflow-hidden border-2 transition ${
        selected ? "border-primary shadow-md" : "border-border"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            className="mt-1 h-5 w-5"
            aria-label={`Select ${vendor.name}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 border">
                  {vendor.logo ? <AvatarImage src={vendor.logo} alt={vendor.name} /> : null}
                  <AvatarFallback>
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {rankLabels[rank] && (
                      <Badge
                        className={
                          rank === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        }
                      >
                        {rankLabels[rank]}
                      </Badge>
                    )}
                    {budgetBadge === "best-budget" && (
                      <Badge className="bg-primary/10 text-primary border border-primary/30">
                        Best for your budget
                      </Badge>
                    )}
                    {budgetBadge === "within-budget" && (
                      <Badge variant="outline" className="text-xs">
                        Within your budget
                      </Badge>
                    )}
                    {vendor.cap_exceeded && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" /> High volume this month
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-1 flex items-center gap-1.5 text-base font-semibold">
                    <span className="truncate">{vendor.name}</span>
                    {vendor.abn_verified && (
                      <span
                        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800"
                        title="ABN verified against the Australian Business Register format checksum"
                      >
                        <ShieldCheck className="h-3 w-3" /> ABN
                      </span>
                    )}
                  </h3>
                  {startingFromLabel && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Indicative pricing {startingFromLabel}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {vendor.description}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="font-medium">{Number(vendor.rating).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({vendor.review_count})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {formatResponseMinutes(vendor.avg_response_minutes)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {vendor.years_in_business}y experience
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {vendor.distance_km != null
                    ? `${Math.round(vendor.distance_km)}km away`
                    : vendor.service_base_suburb || "Local"}
                </span>
              </div>
            </div>

            {vendor.matching_systems.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {vendor.matching_systems.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs font-normal">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {s.replace(/-/g, " ")}
                  </Badge>
                ))}
                {vendor.certifications.slice(0, 2).map((c) => (
                  <Badge key={c} variant="outline" className="text-xs font-normal">
                    <Award className="mr-1 h-3 w-3" /> {c}
                  </Badge>
                ))}
                {vendor.installation_model === "in_house_licensed" && (
                  <Badge
                    variant="outline"
                    className="text-xs font-normal border-emerald-300 text-emerald-700"
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" /> Licensed Plumber
                  </Badge>
                )}
                {vendor.installation_model === "sub_contracted" && (
                  <>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal border-sky-300 text-sky-700"
                    >
                      <Shield className="mr-1 h-3 w-3" /> Trusted Retailer
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs font-normal border-sky-300 text-sky-700"
                    >
                      <ShieldCheck className="mr-1 h-3 w-3" /> Licensed Installation Network
                    </Badge>
                  </>
                )}
              </div>
            )}

            {vendor.installation_model && (
              <p className="mt-2 text-xs text-muted-foreground">
                {vendor.installation_model === "in_house_licensed"
                  ? "Licensed plumbing team"
                  : "Licensed plumbing partners"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchedVendorsSection({
  customerLat,
  customerLng,
  answers,
  recommendedSystems,
}: Props) {
  const { data: vendors = [], isLoading } = useMatchedVendors({
    customerLat,
    customerLng,
    customerState: answers.state,
    recommendedSystems,
  });

  // Re-rank using the SQL ordering as a base, then bias toward vendors whose
  // per-system pricing fits the customer's budget band. Higher composite score
  // wins; ties fall back to the original (SQL) order.
  const rankedVendors = useMemo(() => {
    const band = (answers.budget || "") as BudgetBand;
    return vendors
      .map((v, idx) => {
        const fit = scoreVendorBudgetFit(
          v.system_pricing || {},
          recommendedSystems,
          band,
        );
        // SQL rank decays from 1.0 (top) → ~0 over 10 results.
        const sqlScore = Math.max(0, 1 - idx / 10);
        // Weight: 60% SQL relevance/performance, 40% budget fit when we have data.
        const composite = fit.pricedSystems > 0
          ? sqlScore * 0.6 + fit.score * 0.4
          : sqlScore * 0.6;
        return { vendor: v, fit, composite, idx };
      })
      .sort((a, b) => b.composite - a.composite || a.idx - b.idx);
  }, [vendors, recommendedSystems, answers.budget]);

  // Show up to 3 after re-ranking
  const topVendors = useMemo(
    () => rankedVendors.slice(0, 3).map((r) => r.vendor),
    [rankedVendors],
  );

  // Decide which vendor (if any) earns the "Best for your budget" badge:
  // the highest-scoring fit among the top 3 with a usable score.
  const bestBudgetProviderId = useMemo(() => {
    const top3 = rankedVendors.slice(0, 3);
    const candidates = top3.filter((r) => r.fit.pricedSystems > 0 && r.fit.withinBudget);
    if (candidates.length === 0) return null;
    const winner = candidates.reduce((best, cur) =>
      cur.fit.score > best.fit.score ? cur : best,
    );
    // Only show the highlight badge when there's a meaningful fit
    return winner.fit.score >= 0.25 ? winner.vendor.provider_id : null;
  }, [rankedVendors]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [vendorAck, setVendorAck] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);

  // Pre-select all top vendors when they load
  useEffect(() => {
    if (topVendors.length > 0 && selected.size === 0 && submitted.length === 0) {
      setSelected(new Set(topVendors.map((v) => v.provider_id)));
    }
  }, [topVendors, selected.size, submitted.length]);

  const toggleVendor = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendAll = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one provider to request quotes from.");
      return;
    }
    setSending(true);
    try {
      const { getEffectiveLeadPrices } = await import("@/lib/leadPricing");
      const prices = await getEffectiveLeadPrices();
      const leadPrice =
        answers.ownershipStatus === "Rent" ? prices.rental_lead : prices.owner_lead;

      const dedupedSystems = [...new Set(recommendedSystems)];
      const selectedVendors = topVendors.filter((v) => selected.has(v.provider_id));

      const rows = selectedVendors.map((v) => ({
        id: crypto.randomUUID(),
        provider_id: v.provider_id,
        provider_name: v.name,
        customer_name: answers.firstName,
        customer_email: answers.email,
        customer_mobile: answers.mobile || null,
        customer_suburb: answers.suburb,
        customer_state: answers.state,
        customer_postcode: answers.postcode,
        property_type: answers.propertyType,
        household_size: answers.householdSize,
        property_age: answers.propertyAge || null,
        water_source: answers.waterSource,
        water_tested_recently: answers.waterTestedRecently || null,
        water_usage_type: answers.waterUsageType || null,
        concerns: answers.concerns,
        budget: answers.budget,
        maintenance_tolerance: answers.maintenanceTolerance || null,
        installation_timeline: answers.installationTimeline || null,
        recommended_systems: dedupedSystems,
        message: message || null,
        ownership_status: answers.ownershipStatus || null,
        lead_price: leadPrice,
        contact_preference: answers.contactPreference || "no_preference",
      }));

      const { error } = await supabase.from("quote_requests").insert(rows);
      if (error) throw error;

      // Fire-and-forget vendor + customer notifications
      for (const v of selectedVendors) {
        const row = rows.find((r) => r.provider_id === v.provider_id)!;
        const leadTemperature = deriveLeadTemperature(answers.installationTimeline);
        supabase
          .from("providers")
          .select("contact_email")
          .eq("id", v.provider_id)
          .maybeSingle()
          .then(({ data: pd }) => {
            if (pd?.contact_email) {
              supabase.functions
                .invoke("send-transactional-email", {
                  body: {
                    templateName: "vendor-lead-notification",
                    recipientEmail: pd.contact_email,
                    idempotencyKey: `vendor-lead-${row.id}`,
                    templateData: {
                      providerName: v.name,
                      customerName: answers.firstName,
                      customerEmail: answers.email,
                      customerMobile: answers.mobile || "",
                      customerSuburb: answers.suburb,
                      customerState: answers.state,
                      customerPostcode: answers.postcode,
                      propertyType: answers.propertyType,
                      householdSize: answers.householdSize,
                      waterSource: answers.waterSource,
                      budget: answers.budget,
                      concerns: answers.concerns,
                      recommendedSystems: dedupedSystems,
                      message: message || "",
                      createdAt: new Date().toISOString(),
                      installationTimeline: answers.installationTimeline || "",
                      leadTemperature: leadTemperature || "",
                      contactPreference: answers.contactPreference || "no_preference",
                    },
                  },
                })
                .catch((err) => console.error("vendor email failed:", err));
            }
          });
      }

      // One customer confirmation listing all selected vendors
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "customer-quote-confirmation",
            recipientEmail: answers.email,
            idempotencyKey: `customer-confirm-${rows.map((r) => r.id).join("-")}`,
            templateData: {
              customerName: answers.firstName,
              providerName: selectedVendors.map((v) => v.name).join(", "),
              customerEmail: answers.email,
              customerMobile: answers.mobile || "",
              recommendedSystems: dedupedSystems,
            },
          },
        })
        .catch((err) => console.error("customer email failed:", err));

      // Meta Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead", {
          content_name: selectedVendors.map((v) => v.name).join(", "),
          content_category: dedupedSystems.join(", "),
          value: leadPrice * selectedVendors.length,
        });
      }

      setSubmitted(selectedVendors.map((v) => v.name));
      toast.success(
        `Quote request${selectedVendors.length > 1 ? "s" : ""} sent to ${selectedVendors.length} provider${selectedVendors.length > 1 ? "s" : ""}!`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send quote requests");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-dashed">
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Finding providers in your area…
        </CardContent>
      </Card>
    );
  }

  if (submitted.length > 0) {
    return (
      <Card className="border-2 border-primary/40 bg-accent/40">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">
            {submitted.length} quote request{submitted.length > 1 ? "s" : ""} sent
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            We've notified {submitted.join(", ")}. They'll reach out to you directly with
            personalised quotes.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topVendors.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="flex flex-col items-center p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">More providers coming soon</h3>
          <p className="mx-auto mb-2 max-w-md text-sm text-muted-foreground">
            We don't have approved providers in your area for these systems yet — but our
            network is growing weekly. Use the recommendations above as a guide when
            requesting local quotes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const showFewerThanThreeNotice = topVendors.length < 3;

  return (
    <div className="space-y-4">
      {showFewerThanThreeNotice && (
        <div className="rounded-lg border border-warm/30 bg-warm-light/40 px-4 py-3 text-sm text-foreground/90">
          We found {topVendors.length} matching provider{topVendors.length > 1 ? "s" : ""} in
          your area today. We're adding more vendors every week — check back soon for more
          options.
        </div>
      )}

      <div className="space-y-3">
        {topVendors.map((v, i) => {
          const fit = rankedVendors.find((r) => r.vendor.provider_id === v.provider_id)?.fit;
          const isBest = bestBudgetProviderId === v.provider_id;
          const budgetBadge = isBest
            ? "best-budget"
            : fit && fit.withinBudget && fit.pricedSystems > 0
              ? "within-budget"
              : null;
          return (
            <VendorRow
              key={v.provider_id}
              vendor={v}
              selected={selected.has(v.provider_id)}
              onToggle={() => toggleVendor(v.provider_id)}
              rank={i}
              budgetBadge={budgetBadge}
              startingFromLabel={formatStartingFrom(fit?.startingFrom ?? null)}
            />
          );
        })}
      </div>

      <Card className="border-2 border-primary/20 bg-background">
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-semibold">
              Selected: {selected.size} of {topVendors.length} provider
              {topVendors.length > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Each selected provider will receive your quote request and contact you
              directly. You're not committing to anything by requesting a quote.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-message" className="text-sm">
              Add a note for the providers (optional)
            </Label>
            <Textarea
              id="bulk-message"
              placeholder="Any extra details about your water situation, access, or timing…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="vendor-ack-bulk"
              checked={vendorAck}
              onCheckedChange={(c) => setVendorAck(!!c)}
            />
            <label
              htmlFor="vendor-ack-bulk"
              className="text-xs leading-relaxed text-muted-foreground"
            >
              I understand that Compare Water Filters is a comparison platform only.
              Vendors I am connected with are independent businesses. Compare Water Filters
              does not guarantee vendor workmanship, pricing, or availability.
            </label>
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            disabled={sending || !vendorAck || selected.size === 0}
            onClick={handleSendAll}
          >
            {sending ? (
              "Sending…"
            ) : (
              <>
                <Send className="h-4 w-4" />
                Request {selected.size > 0 ? selected.size : ""} quote
                {selected.size === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}