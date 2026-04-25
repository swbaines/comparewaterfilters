import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type InstallationModel = "in_house_licensed" | "sub_contracted";

export interface InstallationModelValue {
  installation_model: InstallationModel | null;
  plumber_licence_number: string;
  plumbing_licence_state: string;
  has_public_liability: boolean;
  insurer_name: string;
  public_liability_insurance_amount: string; // string in form, parsed on save
  sub_contractor_confirmed: boolean;
}

export const AU_STATE_OPTIONS = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
] as const;

export const SUB_CONTRACTOR_DECLARATION =
  "I confirm that all water filtration installations performed via Compare Water Filters will be carried out by appropriately licensed plumbers in compliance with the relevant state plumbing regulations (Plumbing and Drainage Act, AS/NZS 3500, and applicable state codes). I take full legal responsibility for ensuring my installation partners hold current plumbing licences and public liability insurance at all times. I acknowledge that engaging unlicensed installers will result in immediate termination from the platform and potential legal action.";

interface Props {
  value: InstallationModelValue;
  onChange: (next: InstallationModelValue) => void;
}

export default function InstallationModelFields({ value, onChange }: Props) {
  const update = <K extends keyof InstallationModelValue>(
    key: K,
    v: InstallationModelValue[K],
  ) => onChange({ ...value, [key]: v });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Installation model <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Tell us how plumbing installations are carried out for your customers.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              {
                v: "in_house_licensed" as const,
                title: "In-house licensed team",
                desc: "Our team holds plumbing licences and installs directly.",
              },
              {
                v: "sub_contracted" as const,
                title: "Sub-contracted installers",
                desc: "We engage licensed plumbers as sub-contractors.",
              },
            ]
          ).map((opt) => {
            const checked = value.installation_model === opt.v;
            return (
              <label
                key={opt.v}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                  checked
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="installation_model"
                  className="mt-0.5 h-4 w-4 accent-primary"
                  checked={checked}
                  onChange={() => update("installation_model", opt.v)}
                />
                <span>
                  <span className="block font-medium">{opt.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {opt.desc}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {value.installation_model === "in_house_licensed" && (
        <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Plumbing licence number <span className="text-destructive">*</span>
              </Label>
              <Input
                value={value.plumber_licence_number}
                onChange={(e) =>
                  update("plumber_licence_number", e.target.value)
                }
                placeholder="e.g. 12345C"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Licence issuing state <span className="text-destructive">*</span>
              </Label>
              <Select
                value={value.plumbing_licence_state}
                onValueChange={(v) => update("plumbing_licence_state", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {AU_STATE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {value.installation_model === "sub_contracted" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-md border-2 border-primary/40 bg-primary/5 p-4 text-sm">
          <Checkbox
            checked={value.sub_contractor_confirmed}
            onCheckedChange={(v) =>
              update("sub_contractor_confirmed", v === true)
            }
            className="mt-0.5"
            required
          />
          <span className="leading-relaxed">
            <span className="block mb-1 font-medium">
              Sub-contractor compliance declaration{" "}
              <span className="text-destructive">*</span>
            </span>
            <span className="block text-xs text-muted-foreground">
              {SUB_CONTRACTOR_DECLARATION}
            </span>
          </span>
        </label>
      )}

      {/* Public liability — required for both models */}
      <div className="space-y-3 rounded-md border border-border p-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">
              Public liability insurance{" "}
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              Required for all providers on the platform.
            </p>
          </div>
          <Switch
            checked={value.has_public_liability}
            onCheckedChange={(v) => update("has_public_liability", v)}
          />
        </div>
        {value.has_public_liability && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Insurer name</Label>
              <Input
                value={value.insurer_name}
                onChange={(e) => update("insurer_name", e.target.value)}
                placeholder="e.g. QBE, Allianz"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cover amount (AUD)</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={value.public_liability_insurance_amount}
                onChange={(e) =>
                  update(
                    "public_liability_insurance_amount",
                    e.target.value,
                  )
                }
                placeholder="e.g. 20000000"
              />
              <p className="text-xs text-muted-foreground">
                Optional but recommended (e.g. 20,000,000 = $20M).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Validate that the installation-model fieldset is complete.
 * Returns null if valid, otherwise a human-readable error message.
 */
export function validateInstallationModel(
  v: InstallationModelValue,
): string | null {
  if (!v.installation_model) return "Please choose an installation model";
  if (v.installation_model === "in_house_licensed") {
    if (!v.plumber_licence_number.trim())
      return "Plumbing licence number is required";
    if (!v.plumbing_licence_state)
      return "Plumbing licence state is required";
  }
  if (v.installation_model === "sub_contracted") {
    if (!v.sub_contractor_confirmed)
      return "Please confirm the sub-contractor compliance declaration";
  }
  return null;
}

export function emptyInstallationModelValue(): InstallationModelValue {
  return {
    installation_model: null,
    plumber_licence_number: "",
    plumbing_licence_state: "",
    has_public_liability: false,
    insurer_name: "",
    public_liability_insurance_amount: "",
    sub_contractor_confirmed: false,
  };
}