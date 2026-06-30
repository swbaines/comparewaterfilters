import { supabase } from "@/integrations/supabase/client";
import { systemTypes } from "@/data/systemTypes";
import {
  COMBO_COMPONENT_IDS,
  normalizeSystemTypeId,
} from "@/lib/canonicalSystemTypes";

/**
 * Dev-mode sanity check: warns if the IDs in src/data/systemTypes.ts have
 * drifted from the public.system_type_ids lookup table (the DB source of truth
 * used by validation triggers).
 *
 * Runs once per session, only in DEV builds. Fails silently on network errors.
 */
let hasRun = false;

export async function checkSystemTypesSync(): Promise<void> {
  if (hasRun || !import.meta.env.DEV) return;
  hasRun = true;

  try {
    const { data, error } = await supabase.from("system_type_ids").select("id");
    if (error || !data) return;

    // Normalise aliases (e.g. whole-home-filtration → whole-house-filtration)
    // and strip combo IDs (e.g. "hybrid") — combos are inferred from their
    // components, never stored as a provider system_type, so they must not
    // appear in the DB lookup.
    const isCombo = (id: string) => id in COMBO_COMPONENT_IDS;
    const normalize = (ids: string[]) =>
      new Set(ids.map(normalizeSystemTypeId).filter((id) => !isCombo(id)));

    const dbIds = normalize(data.map((r) => r.id));
    const fileIds = normalize(systemTypes.map((s) => s.id));

    const missingInDb = [...fileIds].filter((id) => !dbIds.has(id));
    const missingInFile = [...dbIds].filter((id) => !fileIds.has(id));

    if (missingInDb.length > 0 || missingInFile.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "[systemTypes sync] Drift detected between src/data/systemTypes.ts and public.system_type_ids:",
        {
          inFileButNotInDb: missingInDb,
          inDbButNotInFile: missingInFile,
        },
      );
    }
  } catch {
    // ignore — this is a dev-only diagnostic
  }
}
