"use client";

import { useState, useEffect } from "react";
import { GitCommit, RotateCcw, Search, Loader2 } from "lucide-react";
import { StatusChip } from "@/components/status-chip";
import { fetchSessionHistory, triggerStateRollback } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Memory() {
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [activeSession, setActiveSession] = useState("");
  const [liveCommits, setLiveCommits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [rollbackTarget, setRollbackTarget] = useState<any | null>(null);
  const [diff, setDiff] = useState<any | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    const sid = searchParams.get("session");
    if (sid) {
      setSessionIdInput(sid);
      loadHistory(sid);
    }
  }, []);

  // Fetches the chronological commit log from FastAPI
  const loadHistory = async (sid: string) => {
    if (!sid) return;
    setIsLoading(true);
    try {
      const data = await fetchSessionHistory(sid);
      setLiveCommits(data.history || []);
      setActiveSession(sid);
    } catch (err) {
      console.error(err);
      toast.error("Session not found. Verify the Session ID.");
    } finally {
      setIsLoading(false);
    }
  };

  // Triggers the human-in-the-loop invalidation process
  const executeRollback = async () => {
    if (!rollbackTarget || !activeSession) return;
    setIsRollingBack(true);
    try {
      await triggerStateRollback(activeSession, rollbackTarget.commit_hash);
      await loadHistory(activeSession); // Instantly refresh the ledger
    } catch (err) {
      console.error(err);
      toast.error("Rollback failed. Check the backend logs.");
    } finally {
      setIsRollingBack(false);
      toast.success(`Rolled back to ${rollbackTarget.commit_hash.slice(0, 7)}`);
      setRollbackTarget(null);
    }
  };

  // Safely decodes the SQLite JSON string payload
  const parsePayload = (payloadStr: string) => {
    try { return JSON.parse(payloadStr); } catch { return {}; }
  };

  // Determines the UI status badge based on validity and action type
  const getStatus = (commit: any) => {
    if (commit.is_valid === 0) return "INVALIDATED";
    if (commit.action_type === "QUARANTINE") return "QUARANTINED";
    return "CLEAN";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Memory Audit Log</h1>
          <p className="text-sm text-muted-foreground font-mono">
            / ledger main · {liveCommits.length} commits {activeSession ? `· Session: ${activeSession}` : ""}
          </p>
        </div>
        
        {/* Dynamic Fetch Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="Enter Session ID..." 
              className="pl-9 font-mono text-sm w-64 bg-surface"
            />
          </div>
          <button 
            onClick={() => loadHistory(sessionIdInput)}
            disabled={isLoading || !sessionIdInput}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 text-primary border border-primary/50 font-mono text-sm font-semibold rounded-md shadow hover:bg-primary/30 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "FETCH LEDGER"}
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-elevated border-b border-border">
            <tr className="text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3">Commit Hash</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Question ID</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Justification / Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {liveCommits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs font-mono text-muted-foreground">
                  No commits loaded. Enter a valid Session ID to fetch the cryptographic ledger.
                </td>
              </tr>
            ) : (
              liveCommits.map((c) => {
                const payload = parsePayload(c.payload);
                const status = getStatus(c);
                const isRollbackable = c.is_valid === 1;

                return (
                  <tr key={c.commit_hash} className="hover:bg-accent/40 cursor-pointer transition-colors" onClick={() => setDiff({ commit: c, payload, status })}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GitCommit className="h-3.5 w-3.5 text-primary" />
                        <span className={status === "INVALIDATED" ? "font-mono text-xs text-muted-foreground line-through" : "font-mono text-xs text-primary"}>
                          {c.commit_hash.slice(0, 7)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.action_type}</td>
                    <td className="px-4 py-3 font-mono text-xs">{payload.q_id || "N/A"}</td>
                    <td className="px-4 py-3 font-mono">{payload.score ?? "-"}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                      {c.action_type === "GRADE" ? payload.justification : payload.flag_reason}
                    </td>
                    <td className="px-4 py-3"><StatusChip status={status} /></td>
                    <td className="px-4 py-3 text-right">
                      {isRollbackable && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRollbackTarget(c); }}
                          className="inline-flex items-center gap-1.5 rounded border border-destructive/50 text-destructive bg-destructive/5 hover:bg-destructive/15 px-2 py-1 text-[10px] font-mono uppercase tracking-wider"
                        >
                          <RotateCcw className="h-3 w-3" /> Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Human-in-the-loop Rollback Confirmation Dialog */}
      <Dialog open={!!rollbackTarget} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <DialogContent className="bg-surface border-destructive/40">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Rollback Execution</DialogTitle>
            <DialogDescription>
              You are about to revert the ledger to commit{" "}
              <code className="font-mono text-primary">{rollbackTarget?.commit_hash.slice(0, 7)}</code>. This permanently invalidates
              all downstream commits from this session.
            </DialogDescription>
          </DialogHeader>
          <pre className="rounded border border-border bg-background p-3 text-xs font-mono text-muted-foreground">
{`$ examguard execute-rollback ${rollbackTarget?.commit_hash.slice(0, 7)}
> target session: ${activeSession}
> clearance: human-auditor`}
          </pre>
          <DialogFooter>
            <button onClick={() => setRollbackTarget(null)} className="px-3 py-2 text-xs font-mono uppercase tracking-wider rounded border border-border text-muted-foreground hover:text-foreground">Cancel</button>
            <button 
              onClick={executeRollback} 
              disabled={isRollingBack}
              className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded border border-destructive/60 text-destructive bg-destructive/10 hover:bg-destructive/20 disabled:opacity-50"
            >
              {isRollingBack && <Loader2 className="h-3 w-3 animate-spin" />}
              {isRollingBack ? "Processing..." : "Confirm Rollback"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commit Detail Inspector Sheet */}
      <Sheet open={!!diff} onOpenChange={(o) => !o && setDiff(null)}>
        <SheetContent className="w-full sm:max-w-xl bg-surface border-l border-border overflow-y-auto">
          {diff && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-primary">Commit Inspector: {diff.commit.commit_hash.slice(0, 7)}</SheetTitle>
              </SheetHeader>
              <pre className="mt-6 rounded border border-border bg-background p-3 text-xs font-mono leading-relaxed whitespace-pre-wrap">
<span className="text-muted-foreground">{`commit_hash: ${diff.commit.commit_hash}
parent_hash: ${diff.commit.parent_hash}
timestamp:   ${new Date(diff.commit.timestamp).toLocaleString()}
action_type: ${diff.commit.action_type}
is_valid:    ${diff.commit.is_valid}

`}</span>
<span className={diff.status === "INVALIDATED" ? "text-destructive" : "text-primary"}>{`--- Decoded Payload Data ---
${JSON.stringify(diff.payload, null, 2)}
`}</span>
              </pre>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}