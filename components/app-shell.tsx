"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, BrainCircuit, Gauge, Menu, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navItems = [
  { href: "/", label: "Live", icon: Gauge },
  { href: "/analyze", label: "Analyze", icon: BrainCircuit },
  { href: "/twins", label: "Twins", icon: BarChart3 },
  { href: "/research", label: "Research", icon: Activity },
  { href: "/api-health", label: "Health", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="app-shell">
      <nav className="nav-pill" aria-label="Primary">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>
          <span className="wordmark-mark">MT</span>
          <span>MarketTwin AI</span>
        </Link>

        <div className="nav-links">
          {navItems.slice(0, 4).map((item) => (
            <Link
              className="nav-link"
              data-active={isActive(pathname, item.href)}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <Link href="/analyze" className="button" onClick={() => setOpen(false)}>
            Run twin
          </Link>
          <button
            aria-controls="mobile-navigation"
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            className="icon-button nav-menu-button"
            onClick={() => setOpen((value) => !value)}
            ref={menuButtonRef}
            type="button"
          >
            {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="mobile-menu" id="mobile-navigation" ref={menuRef}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="mobile-menu-link"
                data-active={isActive(pathname, item.href)}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
              >
                <span>{item.label}</span>
                <Icon aria-hidden="true" size={16} />
              </Link>
            );
          })}
        </div>
      ) : null}

      <main>{children}</main>

      <footer className="foot-line">
        <span>MarketTwin AI turns live CMC market states into historical analog research.</span>
        <div className="footer-links" aria-label="Footer">
          <Link className="footer-link" href="/research">
            Method
          </Link>
          <Link className="footer-link" href="/api-health">
            Health
          </Link>
          <Link className="footer-link" href="/risk">
            Risk
          </Link>
          <Link className="footer-link" href="/privacy">
            Privacy
          </Link>
          <Link className="footer-link" href="/terms">
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
