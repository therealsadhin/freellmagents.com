# GEO / AI search report

**URL:** https://freellmagents.com/
**Checked:** 2026-11-26

## Readiness observations

- Main content is server-rendered on the homepage and sampled tools.
- robots.txt returns 200 and has a wildcard allow rule. This permits compliant crawlers under the current rule set; it does not establish that a specific provider actually crawls or cites the site.
- No explicit per-agent groups or Content-Signal were found.
- `/llms.txt` returns 404. It is an optional community proposal and is not a Google ranking or citation lever.
- No JSON-LD was found on the sampled routes.
- The site has useful interactive tools and communicates upstream model-data sources on About/tool pages. Search citations, brand mentions, and AI platform visibility were not measured.

## Crawler policy

Current wildcard robots rules allow search and training crawlers alike, subject to each provider's behavior. Training permission is separate from search-citability. Do not add explicit training directives or `ai-train` Content-Signal until the site owner chooses that policy.

## Recommendations

1. Improve standard SEO metadata, sitemap coverage, and factual source attribution first; these are the primary discoverability fundamentals.
2. Add a concise `public/llms.txt` only as an optional navigation aid, with accurate public routes. Do not claim a Google benefit.
3. Add truthful Organization/WebSite schema as described in `schema.md`.
4. No GEO score is assigned because no citation/mention tool or deterministic audit data was available.
