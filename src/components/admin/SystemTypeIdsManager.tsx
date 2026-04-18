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
 */
export default function SystemTypeIdsManager() {
  const queryClient = useQueryClient();
  const [newId, setNewId] = useState("");

  const { data: ids = [], isLoading } = useQuery({
    queryKey: ["system-type-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_type_ids")
        .select("id")
        .order("id");
      if (error) throw error;
      return data.map((r) => r.id);
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
      queryClient.invalidateQueries({ queryKey: ["system-type-ids"] });
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
      queryClient.invalidateQueries({ queryKey: ["system-type-ids"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdd = () => {
    const trimmed = newId.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) return;
    if (ids.includes(trimmed)) {
      toast.error("That ID already exists");
      return;
    }
    addMutation.mutate(trimmed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">System Type IDs (lookup table)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Source of truth for valid <code>system_types</code> on providers and{" "}
          <code>recommended_systems</code> on quote requests. Database triggers reject any value not listed here.
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
        ) : ids.length === 0 ? (
          <p className="text-sm text-muted-foreground">No IDs yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ids.map((id) => (
              <Badge key={id} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-1.5 text-xs font-mono">
                {id}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:bg-destructive/10 hover:text-destructive"
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (confirm(`Remove "${id}" from the lookup table?\n\nProviders or leads referencing this ID will keep working, but new inserts using it will be rejected.`)) {
                      removeMutation.mutate(id);
                    }
                  }}
                  aria-label={`Remove ${id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
