"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";
import { fetchSessionReport } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function Report() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [auditOpen, setAuditOpen] = useState(true);
  const [reportData, setReportData] = useState<any | null>(null);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!sessionId) return;
      try {
        const data = await fetchSessionReport(sessionId);
        setReportData(data.report);
        setHistoryLog(data.history || []);
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, [sessionId]);

  const parsePayload = (payloadStr: string) => {
    try { return JSON.parse(payloadStr); } catch { return {}; }
  };

  if (isLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!reportData) {
    return <div className="p-12 text-center text-destructive font-mono">Failed to load report for {sessionId}. Verify the Session ID exists.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground">{sessionId}</div>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Executive Session Report</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">{reportData.executive_summary}</p>
        </div>
        <button 
        onClick={()=> window.print()}
        className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/10 hover:bg-primary/20 px-3 py-2 text-xs font-mono uppercase tracking-wider text-primary">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>

      <div className="panel p-6 flex items-center justify-between border-primary/40 border">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Final Recommended Score</div>
          <div className="mt-1 text-4xl font-mono font-semibold text-primary">{reportData.final_recommended_score}</div>
        </div>
        <div className="text-right text-xs font-mono text-muted-foreground space-y-1">
          <div>Total Security Threats: <span className="text-destructive font-semibold">{reportData.threats_detected}</span></div>
          <div>signed by examguard-soc</div>
        </div>
      </div>

      <div className="panel">
        <button
          onClick={() => setAuditOpen(!auditOpen)}
          className="w-full flex items-center justify-between px-4 py-3 border-b border-border cursor-pointer"
        >
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Detailed Agent Audit Trail</span>
          {auditOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {auditOpen && (
          <ol className="relative px-6 py-4 space-y-3">
            {historyLog.map((log) => {
              const payload = parsePayload(log.payload);
              const isQuarantine = log.action_type === "QUARANTINE";
              const isInvalid = log.is_valid === 0;
              
              return (
                <li key={log.commit_hash} className="relative pl-5">
                  <span className={cn("absolute left-0 top-2 h-2 w-2 rounded-full", isInvalid ? "bg-muted" : isQuarantine ? "bg-destructive glow-red" : "bg-primary glow-green")} />
                  <div className={cn("flex flex-wrap items-baseline gap-3", isInvalid && "opacity-50 line-through")}>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-xs font-mono text-primary">{log.commit_hash.slice(0,7)}</span>
                    <span className="text-sm font-semibold">{log.action_type}</span>
                    <span className="text-sm">
                      Question {payload.q_id} — {isQuarantine ? `Flagged: ${payload.flag_reason}` : `Graded: Score ${payload.score}`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}