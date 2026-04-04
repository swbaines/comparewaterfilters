import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";


interface Suggestion {
  name: string;
  postcode: number;
  state: string;
}

interface Props {
  postcode: string;
  suburb: string;
  onSelect: (postcode: string, suburb: string, state: string) => void;
}

// Rough lat/lng → Australian state mapping
function latLngToState(lat: number, lng: number): string {
  if (lat < -39.5) return "TAS";
  if (lng < 129) return "WA";
  if (lat > -26 && lng < 138) return "NT";
  if (lng < 141 && lat <= -26) return "SA";
  if (lat > -29 && lng >= 138) return "QLD";
  if (lat <= -36 && lng >= 141) return "VIC";
  // ACT check (rough)
  if (lat > -36 && lat < -35 && lng > 148.5 && lng < 149.5) return "ACT";
  return "NSW";
}

// Fallback: infer state from timezone offset when geolocation is unavailable
function timezoneToState(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes("Perth")) return "WA";
    if (tz.includes("Adelaide")) return "SA";
    if (tz.includes("Darwin")) return "NT";
    if (tz.includes("Brisbane") || tz.includes("Lindeman")) return "QLD";
    if (tz.includes("Hobart") || tz.includes("Currie")) return "TAS";
    if (tz.includes("Melbourne") || tz.includes("Victoria")) return "VIC";
    if (tz.includes("Sydney") || tz.includes("Canberra")) return "NSW";
    // Generic Australia/* fallback using UTC offset
    const offset = new Date().getTimezoneOffset();
    if (offset === -600) return "VIC"; // AEST – could be NSW/QLD/VIC/TAS, default VIC/NSW
    if (offset === -660) return "VIC"; // AEDT
    if (offset === -570) return "SA";  // ACST
    if (offset === -630) return "SA";  // ACDT
    if (offset === -480) return "WA";  // AWST
  } catch {
    // ignore
  }
  return "";
}

function useDetectedState() {
  const [detectedState, setDetectedState] = useState<string>(() => {
    return sessionStorage.getItem("detected_au_state") || "";
  });
  const [autoDetectFailed, setAutoDetectFailed] = useState(false);

  useEffect(() => {
    if (detectedState) return;

    const applyFallback = () => {
      const fallback = timezoneToState();
      if (fallback) {
        setDetectedState(fallback);
        sessionStorage.setItem("detected_au_state", fallback);
      } else {
        setAutoDetectFailed(true);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const state = latLngToState(pos.coords.latitude, pos.coords.longitude);
          setDetectedState(state);
          sessionStorage.setItem("detected_au_state", state);
        },
        () => applyFallback(),
        { timeout: 5000, maximumAge: 600000 }
      );
    } else {
      applyFallback();
    }
  }, [detectedState]);

  const setManualState = (state: string) => {
    setDetectedState(state);
    setAutoDetectFailed(false);
    sessionStorage.setItem("detected_au_state", state);
  };

  return { detectedState, autoDetectFailed, setManualState };
}

export default function SuburbPostcodeAutocomplete({ postcode, suburb, onSelect }: Props) {
  const [query, setQuery] = useState(postcode || suburb ? `${suburb}${suburb && postcode ? ", " : ""}${postcode}` : "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { detectedState, autoDetectFailed, setManualState } = useDetectedState();

  // Sync display when parent resets
  useEffect(() => {
    if (!postcode && !suburb) setQuery("");
  }, [postcode, suburb]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!baseUrl || !apiKey) {
        console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
        return;
      }
      const stateParam = detectedState ? `&state=${encodeURIComponent(detectedState)}` : "";
      const url = `${baseUrl}/functions/v1/suburb-search?q=${encodeURIComponent(q)}${stateParam}`;
      const res = await fetch(url, {
        headers: { apikey: apiKey },
      });
      if (res.ok) {
        const results: Suggestion[] = await res.json();
        setSuggestions(results.slice(0, 10));
        setOpen(true);
      } else {
        console.error("Suburb search failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Suburb search error:", err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [detectedState]);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(`${s.name}, ${s.postcode}`);
    setOpen(false);
    onSelect(String(s.postcode), s.name, s.state);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium">Suburb or postcode</label>
      <Input
        placeholder="Start typing suburb or postcode..."
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {suggestions.map((s, i) => (
            <li
              key={`${s.postcode}-${s.name}-${i}`}
              onClick={() => handleSelect(s)}
              className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {s.name}, {s.postcode} — {s.state}
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <div className="absolute right-3 top-[38px] text-xs text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}
