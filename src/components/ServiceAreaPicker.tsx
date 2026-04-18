import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ServiceBaseAutocomplete from "@/components/ServiceBaseAutocomplete";
import {
  AU_STATES,
  CAPITAL_METROS,
  type CoverageMode,
  computeCoverageStates,
} from "@/lib/serviceArea";

export interface ServiceAreaValue {
  mode: CoverageMode;
  // radius mode
  baseSuburb: string;
  basePostcode: string;
  baseState: string;
  baseLat: number | null;
  baseLng: number | null;
  radiusKm: number;
  statewide: boolean;
  // regions mode
  regions: string[]; // mix of state codes (e.g. "NSW") and metro tokens (e.g. "METRO_SYD")
}

interface Props {
  value: ServiceAreaValue;
  onChange: (next: ServiceAreaValue) => void;
  idPrefix?: string;
}

export default function ServiceAreaPicker({ value, onChange, idPrefix = "sa" }: Props) {
  const set = (patch: Partial<ServiceAreaValue>) => onChange({ ...value, ...patch });

  const toggleRegion = (token: string) => {
    const next = value.regions.includes(token)
      ? value.regions.filter((r) => r !== token)
      : [...value.regions, token];
    set({ regions: next });
  };

  const effectiveStates = computeCoverageStates({
    mode: value.mode,
    baseLat: value.baseLat,
    baseLng: value.baseLng,
    baseState: value.baseState || null,
    radiusKm: value.statewide ? 5000 : value.radiusKm,
    regionSelections: value.regions,
  });

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="space-y-2">
        <Label>How do you define your service area?</Label>
        <RadioGroup
          value={value.mode}
          onValueChange={(v) => set({ mode: v as CoverageMode })}
          className="grid gap-2 sm:grid-cols-2"
        >
          <label
            htmlFor={`${idPrefix}-mode-radius`}
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
              value.mode === "radius" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <RadioGroupItem value="radius" id={`${idPrefix}-mode-radius`} className="mt-0.5" />
            <div>
              <div className="font-medium">Base location + radius</div>
              <div className="text-xs text-muted-foreground">
                Best for local installers covering a circle around their base.
              </div>
            </div>
          </label>
          <label
            htmlFor={`${idPrefix}-mode-regions`}
            className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
              value.mode === "regions" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <RadioGroupItem value="regions" id={`${idPrefix}-mode-regions`} className="mt-0.5" />
            <div>
              <div className="font-medium">States &amp; metro regions</div>
              <div className="text-xs text-muted-foreground">
                Best if you cover whole states or specific capitals (e.g. Adelaide, Melbourne).
              </div>
            </div>
          </label>
        </RadioGroup>
      </div>

      {value.mode === "radius" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Base Service Location</Label>
            <ServiceBaseAutocomplete
              value={
                value.baseSuburb
                  ? { suburb: value.baseSuburb, postcode: value.basePostcode, state: value.baseState }
                  : null
              }
              onSelect={(s) =>
                set({
                  baseSuburb: s.suburb,
                  basePostcode: s.postcode,
                  baseState: s.state,
                  baseLat: s.lat,
                  baseLng: s.lng,
                })
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
                {value.statewide ? "Statewide+" : `${value.radiusKm} km`}
              </span>
            </div>
            <Slider
              min={5}
              max={500}
              step={5}
              value={[value.radiusKm]}
              onValueChange={(v) => set({ radiusKm: v[0], statewide: false })}
              disabled={value.statewide}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-statewide`}
                checked={value.statewide}
                onCheckedChange={(v) => set({ statewide: !!v })}
              />
              <Label htmlFor={`${idPrefix}-statewide`} className="text-sm font-normal cursor-pointer">
                I service this whole state (or further)
              </Label>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">States &amp; Territories</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {AU_STATES.map((s) => (
                <label
                  key={s.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={value.regions.includes(s.value)}
                    onCheckedChange={() => toggleRegion(s.value)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Capital Metro Regions</Label>
            <p className="text-xs text-muted-foreground">
              Pick a metro if you only cover the capital, not the whole state.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CAPITAL_METROS.map((m) => (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-muted/40"
                >
                  <Checkbox
                    checked={value.regions.includes(m.value)}
                    onCheckedChange={() => toggleRegion(m.value)}
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Effective coverage preview */}
      <div className="space-y-1.5 rounded-md border border-dashed border-border bg-muted/30 p-3">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          States Covered (effective)
        </Label>
        {effectiveStates.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {effectiveStates.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {value.mode === "radius"
              ? "Pick a base location to see which states you'll cover."
              : "Tick a state or metro to see your coverage."}
          </p>
        )}
      </div>
    </div>
  );
}
