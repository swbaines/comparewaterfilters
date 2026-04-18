import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  name: string;
  postcode: number;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  value: { suburb: string; postcode: string; state: string } | null;
  onSelect: (s: { suburb: string; postcode: string; state: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

/**
 * Suburb autocomplete that returns lat/lng — used for vendor service base location.
 * Distinct from SuburbPostcodeAutocomplete (which is geared to the customer quiz flow).
 */
export default function ServiceBaseAutocomplete({ value, onSelect, placeholder }: Props) {
  const initial = value
    ? `${value.suburb}${value.suburb && value.postcode ? ", " : ""}${value.postcode}`
    : "";
  const [query, setQuery] = useState(initial);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync display when parent updates externally
  useEffect(() => {
    if (value) {
      setQuery(`${value.suburb}, ${value.postcode}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.suburb, value?.postcode]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (!baseUrl || !apiKey) return;
      const res = await fetch(
        `${baseUrl}/functions/v1/suburb-search?q=${encodeURIComponent(q)}`,
        { headers: { apikey: apiKey } }
      );
      if (res.ok) {
        const results: Suggestion[] = await res.json();
        // Only show suggestions with usable coordinates
        setSuggestions(results.filter((s) => s.latitude != null && s.longitude != null).slice(0, 10));
        setOpen(true);
      }
    } catch (err) {
      console.error("Suburb search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(`${s.name}, ${s.postcode}`);
    setOpen(false);
    onSelect({
      suburb: s.name,
      postcode: String(s.postcode),
      state: s.state,
      lat: s.latitude!,
      lng: s.longitude!,
    });
  };

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
      <Input
        placeholder={placeholder || "Start typing your base suburb or postcode..."}
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
        <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">Loading...</div>
      )}
    </div>
  );
}
