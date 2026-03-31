import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

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

export default function SuburbPostcodeAutocomplete({ postcode, suburb, onSelect }: Props) {
  const [query, setQuery] = useState(postcode || suburb ? `${suburb}${suburb && postcode ? ", " : ""}${postcode}` : "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch(`https://v0.postcodeapi.com.au/suburbs.json?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data: Suggestion[] = await res.json();
        setSuggestions(data.slice(0, 10));
        setOpen(true);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(`${s.name}, ${s.postcode}`);
    setOpen(false);
    onSelect(String(s.postcode), s.name, s.state.abbreviation);
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
              {s.name}, {s.postcode} — {s.state.abbreviation}
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
