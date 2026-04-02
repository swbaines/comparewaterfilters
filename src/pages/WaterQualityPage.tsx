import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { Search, Droplets, Thermometer, FlaskConical, AlertTriangle, CheckCircle2, ArrowRight, Info } from "lucide-react";

// ── Real water quality data sourced from state water authorities ──────────────
interface SuburbProfile {
  suburb: string;
  state: string;
  postcode: string;
  hardness: number;
  chlorine: number;
  fluoride: number;
  ph: number;
  pfasRisk: "low" | "moderate" | "elevated";
  source: string;
  notes: string;
}

const WATER_DATA: Record<string, SuburbProfile[]> = {
  NSW: [
    { suburb: "Sydney CBD / Inner Sydney", state: "NSW", postcode: "2000-2099", hardness: 49, chlorine: 0.6, fluoride: 1.0, ph: 7.5, pfasRisk: "low", source: "Prospect WFP (Warragamba Dam)", notes: "Soft water, chloramine used in some areas. Good quality — carbon filter for taste." },
    { suburb: "Parramatta / Blacktown / Liverpool", state: "NSW", postcode: "2100-2199", hardness: 50, chlorine: 0.7, fluoride: 1.0, ph: 7.5, pfasRisk: "low", source: "Prospect WFP", notes: "Consistent soft water. Chloramine disinfection in parts. Carbon filter recommended for taste." },
    { suburb: "Western Sydney / Penrith / St Marys", state: "NSW", postcode: "2740-2770", hardness: 58, chlorine: 0.8, fluoride: 1.0, ph: 7.4, pfasRisk: "low", source: "Orchard Hills zone (Warragamba)", notes: "Hardest water in Sydney network but still classified soft. No softener needed." },
    { suburb: "Northern Beaches / Manly", state: "NSW", postcode: "2085-2108", hardness: 35, chlorine: 0.5, fluoride: 1.0, ph: 7.6, pfasRisk: "low", source: "Warringah WFP", notes: "Very soft water, low chlorine. Excellent water quality." },
    { suburb: "Blue Mountains", state: "NSW", postcode: "2780-2790", hardness: 32, chlorine: 0.6, fluoride: 1.0, ph: 7.5, pfasRisk: "moderate", source: "Cascade WFP", notes: "PFAS elevated in 2024 at Cascade WFP — now within updated 2025 guidelines. RO recommended for PFAS-concerned households." },
    { suburb: "Newcastle / Hunter", state: "NSW", postcode: "2300-2310", hardness: 45, chlorine: 0.6, fluoride: 1.0, ph: 7.4, pfasRisk: "low", source: "Hunter Water", notes: "Soft water, good quality. Carbon filter for taste improvement." },
    { suburb: "Wollongong / Illawarra", state: "NSW", postcode: "2500-2530", hardness: 38, chlorine: 0.5, fluoride: 1.0, ph: 7.5, pfasRisk: "low", source: "Illawarra WFP", notes: "Soft water. Very good quality overall." },
    { suburb: "Central Coast", state: "NSW", postcode: "2250-2263", hardness: 42, chlorine: 0.6, fluoride: 1.0, ph: 7.4, pfasRisk: "low", source: "Mardi WFP", notes: "Soft water. Carbon filter for chlorine taste." },
  ],
  VIC: [
    { suburb: "Melbourne CBD / Inner East", state: "VIC", postcode: "3000-3099", hardness: 28, chlorine: 0.9, fluoride: 0.9, ph: 7.3, pfasRisk: "low", source: "Silvan/Sugarloaf Reservoir", notes: "Australia's softest capital city water. No softener needed. Chlorine slightly higher than average — whole house carbon filter excellent for skin and taste." },
    { suburb: "Melbourne North / Northcote / Preston", state: "VIC", postcode: "3070-3078", hardness: 25, chlorine: 0.9, fluoride: 0.9, ph: 7.3, pfasRisk: "low", source: "Greenvale Reservoir", notes: "Very soft water. Higher chlorine can affect skin and hair — whole house carbon filter recommended." },
    { suburb: "Melbourne South / St Kilda / Bayside", state: "VIC", postcode: "3182-3207", hardness: 30, chlorine: 0.8, fluoride: 0.9, ph: 7.4, pfasRisk: "low", source: "Cardinia Reservoir / SEW", notes: "Soft water. Good quality. Carbon filter for chlorine taste and skin comfort." },
    { suburb: "Melbourne West / Footscray / Werribee", state: "VIC", postcode: "3011-3030", hardness: 32, chlorine: 1.0, fluoride: 0.9, ph: 7.2, pfasRisk: "low", source: "Sugarloaf / Greenvale", notes: "Soft water. Chlorine slightly higher in western distribution. Carbon filter recommended." },
    { suburb: "Melbourne East / Box Hill / Ringwood", state: "VIC", postcode: "3128-3136", hardness: 22, chlorine: 0.7, fluoride: 0.9, ph: 7.5, pfasRisk: "low", source: "Silvan Reservoir", notes: "Exceptionally soft water from mountain catchment. Very good quality." },
    { suburb: "Geelong", state: "VIC", postcode: "3220-3228", hardness: 35, chlorine: 0.8, fluoride: 0.9, ph: 7.4, pfasRisk: "low", source: "Barwon Water", notes: "Soft water. Good quality overall." },
    { suburb: "Mornington Peninsula", state: "VIC", postcode: "3930-3945", hardness: 28, chlorine: 0.7, fluoride: 0.9, ph: 7.5, pfasRisk: "low", source: "Tarago / Cardinia via SEW", notes: "Soft water from Tarago WTP. Excellent quality." },
    { suburb: "Sunbury / Melton", state: "VIC", postcode: "3337-3430", hardness: 40, chlorine: 1.1, fluoride: 0.9, ph: 7.2, pfasRisk: "low", source: "Rosslynne / Merrimu", notes: "Slightly harder outer western suburbs. Higher chlorine in longer distribution network." },
  ],
  QLD: [
    { suburb: "Brisbane CBD / Inner Suburbs", state: "QLD", postcode: "4000-4059", hardness: 115, chlorine: 1.1, fluoride: 0.85, ph: 7.8, pfasRisk: "low", source: "Wivenhoe Dam / North Pine Dam", notes: "Moderately hard water. Seasonal earthy/musty taste after rain — naturally occurring, carbon filter addresses this well." },
    { suburb: "Brisbane North / Northside", state: "QLD", postcode: "4030-4060", hardness: 110, chlorine: 1.0, fluoride: 0.85, ph: 7.8, pfasRisk: "low", source: "North Pine Dam", notes: "Moderate hardness. Scale-reduction filter beneficial for appliances. Carbon filter for chlorine taste." },
    { suburb: "Brisbane South / Southside", state: "QLD", postcode: "4101-4130", hardness: 118, chlorine: 1.1, fluoride: 0.85, ph: 7.7, pfasRisk: "low", source: "Wivenhoe Dam", notes: "Moderate hardness. Whole house carbon + scale-reduction is the recommended setup." },
    { suburb: "Gold Coast", state: "QLD", postcode: "4210-4230", hardness: 34, chlorine: 0.8, fluoride: 0.85, ph: 7.6, pfasRisk: "low", source: "Hinze Dam", notes: "Much softer than Brisbane. No scale issues. Carbon filter for taste." },
    { suburb: "Sunshine Coast", state: "QLD", postcode: "4550-4575", hardness: 90, chlorine: 0.9, fluoride: 0.85, ph: 7.7, pfasRisk: "low", source: "Baroon Pocket Dam", notes: "Moderate hardness. Fluoridated. Carbon filter for taste." },
    { suburb: "Ipswich / Logan", state: "QLD", postcode: "4300-4360", hardness: 120, chlorine: 1.1, fluoride: 0.85, ph: 7.8, pfasRisk: "low", source: "Wivenhoe / Somerset Dam", notes: "Moderately hard. Scale-reduction filter recommended for appliances." },
    { suburb: "Toowoomba / Darling Downs", state: "QLD", postcode: "4350-4352", hardness: 160, chlorine: 0.9, fluoride: 0.85, ph: 7.6, pfasRisk: "low", source: "Local weirs and groundwater", notes: "Harder than Brisbane. Scale buildup a known issue. Whole house filter with scale-reduction recommended." },
    { suburb: "Cairns", state: "QLD", postcode: "4870-4879", hardness: 55, chlorine: 0.7, fluoride: 0.7, ph: 7.5, pfasRisk: "low", source: "Copperlode Dam", notes: "Soft water. Good quality. Carbon filter for taste preference." },
  ],
  WA: [
    { suburb: "Perth CBD / Inner Perth", state: "WA", postcode: "6000-6010", hardness: 135, chlorine: 0.8, fluoride: 0.75, ph: 7.6, pfasRisk: "low", source: "Mixed: desalination + Mundaring Weir", notes: "Moderately hard. Scale buildup on taps and appliances is common. Whole house carbon + scale-reduction recommended." },
    { suburb: "Perth North / Joondalup / Wanneroo", state: "WA", postcode: "6025-6065", hardness: 195, chlorine: 0.9, fluoride: 0.75, ph: 7.5, pfasRisk: "low", source: "Gnangara Mound groundwater", notes: "Very hard water (approaching 200 mg/L). White scale visible on everything. Water softener strongly recommended in this area." },
    { suburb: "Yanchep / Two Rocks", state: "WA", postcode: "6035-6037", hardness: 228, chlorine: 0.9, fluoride: 0.75, ph: 7.4, pfasRisk: "low", source: "Gnangara Mound groundwater", notes: "Among the hardest water in Australia at 228 mg/L. Water softener is essential. RO for drinking water highly recommended." },
    { suburb: "Perth South / Fremantle / Cockburn", state: "WA", postcode: "6155-6172", hardness: 120, chlorine: 0.7, fluoride: 0.75, ph: 7.7, pfasRisk: "low", source: "Desalination blend", notes: "Moderately hard — softer than northern suburbs due to more desalinated water. Scale-reduction filter recommended." },
    { suburb: "Perth East / Midland / Kalamunda", state: "WA", postcode: "6056-6076", hardness: 155, chlorine: 0.8, fluoride: 0.75, ph: 7.5, pfasRisk: "low", source: "Mundaring Weir blend", notes: "Hard water. Scale a common complaint. Whole house filter with scale-reduction or softener recommended." },
    { suburb: "Mandurah / Rockingham", state: "WA", postcode: "6020-6022", hardness: 90, chlorine: 0.7, fluoride: 0.75, ph: 7.7, pfasRisk: "low", source: "Desalination / Serpentine", notes: "Moderately soft for Perth. Less scale than northern suburbs. Carbon filter for chlorine taste." },
    { suburb: "Bunbury / South West WA", state: "WA", postcode: "6230-6235", hardness: 100, chlorine: 0.7, fluoride: 0.75, ph: 7.6, pfasRisk: "low", source: "Wellington Dam / groundwater", notes: "Moderate hardness. Good quality for regional WA. Carbon filter + scale-reduction recommended." },
  ],
  SA: [
    { suburb: "Adelaide CBD / Inner Adelaide", state: "SA", postcode: "5000-5010", hardness: 125, chlorine: 1.3, fluoride: 0.6, ph: 7.6, pfasRisk: "low", source: "Happy Valley Reservoir / Murray River blend", notes: "Hard water with Australia's highest chlorine levels. Strong chlorine taste common. Whole house carbon filter is the most impactful upgrade for SA homes." },
    { suburb: "Adelaide North / Salisbury / Elizabeth", state: "SA", postcode: "5106-5115", hardness: 138, chlorine: 1.5, fluoride: 0.6, ph: 7.5, pfasRisk: "low", source: "Murray River / Happy Valley", notes: "Hardest and highest chlorine area of Adelaide. Scale in kettles, shower screens is severe. Water softener + whole house carbon filter recommended." },
    { suburb: "Adelaide South / Morphett Vale / Noarlunga", state: "SA", postcode: "5162-5168", hardness: 115, chlorine: 1.2, fluoride: 0.6, ph: 7.7, pfasRisk: "low", source: "Myponga Reservoir", notes: "Slightly softer than northern Adelaide. Chloramine treatment at Myponga. Carbon filter recommended." },
    { suburb: "Adelaide Hills / Stirling / Crafers", state: "SA", postcode: "5152-5155", hardness: 95, chlorine: 1.0, fluoride: 0.6, ph: 7.6, pfasRisk: "low", source: "Mount Lofty Ranges reservoirs", notes: "Softest water in the Adelaide metro. Chloramine treatment. Better taste than other SA areas." },
    { suburb: "Adelaide East / Burnside / Norwood", state: "SA", postcode: "5066-5070", hardness: 120, chlorine: 1.3, fluoride: 0.6, ph: 7.6, pfasRisk: "low", source: "Murray River / reservoir blend", notes: "Moderate-hard water. High chlorine. Whole house carbon + scale-reduction is the recommended setup." },
    { suburb: "Adelaide West / Glenelg / Brighton", state: "SA", postcode: "5044-5048", hardness: 115, chlorine: 1.2, fluoride: 0.6, ph: 7.7, pfasRisk: "low", source: "Murray River blend", notes: "Some coastal areas have slightly brackish taste from Murray salinity. Carbon filter + softener for best results." },
  ],
  TAS: [
    { suburb: "Hobart / Greater Hobart", state: "TAS", postcode: "7000-7055", hardness: 18, chlorine: 0.4, fluoride: 1.0, ph: 7.2, pfasRisk: "low", source: "Mount Wellington catchment", notes: "Among the purest water in Australia. Very soft, low chlorine, mountain catchment source. Filtration is mostly a personal preference here." },
    { suburb: "Launceston", state: "TAS", postcode: "7248-7252", hardness: 22, chlorine: 0.4, fluoride: 1.0, ph: 7.3, pfasRisk: "low", source: "Trevallyn / local catchments", notes: "Excellent soft water. Low treatment levels. One of the best tap waters in Australia." },
  ],
  ACT: [
    { suburb: "Canberra / ACT", state: "ACT", postcode: "2600-2617", hardness: 45, chlorine: 0.6, fluoride: 1.0, ph: 7.4, pfasRisk: "moderate", source: "Googong / Cotter Reservoirs", notes: "Soft water, good quality. PFAS monitoring ongoing near defence and industrial sites. RO recommended for PFAS-concerned households." },
  ],
  NT: [
    { suburb: "Darwin", state: "NT", postcode: "0800-0832", hardness: 75, chlorine: 0.7, fluoride: 0.0, ph: 7.3, pfasRisk: "low", source: "Darwin River Dam / Howard Springs", notes: "NT does NOT fluoridate its water. Moderate hardness. Good quality. Carbon filter for taste preference." },
    { suburb: "Alice Springs", state: "NT", postcode: "0870-0872", hardness: 180, chlorine: 0.8, fluoride: 0.0, ph: 7.8, pfasRisk: "low", source: "Amadeus Basin groundwater", notes: "Very hard groundwater. NT does not fluoridate. Scale a significant issue. Softener or whole house filter recommended." },
  ],
};

