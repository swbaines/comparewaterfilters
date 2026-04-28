export type ContactPreference = "phone" | "sms" | "email" | "no_preference";

export const CONTACT_PREFERENCE_LABEL: Record<ContactPreference, string> = {
  phone: "Phone call — call me anytime",
  sms: "SMS first — text me before calling",
  email: "Email first — email me before calling",
  no_preference: "No preference — any method is fine",
};

export const CONTACT_PREFERENCE_VENDOR_NOTE: Record<ContactPreference, string> = {
  phone: "Prefers phone calls — okay to call anytime",
  sms: "Prefers SMS first — text before calling",
  email: "Prefers email first — email before calling",
  no_preference: "No preference — contact however suits you",
};

export function isContactPreference(v: string | null | undefined): v is ContactPreference {
  return v === "phone" || v === "sms" || v === "email" || v === "no_preference";
}
