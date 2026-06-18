import type { ReactNode } from "react";

export function Badge({
  children,
  tone,
  icon
}: {
  children: ReactNode;
  tone?: "ink" | "success" | "warning" | "error";
  icon?: ReactNode;
}) {
  return (
    <span className="badge" data-tone={tone}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}
