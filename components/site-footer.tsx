import Link from "next/link";
import { CurrentYear } from "@/components/current-year";

const linkGroups = [
  {
    title: "Explore",
    links: [
      { label: "Models", href: "/#models" },
      { label: "Providers", href: "/providers" },
      { label: "Pricing", href: "/pricing" },
      { label: "Cost Calculator", href: "/cost-calculator" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/about#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1720px] grid-cols-2 gap-x-8 gap-y-10 px-5 py-12 sm:px-7 md:grid-cols-6 lg:px-12 lg:py-14">
        <div className="col-span-2 max-w-[360px] md:col-span-2">
          <Link
            href="/"
            className="font-heading text-[27px] font-bold tracking-[-0.055em] text-primary"
          >
            FreeLLMAgents
          </Link>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Discover, explore, and compare AI models with clear information on
            capabilities, availability, and pricing.
          </p>
        </div>

        {linkGroups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-semibold text-foreground">
              {group.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="text-sm font-semibold text-foreground">Contact</h2>
          <a
            href="mailto:support@freellmagents.com"
            className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            support@freellmagents.com
          </a>
        </div>

        <div className="col-span-full flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            © <CurrentYear /> FreeLLMAgents. All rights reserved.
          </span>
          <span>Model information is provided for comparison purposes.</span>
        </div>
      </div>
    </footer>
  );
}
