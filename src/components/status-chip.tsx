import { cn } from "@/lib/utils";

type Variant = "clean" | "quarantined" | "flagged" | "committed" | "safe" | "hallucination" | "invalidated" | "warn" | "neutral";

const styles: Record<Variant, string> = {
  clean: "bg-primary/10 text-primary border-primary/40",
  safe: "bg-primary/10 text-primary border-primary/40",
  committed: "bg-primary/10 text-primary border-primary/40",
  quarantined: "bg-destructive/10 text-destructive border-destructive/40",
  invalidated: "bg-destructive/10 text-destructive border-destructive/40",
  flagged: "bg-warning/10 text-warning border-warning/40",
  hallucination: "bg-warning/10 text-warning border-warning/40",
  warn: "bg-warning/10 text-warning border-warning/40",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "").includes("halluc")
    ? "hallucination"
    : (status.toLowerCase().split(" ")[0] as Variant);
  const variant = (styles[key as Variant] ? key : "neutral") as Variant;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider",
      styles[variant],
      className,
    )}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {status}
    </span>
  );
}