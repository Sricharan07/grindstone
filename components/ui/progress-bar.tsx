import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  tone = "primary",
  className,
}: {
  value: number;
  label: string;
  tone?: "primary" | "success" | "warning" | "accent";
  className?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("progress-track", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <span
        className={cn("progress-fill", `progress-fill--${tone}`)}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
