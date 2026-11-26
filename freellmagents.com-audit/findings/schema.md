# Structured data report

**Sampled URLs:** homepage, cost calculator, model comparison
**Checked:** 2026-11-26

## Detection

No JSON-LD script, Microdata (`itemscope`/`itemprop`), or RDFa was detected in the sampled server-rendered HTML.

## Recommendations

1. Add truthful `Organization` and `WebSite` entities at the site level. Include only known details; do not invent social profiles, a physical address, or a logo URL.
2. Add `WebPage` information where helpful and consider `WebApplication` for calculator/comparison pages only if all properties are supported by visible page content.
3. For model detail pages, use a type only when the model's real software identity and factual properties are represented accurately. Do not use Product/Offer just to target a rich result.
4. The About page has visible FAQ content but no FAQ schema is needed; Google FAQ rich results are retired. Do not add FAQPage for a claimed Google SERP benefit.

## Validation

No schema validator was available in the SEO runtime. Validate JSON-LD syntax and absolute URLs after implementation, and ensure the structured data matches the server-rendered page.