function getHardnessLabel(h: number) {
  if (h < 60) return { label: "Soft", color: "text-green-800", bg: "bg-green-100" };
  if (h < 120) return { label: "Moderate", color: "text-yellow-800", bg: "bg-yellow-100" };
  if (h < 180) return { label: "Hard", color: "text-orange-800", bg: "bg-orange-100" };
  return { label: "Very hard", color: "text-red-800", bg: "bg-red-100" };
}

function getChlorineLabel(c: number) {
  if (c < 0.6) return { label: "Low", color: "text-green-800", bg: "bg-green-100" };
  if (c < 1.0) return { label: "Moderate", color: "text-yellow-800", bg: "bg-yellow-100" };
  return { label: "High", color: "text-orange-800", bg: "bg-orange-100" };
}

function getFluorideLabel(f: number) {
  if (f === 0) return { label: "Not added", color: "text-blue-800", bg: "bg-blue-100" };
  if (f < 0.7) return { label: "Low", color: "text-green-800", bg: "bg-green-100" };
  return { label: "Standard", color: "text-yellow-800", bg: "bg-yellow-100" };
}

function getPfasLabel(risk: string) {
  if (risk === "elevated") return { label: "Elevated — monitor", color: "text-red-800", bg: "bg-red-100" };
  if (risk === "moderate") return { label: "Being monitored", color: "text-yellow-800", bg: "bg-yellow-100" };
  return { label: "Within guidelines", color: "text-green-800", bg: "bg-green-100" };
}

