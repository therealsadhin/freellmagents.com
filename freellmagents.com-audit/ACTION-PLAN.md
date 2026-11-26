# Prioritized SEO action plan

Audit basis: live production evidence collected 2026-11-26. No code has been changed. PageSpeed Insights was rate-limited (429); the claude-seo CLI was unavailable.

## High

1. **Enforce HTTPS and canonical host at Cloudflare.**
   - Evidence: `http://freellmagents.com/` returns 200; `https://www.freellmagents.com/` returns 520.
   - Change: configure Cloudflare's HTTPS redirect and decide whether `www` should redirect to the canonical apex host or be intentionally unsupported. This is a Cloudflare zone/hostname task, not a confirmed Next.js code change.
   - Verify: HTTP redirects once to the HTTPS canonical host; the intended www behavior returns a valid redirect or documented result.
2. **Bring route metadata to the requested targets.**
   - Files: `app/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/providers/page.tsx`, `app/pricing/page.tsx`, `app/cost-calculator/page.tsx`, `app/model-comparison/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/cookies/page.tsx`, `app/sign-in/page.tsx`, and `app/models/[modelId]/page.tsx`.
   - Evidence: sampled static titles are 17-35 characters and descriptions are 66-91 characters.
   - Change: unique, accurate page titles and descriptions in the requested ranges, preserving existing positioning and claims. Do not invent model facts.
   - Verify: render each affected route and check unique title/description, canonical URL, index directives, and share metadata.
3. **Complete sitemap coverage for indexable content.**
   - File: `app/sitemap.ts`.
   - Evidence: nine hard-coded URLs; `/model-comparison` and model detail URLs are absent.
   - Change: add the comparison tool and an appropriate, bounded strategy for indexable model details; exclude account/utility/legal routes if not intended for organic discovery. Do not emit non-canonical or non-200 URLs.
   - Verify: every sitemap URL returns 200 and has a matching canonical; sitemap remains within protocol size limits.

## Medium

4. **Add social preview metadata and an OG image.**
   - Files: `app/layout.tsx`, page metadata files, and a new `app/opengraph-image.tsx` (or approved static asset).
   - Evidence: no `og:image` or `twitter:image` on sampled pages.
   - Change: add a branded default image and use a large-image Twitter card, with route-specific metadata inheriting the default where appropriate.
   - Verify: inspect rendered tags and fetch the image URL directly; confirm it renders in an Open Graph preview tester.
5. **Add truthful structured data.**
   - Files: `app/layout.tsx`, and page-specific routes such as `app/cost-calculator/page.tsx`, `app/model-comparison/page.tsx`, and `app/models/[modelId]/page.tsx`.
   - Evidence: no JSON-LD/Microdata/RDFa on sampled routes.
   - Change: add Organization and WebSite entities; use WebPage/WebApplication or a model-specific type only where it accurately reflects displayed facts. Do not add Product/Offer or FAQPage solely for a rich-result claim.
   - Verify: validate server-rendered JSON-LD syntax, absolute URLs, and values against visible page content.
6. **Review security headers at the Worker/Cloudflare response layer.**
   - Evidence: the sampled homepage did not return HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy.
   - Change: configure only compatible, tested headers for HTML and static assets; confirm whether the Worker or Cloudflare zone is the correct source of truth.
   - Verify: inspect response headers after deployment and ensure CSP does not break Next.js or embedded functionality.

## Low / optional

7. **Add `public/llms.txt` as a concise optional site map for readers/agents.**
   - Evidence: `/llms.txt` returned 404.
   - Verify: the file returns 200 with accurate links. This is not a Google ranking/citation lever.
8. **Reduce offscreen logo work.**
   - File: `components/provider-logo.tsx`.
   - Evidence: 24-27 small logo images per sampled tool page, none marked lazy; existing alt text and dimensions are good.
   - Change: lazy-load below-fold logos and use a Cloudflare-compatible image strategy only after checking the OpenNext image guidance. Preserve explicit dimensions and alt text. Do not assume the built-in Next.js optimizer runs on Cloudflare Workers.
   - Verify: inspect rendered image attributes and confirm above-the-fold/LCP content is not lazy-loaded.
9. **Review training-crawler policy before adding explicit robots groups or Content-Signal.**
   - File if approved: `app/robots.ts`.
   - Evidence: wildcard rules currently allow all compliant crawlers, including training crawlers; no Content-Signal is present.
   - Verify: confirm the selected policy in the generated robots.txt. Search-crawler access and AI-training permission are separate decisions.

## Suggested commit grouping after approval

1. `seo: improve route metadata and social previews`
2. `seo: add structured data and sitemap coverage`
3. `seo: add optional agent discovery and optimize logos`
4. Cloudflare HTTPS/security configuration (separate operational change if applicable)

No visible design or body copy changes are included in this plan. Metadata text changes and any new agent-policy directives require the owner's approval before implementation.
