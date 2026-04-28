/**
 * Single source of truth for water-hardness classification and messaging.
 *
 * Used by the suburb water-quality lookup (badge, suburb callout, and the
 * "What this means for your home" section) so all three surfaces stay in sync.
 *
 * Bands (mg/L CaCO₃):
 *   < 60   → Soft
 *   60–119 → Moderate
 *   120–179→ Hard
 *   ≥ 180  → Very hard
 */
export type HardnessLabel = "Soft" | "Moderate" | "Hard" | "Very hard";
export type HardnessTone = "ok" | "warn" | "risk";

export interface HardnessGuidance {
  label: HardnessLabel;
  tone: HardnessTone;
  /** Tailwind text color class for the badge. */
  color: string;
  /** Tailwind background class for the badge. */
  bg: string;
  /** Whether the "What this means" row should show an alert (vs check) icon. */
  isConcern: boolean;
  /** Long-form explanation rendered in "What this means for your home". */
  message: (hardness: number) => string;
  /** Short-form callout shown above the utility info on the suburb result. */
  suburbCallout: ((hardness: number, area: string) => string) | null;
  /** Variant for the suburb-level WarningCallout, if shown. */
  calloutVariant: "info" | "risk" | null;
}

export function getHardnessGuidance(h: number): HardnessGuidance {
  if (h < 60) {
    return {
      label: "Soft",
      tone: "ok",
      color: "text-green-800",
      bg: "bg-green-100",
      isConcern: false,
      message: (n) =>
        `At ${n} mg/L, your water is soft — great news for your appliances. No softener needed here.`,
      suburbCallout: null,
      calloutVariant: null,
    };
  }
  if (h < 120) {
    return {
      label: "Moderate",
      tone: "warn",
      color: "text-yellow-800",
      bg: "bg-yellow-100",
      isConcern: true,
      message: (n) =>
        `At ${n} mg/L, your water sits in the moderately hard range. You may start to see light scale spotting on taps, glassware, and shower screens, and over time scale can build up inside kettles, dishwashers, and your hot water system — reducing efficiency and shortening their lifespan. Soap and detergent also lather less, so you tend to use more. A scale-reduction or whole-house filter is a sensible preventative upgrade.`,
      suburbCallout: (n, area) =>
        `${area} sits in the moderately hard range (${n} mg/L CaCO₃). Expect light scale spotting on taps, glassware, and shower screens, and gradual build-up inside kettles, dishwashers, and your hot water system that can reduce efficiency over time. Soap and detergent also lather less. A scale-reduction or whole-house filter is a sensible preventative upgrade.`,
      calloutVariant: "info",
    };
  }
  if (h < 180) {
    return {
      label: "Hard",
      tone: "risk",
      color: "text-orange-800",
      bg: "bg-orange-100",
      isConcern: true,
      message: (n) =>
        `At ${n} mg/L, you may notice some scale on taps and in the kettle. A scale-reduction filter helps protect your appliances and keeps things looking cleaner for longer.`,
      suburbCallout: (n, area) =>
        `${area} has hard water (${n} mg/L CaCO₃). You'll likely see scale on taps and in the kettle, and over time it can shorten the life of your hot water system and dishwasher. A scale-reduction or whole-house filter helps protect appliances and keeps fixtures cleaner for longer.`,
      calloutVariant: "risk",
    };
  }
  return {
    label: "Very hard",
    tone: "risk",
    color: "text-red-800",
    bg: "bg-red-100",
    isConcern: true,
    message: (n) =>
      `At ${n} mg/L, your water is quite hard — you've probably noticed white scale building up in the kettle, on taps, and on shower screens. Over time, this can reduce the lifespan of your hot water system and dishwasher. A water softener or scale-reduction filter pays for itself in appliance savings.`,
    suburbCallout: (n, area) =>
      `${area} has very hard water (${n} mg/L CaCO₃). Expect noticeable scale buildup on taps, kettles, shower screens, and inside your hot water system. A water softener or scale-reduction whole-house filter is the most effective fix.`,
    calloutVariant: "risk",
  };
}