function getFilterRecommendations(profile: SuburbProfile) {
  const recs: { primary: string; reason: string; cta: string }[] = [];

  if (profile.hardness >= 180) {
    recs.push({ primary: "Water softener", reason: "Your area has very hard water — a softener eliminates the scale damaging your appliances, shower screens, and hot water system.", cta: "Get quotes" });
  }
  if (profile.hardness >= 120) {
    recs.push({ primary: "Whole house carbon + scale-reduction filter", reason: "Moderately hard water combined with higher chlorine means a whole house system with scale-reduction is the most impactful upgrade.", cta: "Get quotes" });
  }
  if (profile.chlorine >= 1.0 || profile.hardness < 120) {
    recs.push({ primary: "Whole house carbon filter", reason: `${profile.state === "SA" ? "Adelaide has Australia's highest chlorine levels" : profile.state === "VIC" ? "Melbourne's chlorine is notably higher than most cities" : "Chlorine removal"} — a whole house carbon filter improves taste, skin, and hair from every tap and shower.`, cta: "Get quotes" });
  }
  if (profile.pfasRisk === "elevated" || profile.pfasRisk === "moderate") {
    recs.push({ primary: "Reverse osmosis", reason: "PFAS monitoring is active in your area. RO is the most effective household technology for removing PFAS and other contaminants from drinking water.", cta: "Get quotes" });
  }
  recs.push({ primary: "Reverse osmosis", reason: "For the purest possible drinking water — removes fluoride, PFAS, heavy metals, and virtually all dissolved contaminants.", cta: "Get quotes" });

  return recs.slice(0, 3);
}

