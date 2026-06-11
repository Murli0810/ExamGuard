import { FileText } from "lucide-react";

export default function ReportsIndex() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Executive Reports</h1>
        <p className="text-sm text-muted-foreground font-mono">/ session telemetry</p>
      </div>

      <div className="panel p-12 flex flex-col items-center justify-center border-dashed border-border/60">
        <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-lg font-mono text-foreground">Awaiting Target Designation</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
          Execute a live pipeline from the Dashboard to automatically generate a report, or navigate to a specific Session ID to view historical telemetry.
        </p>
      </div>
    </div>
  );
}