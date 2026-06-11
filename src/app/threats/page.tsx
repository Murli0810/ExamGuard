"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { StatusChip } from "@/components/status-chip";
import { fetchGlobalThreats } from "@/lib/api-client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Threats() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"ALL" | "QUARANTINED" | "INVALIDATED">("ALL");
  const [selected, setSelected] = useState<any | null>(null);
  const [threats, setThreats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThreats = async () => {
      try {
        const data = await fetchGlobalThreats();
        setThreats(data.threats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadThreats();
  }, []);

  const parsePayload = (payloadStr: string) => {
    try { return JSON.parse(payloadStr); } catch { return {}; }
  };

  const rows = useMemo(() => {
    return threats.filter((t) => {
      const status = t.is_valid === 1 ? "QUARANTINED" : "INVALIDATED";
      const payload = parsePayload(t.payload);
      const matchesFilter = filter === "ALL" || status === filter;
      const searchString = `${t.session_id} ${payload.q_id} ${payload.flag_reason}`.toLowerCase();
      const matchesSearch = q === "" || searchString.includes(q.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [q, filter, threats]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Threat Detection</h1>
          <p className="text-sm text-muted-foreground font-mono">/ global ledger · {threats.length} threats logged</p>
        </div>
      </div>

      <div className="panel p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search session, question, reason..." className="pl-9 font-mono text-sm" />
        </div>
        <div className="flex gap-1">
          {(["ALL", "QUARANTINED", "INVALIDATED"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              "px-3 py-2 text-xs font-mono uppercase tracking-wider rounded border",
              filter === f ? "bg-primary/15 text-primary border-primary/50" : "bg-surface-elevated text-muted-foreground border-border hover:text-foreground"
            )}>{f}</button>
          ))}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated border-b border-border">
            <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Session ID</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground font-mono text-xs">No threats found.</td></tr>
            ) : (
              rows.map(t => {
                const payload = parsePayload(t.payload);
                const status = t.is_valid === 1 ? "QUARANTINED" : "INVALIDATED";
                return (
                  <tr key={t.commit_hash} onClick={() => setSelected({ ...t, payload, status })} className="cursor-pointer hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{t.session_id}</td>
                    <td className="px-4 py-3 font-mono">{payload.q_id}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[260px] truncate">{payload.flag_reason}</td>
                    <td className="px-4 py-3"><StatusChip status={status} /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl bg-surface border-l border-border overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-primary">{selected.session_id}</SheetTitle>
                <SheetDescription>Question: {selected.payload.q_id}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 px-1">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Commit Hash</div>
                  <span className="font-mono text-xs">{selected.commit_hash}</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Flagged Reason</div>
                  <pre className="rounded border border-border bg-background p-3 text-xs font-mono text-destructive whitespace-pre-wrap">{selected.payload.flag_reason}</pre>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <StatusChip status={selected.status} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}