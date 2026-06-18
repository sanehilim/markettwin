import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  tone?: "ink" | "muted" | "success" | "warning" | "error";
};

export function Surface({ children, tone, className, ...props }: SurfaceProps) {
  return (
    <section className={className ? `surface ${className}` : "surface"} data-tone={tone} {...props}>
      {children}
    </section>
  );
}
