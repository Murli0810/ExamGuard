import { FileWarning } from "lucide-react";

export default function ReviewQueue() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
        <p className="text-sm text-muted-foreground font-mono">/ manual intervention required</p>
      </div>

      <div className="panel p-12 flex flex-col items-center justify-center border-dashed border-border/60">
        <FileWarning className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-lg font-mono text-foreground">No Items in Queue</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
          All flagged anomalies have been processed. New quarantined executions will appear here for manual auditor review.
        </p>
      </div>
    </div>
  );
}