function findProfile(query: string): SuburbProfile | null {
  const q = query.trim().toLowerCase();
  const postcode = parseInt(q);

  for (const profiles of Object.values(WATER_DATA)) {
    for (const p of profiles) {
      if (!isNaN(postcode)) {
        const ranges = p.postcode.split(",").map(r => r.trim());
        for (const range of ranges) {
          if (range.includes("-")) {
            const [min, max] = range.split("-").map(Number);
            if (postcode >= min && postcode <= max) return p;
          } else if (parseInt(range) === postcode) return p;
        }
      }
      if (p.suburb.toLowerCase().includes(q) || q === p.state.toLowerCase()) return p;
    }
  }
  return null;
}

export default function WaterQualityPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SuburbProfile | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = findProfile(query);
    setResult(found);
    setSearched(true);
  };

  const hardness = result ? getHardnessLabel(result.hardness) : null;
  const chlorine = result ? getChlorineLabel(result.chlorine) : null;
  const fluoride = result ? getFluorideLabel(result.fluoride) : null;
  const pfas = result ? getPfasLabel(result.pfasRisk) : null;
  const recs = result ? getFilterRecommendations(result) : [];

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Water Quality by Suburb — Check Your Local Water"
        description="Free water quality lookup for Australian suburbs. Check hardness, chlorine, fluoride, and PFAS levels in your area and get filter recommendations."
        path="/water-quality"
      />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
        <div className="container max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Free water quality lookup</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">What's in my water?</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Australian tap water is safe to drink — but safe doesn't mean perfect. Most of us can smell and taste the chlorine, and families want to know exactly what's coming out of the tap. Enter your suburb or postcode for a plain-English breakdown.
          </p>
          <form onSubmit={handleSearch} className="mt-8 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suburb or postcode — e.g. Wanneroo or 3000"
                className="pl-9"
              />
            </div>
            <Button type="submit">Check water</Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Data sourced from Melbourne Water, Sydney Water, Water Corporation WA, Seqwater QLD and SA Water annual reports 2023–24
          </p>
        </div>
      </section>

      <div className="container max-w-4xl pb-16">
        {/* Results */}
        {searched && result && (
          <div className="mt-8 space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold">{result.suburb}</h2>
              <p className="text-muted-foreground">{result.state} · Postcodes {result.postcode} · Source: {result.source}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Your water meets Australian safety standards — but every home can benefit from filtration. Whether it's removing the chlorine taste, protecting appliances from scale, or simply giving your family cleaner water for drinking and bathing, the right filter makes a real difference.
              </p>
            </div>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Droplets className="h-4 w-4" />
                    Hardness
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.hardness}</p>
                  <p className="text-sm text-muted-foreground">mg/L CaCO₃</p>
                  <Badge className={`mt-2 ${hardness?.bg} ${hardness?.color} border-0`}>{hardness?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Thermometer className="h-4 w-4" />
                    Chlorine
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.chlorine}</p>
                  <p className="text-sm text-muted-foreground">mg/L typical</p>
                  <Badge className={`mt-2 ${chlorine?.bg} ${chlorine?.color} border-0`}>{chlorine?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FlaskConical className="h-4 w-4" />
                    Fluoride
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.fluoride}</p>
                  <p className="text-sm text-muted-foreground">mg/L</p>
                  <Badge className={`mt-2 ${fluoride?.bg} ${fluoride?.color} border-0`}>{fluoride?.label}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    PFAS
                  </div>
                  <p className="mt-2 text-3xl font-bold">{result.ph}</p>
                  <p className="text-sm text-muted-foreground">pH level</p>
                  <Badge className={`mt-2 ${pfas?.bg} ${pfas?.color} border-0`}>{pfas?.label}</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Local notes */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex gap-3 pt-6">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm">{result.notes}</p>
              </CardContent>
            </Card>

            {/* What this means */}
            <Card>
              <CardHeader>
                <CardTitle>What this means for your home</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-3">
                  {result.hardness >= 120 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Hard water &amp; scale</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.hardness >= 180
                        ? `At ${result.hardness} mg/L, your water is quite hard — you've probably noticed white scale building up in the kettle, on taps, and on shower screens. Over time, this can reduce the lifespan of your hot water system and dishwasher. A water softener or scale-reduction filter pays for itself in appliance savings.`
                        : result.hardness >= 120
                        ? `At ${result.hardness} mg/L, you may notice some scale on taps and in the kettle. A scale-reduction filter helps protect your appliances and keeps things looking cleaner for longer.`
                        : `At ${result.hardness} mg/L, your water is soft — great news for your appliances. No softener needed here.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {result.chlorine >= 1.0 ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Chlorine &amp; taste</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.chlorine >= 1.0
                        ? `At ${result.chlorine} mg/L, chlorine is above the taste threshold — most people in your area will notice the smell when filling a glass or running a shower. Many families find that removing chlorine is the single biggest improvement to their water. It also helps with dry skin, eczema-prone kids, and hair that feels stripped after washing.`
                        : `At ${result.chlorine} mg/L, chlorine is within normal range — but most people can still smell and taste it, especially first thing in the morning or after the water has been sitting in pipes. A simple carbon filter removes it completely and is the most popular upgrade Australian families make.`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {result.fluoride > 0 ? (
                    <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  )}
                  <div>
                    <h4 className="font-semibold">Fluoride</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {result.fluoride === 0
                        ? `${result.state} does not add fluoride to its water supply. If fluoride-free water is important to you, your tap water already is — though a reverse osmosis system still provides the highest purity drinking water overall.`
                        : `Fluoride is added at ${result.fluoride} mg/L for dental health, well within the 1.5 mg/L Australian guideline. Some families prefer to remove it and choose their own fluoride sources — if that's you, a reverse osmosis system is the only household filter that effectively removes it.`}
                    </p>
                  </div>
                </div>

                {result.pfasRisk !== "low" && (
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                    <div>
                      <h4 className="font-semibold">PFAS</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        PFAS monitoring is active in your area. Current levels meet Australian Drinking Water Guidelines, so there's no immediate concern — but many families prefer the peace of mind that comes with a reverse osmosis system, which is the most effective household technology for PFAS removal.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filter recommendations */}
            <div>
              <h3 className="mb-4 text-xl font-semibold">Recommended for your area</h3>
              <div className="space-y-3">
                {recs.map((rec, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {i === 0 && <Badge className="shrink-0">Best match</Badge>}
                        <div>
                          <h4 className="font-semibold">{rec.primary}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                      </div>
                      <Link to="/quiz" className="shrink-0">
                        <Button variant="outline" size="sm">
                          Get quotes <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
                <div>
                  <h3 className="font-semibold">Ready to improve your water?</h3>
                  <p className="text-sm text-muted-foreground">Take our 2-minute quiz and we'll match you with trusted local installers who understand your area's water.</p>
                </div>
                <Link to="/quiz" className="shrink-0">
                  <Button>
                    Start quiz <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No result */}
        {searched && !result && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-8">
              <h2 className="text-xl font-semibold">We don't have specific data for that location yet</h2>
              <p className="mt-2 text-muted-foreground">Try searching by state name (e.g. "VIC" or "NSW") or a nearby major suburb. We're adding more postcodes regularly.</p>
              <Link to="/quiz" className="mt-4 inline-block">
                <Button variant="outline">
                  Take the quiz for personalised advice <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Browse by state */}
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-semibold">Browse by state</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { state: "VIC", label: "Victoria", sub: "Soft water, higher chlorine", query: "Melbourne CBD" },
              { state: "NSW", label: "New South Wales", sub: "Soft water, chloramine", query: "Sydney CBD" },
              { state: "QLD", label: "Queensland", sub: "Moderate hardness, seasonal taste", query: "Brisbane CBD" },
              { state: "WA", label: "Western Australia", sub: "Hard water, varies by suburb", query: "Perth CBD" },
              { state: "SA", label: "South Australia", sub: "Hardest capital, high chlorine", query: "Adelaide CBD" },
              { state: "TAS", label: "Tasmania", sub: "Excellent soft water", query: "Hobart" },
              { state: "ACT", label: "ACT", sub: "Soft, PFAS monitored", query: "Canberra" },
              { state: "NT", label: "Northern Territory", sub: "No fluoride added", query: "Darwin" },
            ].map(s => (
              <Card
                key={s.state}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => { setQuery(s.query); setResult(findProfile(s.query)); setSearched(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{s.state}</h3>
                  <p className="text-sm text-muted-foreground">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-lg border bg-muted/50 p-6">
          <div className="text-sm text-muted-foreground">
            <h3 className="mb-2 font-semibold text-foreground">Data sources &amp; disclaimer</h3>
            <p>Water quality data is sourced from Melbourne Water, Sydney Water, Water Corporation WA, Seqwater QLD, and SA Water annual drinking water quality reports (2023–24). Data represents typical averages and may vary by exact address, season, and current treatment conditions. For the most precise data for your address, contact your local water utility. This information is provided for general guidance only and does not constitute professional advice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
