"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Models", href: "/", active: true },
  { label: "Providers", href: "/providers", active: false },
  { label: "Pricing", href: "/pricing", active: false },
  { label: "Cost Calculator", href: "/cost-calculator", active: false },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-border bg-background">
      <div className="mx-auto flex h-[76px] max-w-[1720px] items-center px-5 sm:px-7 lg:px-12">
        <Link
          href="/"
          className="shrink-0 font-heading text-[27px] font-bold tracking-[-0.055em] text-primary sm:text-[32px]"
        >
          FreeLLMAgents
        </Link>

        <nav
          aria-label="Main navigation"
          className="ml-[clamp(2rem,5.2vw,5.5rem)] hidden h-full items-center gap-9 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              className={`relative flex h-full items-center text-[16px] transition-colors hover:text-primary ${
                link.active
                  ? "font-semibold text-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[3px] after:rounded-t-full after:bg-primary"
                  : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            className="h-[50px] rounded-[15px] border-border bg-surface px-5 text-[16px] font-medium hover:border-primary hover:bg-muted"
            nativeButton={false}
            render={<Link href="/sign-in" />}
          >
            Sign in
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="absolute top-full right-5 left-5 z-50 flex flex-col gap-1 rounded-lg border border-border bg-popover px-3 py-3 text-popover-foreground shadow-md ring-1 ring-foreground/10 sm:left-auto sm:w-72 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              aria-current={link.active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`rounded-md px-3 py-2.5 text-sm ${
                link.active ? "font-semibold text-primary" : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
