import { agents, type AgentState } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function nodeStyle(state: AgentState) {
  if (state === "processing") return { ring: "border-warning", dot: "bg-warning glow-amber", text: "text-warning" };
  if (state === "flagged") return { ring: "border-destructive", dot: "bg-destructive glow-red", text: "text-destructive" };
  return { ring: "border-primary", dot: "bg-primary glow-green", text: "text-primary" };
}

export function PipelineBar({ isProcessing = false }: { isProcessing?: boolean }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Agent Pipeline</div>
        <div className="text-[10px] font-mono text-muted-foreground">latency 184ms · throughput 12.4 req/s</div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {agents.map((a, i) => {
          const liveState = (isProcessing && a.name === "Auditor") ? "processing" : a.state;
          const s = nodeStyle(liveState);
          return (
            <div key={a.name} className="flex items-center gap-2 shrink-0">
              <div className={cn("relative flex flex-col items-center gap-1 rounded-md border bg-surface-elevated px-4 py-3 min-w-[140px]", s.ring)}>
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                <span className="text-xs font-medium">{a.name}</span>
                <span className={cn("text-[9px] font-mono uppercase tracking-wider", s.text)}>
                  {liveState === "processing" ? "● processing" : liveState === "flagged" ? "● flagged" : "● active"}
                </span>
              </div>
              {i < agents.length - 1 && (
                <div className="flex items-center">
                  <div className="h-px w-6 bg-gradient-to-r from-primary/60 to-primary/20" />
                  <span className="text-primary text-xs font-mono">→</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}