import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={cn("avatar", `avatar--${size}`, className)} aria-hidden="true">
      {initials}
    </span>
  );
}
