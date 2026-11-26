# Technical SEO report

**URL:** https://freellmagents.com/
**Checked:** 2026-11-26

## Measured checks

| Area | Result | Evidence |
|---|---|---|
| HTTPS | Pass on HTTPS URL | HTTPS homepage and sampled routes returned 200. |
| HTTP redirect | Fail | `http://freellmagents.com/` returned 200 without a redirect. |
| Canonical host | Needs operational review | `https://www.freellmagents.com/` returned 520; apex HTTPS is the configured canonical host. |
| robots.txt | Pass with policy caveat | 200; `User-agent: *`, `Allow: /`, `Disallow: /api/`; sitemap referenced. |
| Sitemap | Partial | 200 and valid sitemap XML; nine static URLs. Important routes are omitted. See `sitemap.md`. |
| Canonicals | Pass on sampled pages | Sampled routes had self-referencing HTTPS canonical URLs. |
| Rendered content | Pass on sampled pages | Homepage and key tool pages returned meaningful content in initial HTML; browser accessibility snapshots also exposed it. |
| Status handling | Pass | Unknown route returned 404; representative model URL returned 200. |
| Security headers | Needs review | Sampled homepage response did not include HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy. |
| Core Web Vitals | Not measured | PageSpeed Insights returned 429; no field-data credentials or Lighthouse result were available. |
| IndexNow | Not checked | No deterministic SEO CLI available; no endpoint/key verification performed. |

## Findings

### High — HTTP serves the site instead of redirecting

The non-TLS URL returned HTTP 200. The canonical in HTML points at HTTPS, but crawlers and visitors can still reach a second protocol URL. Enforce HTTPS and choose the intended `www` behavior in Cloudflare. Verify with a one-hop redirect and canonicalized final URL.

### Medium — missing response hardening headers

The homepage response did not include the listed security headers. These protect transport and browser behavior; they are not confirmed ranking factors. Configure them at the correct Cloudflare/Worker layer after compatibility review. Do not treat the static-assets-only `public/_headers` rule as proof that HTML responses receive them.

### Positive — server-rendered content and correct error response

The homepage and key tools expose primary content in HTML. An invalid path returns a proper HTTP 404, and a dedicated model not-found view exists.

## Unmeasured

No numeric technical score is reported. The SEO CLI/doctor scripts were unavailable, PageSpeed Insights was rate-limited, and this was not a full 500-page crawl. Mobile/desktop Core Web Vitals, TLS certificate details, full redirect chains, and field indexing were not established.
