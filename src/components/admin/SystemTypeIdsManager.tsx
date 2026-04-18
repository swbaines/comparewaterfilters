import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

/**
 * Admin-only manager for the public.system_type_ids lookup table.
 * IDs here are the source of truth used by validation triggers on
 * providers.system_types and quote_requests.recommended_systems.
 *
 * Removal is blocked client-side if any providers or quote_requests
 * currently reference the ID, listing the dependents.
 */
type IdUsage = {
  id: string;
  providerNames: string[];
  quoteCount: number;
};

export default function SystemTypeIdsManager() {
  const queryClient = useQueryClient();
  const [newId, setNewId] = useState("");

  const { data: usage = [], isLoading } = useQuery<IdUsage[]>({
    queryKey: ["system-type-ids-with-usage"],
    queryFn: async () => {
      const [idsRes, providersRes, quotesRes] = await Promise.all([
        supabase.from("system_type_ids").select("id").order("id"),
        supabase.from("providers").select("name, system_types"),
        supabase.from("quote_requests").select("recommended_systems"),
      ]);
      if (idsRes.error) throw idsRes.error;
      if (providersRes.error) throw providersRes.error;
      if (quotesRes.error) throw quotesRes.error;

      return idsRes.data.map((row) => {
        const providerNames = (providersRes.data || [])
          .filter((p) => (p.system_types || []).includes(row.id))
          .map((p) => p.name);
        const quoteCount = (quotesRes.data || []).filter((q) =>
          (q.recommended_systems || []).includes(row.id),
        ).length;
        return { id: row.id, providerNames, quoteCount };
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_type_ids").insert({ id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("System type ID added");
      setNewId("");
      queryClient.invalidateQueries({ queryKey: ["system-type-ids-with-usage"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_type_ids").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("System type ID removed");
      queryClient.invalidateQueries({ queryKey: ["system-type-ids-with-usage"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdd = () => {
    const trimmed = newId.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) return;
    if (usage.some((u) => u.id === trimmed)) {
      toast.error("That ID already exists");
      return;
    }
    addMutation.mutate(trimmed);
  };

  const handleRemove = (entry: IdUsage) => {
    const totalRefs = entry.providerNames.length + entry.quoteCount;
    if (totalRefs > 0) {
      const parts: string[] = [];
      if (entry.providerNames.length > 0) {
        const sample = entry.providerNames.slice(0, 3).join(", ");
        const extra = entry.providerNames.length > 3 ? ` +${entry.providerNames.length - 3} more` : "";
        parts.push(`${entry.providerNames.length} provider(s): ${sample}${extra}`);
      }
      if (entry.quoteCount > 0) parts.push(`${entry.quoteCount} quote request(s)`);
      toast.error(`Cannot remove "${entry.id}" — still referenced by ${parts.join(" and ")}.`, {
        duration: 8000,
      });
      return;
    }
    if (confirm(`Remove "${entry.id}" from the lookup table?\n\nNothing currently references it. New inserts using this ID will be rejected by the database trigger.`)) {
      removeMutation.mutate(entry.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Type IDs (lookup table)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Source of truth for valid <code>system_types</code> on providers and{" "}
          <code>recommended_systems</code> on quote requests. Database triggers reject any value not listed here. Removal is blocked while an ID is in use.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g. uv-disinfection"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            disabled={addMutation.isPending}
          />
          <Button onClick={handleAdd} disabled={addMutation.isPending || !newId.trim()}>
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : usage.length === 0 ? (
          <p className="text-sm text-muted-foreground">No IDs yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usage.map((entry) => {
              const totalRefs = entry.providerNames.length + entry.quoteCount;
              const inUse = totalRefs > 0;
              return (
                <Badge
                  key={entry.id}
                  variant="secondary"
                  className="gap-1.5 py-1.5 pl-3 pr-1.5 text-xs font-mono"
                  title={
                    inUse
                      ? `Used by ${entry.providerNames.length} provider(s) and ${entry.quoteCount} quote(s)`
                      : "Not referenced — safe to remove"
                  }
                >
                  {entry.id}
                  {inUse && (
                    <span className="rounded bg-muted px-1 text-[10px] font-sans text-muted-foreground">
                      {totalRefs}
                    </span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    disabled={removeMutation.isPending || inUse}
                    onClick={() => handleRemove(entry)}
                    aria-label={`Remove ${entry.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
