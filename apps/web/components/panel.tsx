import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-ink-raised/60 backdrop-blur-sm",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-brass">
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "proven" | "failed";
}) {
  const toneClass =
    tone === "proven" ? "text-proven" : tone === "failed" ? "text-failed" : "text-bone";
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate">{label}</span>
      <span className={cn("font-mono text-lg tabular-nums", toneClass)}>{value}</span>
    </div>
  );
}
