import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  state?: "idle" | "loading" | "error" | "success";
  icon?: ReactNode;
};

export function Button({
  children,
  variant = "primary",
  state = "idle",
  icon,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const loading = state === "loading";

  return (
    <button
      aria-busy={loading || undefined}
      className="button"
      data-state={state}
      data-variant={variant === "primary" ? undefined : variant}
      disabled={loading || disabled}
      type={type}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
