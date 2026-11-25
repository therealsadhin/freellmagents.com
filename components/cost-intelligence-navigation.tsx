import Link from "next/link";
import { Calculator, Scale } from "lucide-react";

const workspaces = [
  {
    id: "calculator",
    label: "Cost Calculator",
    href: "/cost-calculator",
    icon: Calculator,
  },
  {
    id: "comparison",
    label: "Model Comparison",
    href: "/model-comparison",
    icon: Scale,
  },
] as const;

export function CostIntelligenceNavigation({
  current,
}: {
  current: (typeof workspaces)[number]["id"];
}) {
  return (
    <nav
      aria-label="Cost intelligence workspaces"
      className="mt-7 flex min-w-0 gap-2 overflow-x-auto border-b border-border"
    >
      {workspaces.map(({ id, label, href, icon: Icon }) => {
        const active = current === id;

        return (
          <Link
            key={id}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-4 text-sm font-medium transition-colors sm:px-5 ${
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:bg-muted"
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
