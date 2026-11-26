# Cost calculator page audit

**URL:** https://freellmagents.com/cost-calculator
**Checked:** 2026-11-26

## Findings

- **Title:** `AI Cost Analytics | FreeLLMAgents` (33 characters), unique but below the requested 50-60 characters.
- **Meta description:** `Understand, estimate, and optimize AI model spending with workload-based cost projections.` (90 characters), below the requested 140-160 characters.
- **Canonical:** self-referencing HTTPS URL.
- **Headings:** one H1, “AI Cost Analytics”; the rendered interface includes labeled input controls and descriptive section headings.
- **Social metadata:** Open Graph metadata is present, but no `og:image`; Twitter uses `summary` without `twitter:image`.
- **Structured data:** no JSON-LD, Microdata, or RDFa found.
- **Images:** 24 logo images; sampled images have alt text and explicit width/height, but none uses `loading` or `srcset`. Format and byte sizes were not measured.
- **Content rendering:** calculator controls and initial model data were present in the browser accessibility snapshot. This is a dynamic tool page, not an article; no article schema is suggested.

## Recommendation

Improve the route metadata and use the global social preview. Consider WebApplication schema only if the page's application description and publisher details are accurate and useful. Do not rewrite the visible calculator copy without approval.

## Measurement limit

No deterministic page-checks JSON or numeric performance score is available. PageSpeed Insights returned 429.
