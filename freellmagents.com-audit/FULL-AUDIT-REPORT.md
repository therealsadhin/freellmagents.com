# FreeLLMAgents.com SEO audit

**Audit date:** 2026-11-26
**Audited URL:** https://freellmagents.com/
**Deployment:** Cloudflare Workers via OpenNext
**Coverage:** Live homepage, key product and information pages, sitemap URLs, robots.txt, representative model detail URL, and agent discovery endpoints.

## Executive summary

The site is reachable over HTTPS, serves server-rendered page content, and has a working robots.txt and XML sitemap. Sampled pages have one clear H1, self-referencing canonical URLs, descriptive image alt text, and explicit image dimensions.

The highest-impact issues are that HTTP requests are served without an HTTPS redirect, page titles and descriptions are substantially shorter than the requested targets, and the sitemap omits the model-comparison page and dynamic model detail pages. The sampled pages have no structured data or Open Graph image. The site has no llms.txt; this is optional and is not a Google ranking or citation lever.

**SEO Health Score:** Not scored. The bundled claude-seo CLI is not installed or present in the workspace, and PageSpeed Insights returned HTTP 429. No score or Core Web Vitals result is inferred.

## Post-audit implementation status

- Route metadata and social defaults have been updated for the audited pages.
- A 1200×630 default Open Graph image route is implemented.
- Organization, WebSite, and WebPage JSON-LD entities are implemented.
- The sitemap now includes the model-comparison page and the first popular-model set, with a static fallback if Hugging Face is unavailable.
- `/llms.txt`, a proper global not-found page, and explicit search/training crawler allowance rules have been added.
- The provider logo component now uses `next/image` with `unoptimized` because dynamic third-party hosts cannot be safely constrained to the default optimizer.
- The default Next.js favicon was replaced with a branded SVG icon; the mobile navigation now uses an opaque, bordered popover surface.
- `npm run build` passed after implementation.
- Mobile-browser verification confirmed the menu is visible with an opaque background, text contrast, border, and shadow; `/icon.svg` returns HTTP 200.

## Prioritized findings

### High

1. **HTTP is not redirected to HTTPS.** `http://freellmagents.com/` returned HTTP 200 instead of redirecting. A separate www hostname returned HTTP 520. The preferred HTTPS canonical is present, but transport and hostname handling should be fixed at Cloudflare. See `findings/technical.md`.
2. **Metadata is short across the sampled site.** Sampled titles were 17-35 characters and descriptions 66-91 characters. They are unique but below the requested 50-60 / 140-160 character targets, reducing control over search-result presentation. See the page reports.
3. **Important URLs are missing from the sitemap.** The current sitemap has nine hard-coded URLs, omits `/model-comparison`, and contains no dynamic model detail URLs. See `findings/sitemap.md`.

### Medium

4. **No JSON-LD, Microdata, or RDFa was found** on the homepage, cost calculator, or model-comparison page. Organization and WebSite schema are relevant; tool-specific WebApplication schema may be appropriate if its facts can be stated truthfully. See `findings/schema.md`.
5. **No `og:image` or `twitter:image` was found** on sampled pages. Twitter cards use `summary`; no share image is configured. See the page reports.
6. **Important security headers were absent from the sampled homepage response.** HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy were not observed. These are security/trust controls, not confirmed ranking factors.

### Low / informational

7. **Provider/model logos are eager-loaded.** The homepage had 24, cost calculator 24, and model comparison 27 images. All sampled image tags had alt text and width/height, but none had `loading` or `srcset`. Served format and bytes were not measured.
8. **`/llms.txt`, `/ai-catalog.json`, and `/.well-known/agent-card.json` return 404.** An llms.txt can be added as an optional discovery aid, but should not be presented as a Google SEO gain. The other discovery files are only needed if the site has agent resources to publish.
9. **Sitemap uses `<changefreq>` and `<priority>`.** Google ignores these fields. No `lastmod` values were supplied; do not add fabricated dates.

## Positive findings

- HTTPS homepage and key pages return HTTP 200.
- `robots.txt` and `sitemap.xml` both return HTTP 200; robots.txt references the sitemap and allows `/`, while disallowing `/api/`.
- The homepage and sampled key pages return primary content in server-rendered HTML.
- The homepage, calculator, and comparison page each have one H1. The About page has a logical H1/H2/H3 hierarchy.
- Sampled canonical URLs are self-referencing and use the preferred HTTPS hostname.
- The representative dynamic model detail route returned HTTP 200.
- An unknown route returned HTTP 404; the model route has a dedicated not-found UI.
- Sampled provider logos have descriptive alt text and explicit dimensions.

## Measurement limits

- `/seo doctor` and the deterministic page/sitemap/render/image scripts could not be run: the `claude-seo` launcher is absent from the workspace and available install paths, and `CLAUDE_PLUGIN_ROOT` is unset. No `/seo setup` was attempted because the launcher needed to run it is also absent.
- PageSpeed Insights returned HTTP 429. Lighthouse categories, Core Web Vitals, and the Lighthouse Agentic Browsing X/N fraction are unmeasured.
- The integrated browser provided rendered/accessibility snapshots for the homepage, cost calculator, and About page. No browser-based numeric accessibility or performance score was available.
- Image byte sizes/negotiated formats, Search Console indexing, field data, backlinks, and brand mentions were not verified.
- The full delegated 500-page crawl was not available; the audit covers the sitemap, key routes, and representative model detail route.

## Report index

- [Technical SEO](findings/technical.md)
- [Homepage](findings/page-home.md)
- [Cost calculator](findings/page-cost-calculator.md)
- [Model comparison](findings/page-model-comparison.md)
- [Schema](findings/schema.md)
- [Sitemap](findings/sitemap.md)
- [Images](findings/images.md)
- [GEO](findings/geo.md)
- [Agentic readiness](findings/agentic.md)
- [Prioritized action plan](ACTION-PLAN.md)
