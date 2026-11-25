"use client";

import { useState } from "react";

function LogoImage({
  sources,
  providerName,
}: {
  sources: string[];
  providerName: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const initials =
    providerName
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  const source = sources[sourceIndex];

  if (!source) {
    return (
      <span
        role="img"
        aria-label={`${providerName} logo`}
        className="font-heading text-[28px] font-semibold text-muted-foreground"
      >
        {initials}
      </span>
    );
  }

  return (
    // Dynamic provider domains can't be constrained to next/image remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt={`${providerName} logo`}
      width={44}
      height={44}
      referrerPolicy="no-referrer"
      className="h-11 w-11 object-contain"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}

export function ProviderLogo({
  providerName,
  logo,
  logoFallbacks = [],
}: {
  providerName: string;
  logo?: string | null;
  logoFallbacks?: string[];
}) {
  const sources = [...new Set([logo, ...logoFallbacks].filter(
    (source): source is string => Boolean(source),
  ))];

  return (
    <div className="flex size-[64px] shrink-0 items-center justify-center">
      <LogoImage
        key={`${providerName}:${sources.join("|")}`}
        sources={sources}
        providerName={providerName}
      />
    </div>
  );
}
