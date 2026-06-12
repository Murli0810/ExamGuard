"use client";

import { useState } from "react";
import { Activity, FileCheck2, ShieldAlert, GitCommit, Play } from "lucide-react";
import { PipelineBar } from "@/components/pipeline-bar";
import { StatusChip } from "@/components/status-chip";
import { triggerExamPipeline } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const initialStats = [
  { label: "Active Sessions", value: "12", delta: "stable", icon: Activity, accent: "primary" as const },
  { label: "Papers Graded", value: "8,427", delta: "awaiting input", icon: FileCheck2, accent: "primary" as const },
  { label: "Threats Caught", value: "37", delta: "monitoring", icon: ShieldAlert, accent: "destructive" as const },
  { label: "Commits in Memory", value: "24,981", delta: "ledger sync OK", icon: GitCommit, accent: "warning" as const },
];

// Payload explicitly designed to trigger the RC_PASSAGE prompt injection
const MOCK_LIVE_PAYLOAD = {
  roll_number: "USER_999",
  answers: {
    "Q1": "A", "Q2": "C", "Q3": "D", "Q4": "A", "Q5": "A",
    "Q6": "3", "Q7": "2", "Q8": "1", "Q9_A": "B", "Q9_B": "A"
  }
};

function StatCard({ s }: { s: typeof initialStats[0] }) {
  const accent = s.accent === "destructive" ? "border-destructive/50" : s.accent === "warning" ? "border-warning/50" : "border-primary/50";
  const iconC = s.accent === "destructive" ? "text-destructive" : s.accent === "warning" ? "text-warning" : "text-primary";
  
  return (
    <div className={cn("panel p-4 border", accent)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{s.label}</div>
          <div className="mt-2 text-3xl font-semibold font-mono tabular-nums">{s.value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{s.delta}</div>
        </div>
        <div className={cn("rounded-md border border-border bg-surface-elevated p-2", iconC)}>
          <s.icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<string | null>(null);
  const router = useRouter();

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    setLiveFeed(prev => [{ id: Date.now(), ts: new Date().toLocaleTimeString(), agent: "Supervisor", msg: "Dispatched payload to API...", status: "ACTIVE" }, ...prev]);
    
    try {
      // 1. Await the response from the local FastAPI server
      const response = await triggerExamPipeline(MOCK_LIVE_PAYLOAD);
      
      setSessionData(response.session_id);
      setLiveFeed(prev => [
        { id: Date.now() + 1, ts: new Date().toLocaleTimeString(), agent: "Reporter", msg: `Generated Report for ${response.session_id}`, status: "CLEAN" },
        ...prev
      ]);
      router.push(`/reports/${response.session_id}`);

    } catch (error) {
      setLiveFeed(prev => [
        { id: Date.now() + 2, ts: new Date().toLocaleTimeString(), agent: "System", msg: `API Connectivity Error: ${String(error)}`, status: "FLAGGED" },
        ...prev
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground font-mono">/ realtime · API target: 127.0.0.1:8000</p>
        </div>
        
        {/* Dynamic Execution Trigger */}
        <button 
          onClick={handleRunPipeline}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-popover text-primary font-mono text-sm font-semibold rounded-md shadow hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          <Play className="h-4 w-4" />
          {isProcessing ? "PROCESSING PIPELINE..." : "EXECUTE LIVE PIPELINE"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {initialStats.map((s) => <StatCard key={s.label} s={s} />)}
      </div>

      <PipelineBar isProcessing={isProcessing} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Throughput</div>
          </div>
          <div className="h-40 flex items-end gap-1">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="flex-1 flex items-end">
                <div
                  className={cn("w-full rounded-sm", isProcessing && i % 3 === 0 ? "bg-warning/70 animate-pulse" : "bg-primary/60")}
                  style={{ height: `${Math.min(20 + (i % 7) * 10, 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Live Activity Feed</div>
            <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isProcessing ? "bg-warning glow-amber" : "bg-primary glow-green")} />
          </div>
          <ul className="divide-y divide-border max-h-[420px] overflow-auto">
            {liveFeed.length === 0 ? (
              <li className="px-4 py-8 text-center text-xs font-mono text-muted-foreground">
                Awaiting API Execution...
              </li>
            ) : (
              liveFeed.map((a) => (
                <li key={a.id} className="px-4 py-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground">{a.ts}</span>
                    <StatusChip status={a.status} />
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-primary font-mono text-xs">{a.agent}</span>
                    <span className="text-foreground/90"> · {a.msg}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}