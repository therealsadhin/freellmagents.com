# Sitemap report

**URL:** https://freellmagents.com/sitemap.xml
**Checked:** 2026-11-26

## Results

- `robots.txt` and the sitemap return HTTP 200.
- robots.txt references `https://freellmagents.com/sitemap.xml`.
- Sitemap is a standard XML urlset with nine hard-coded URLs: homepage, About, Contact, Providers, Pricing, Cost Calculator, Privacy, Terms, and Cookies.
- `/model-comparison` is not listed.
- Dynamic model detail pages are not listed, although a representative model detail URL returned HTTP 200 and model links are present on the homepage.
- `<changefreq>` and `<priority>` are present; Google ignores these fields.
- No `<lastmod>` values were observed. This is preferable to fabricated timestamps.

## Recommendations

- Add `/model-comparison` if it is intended to be indexed.
- Decide which dynamic model detail pages should be indexable, then produce canonical, HTTP 200 sitemap entries using a bounded/discoverable source. Do not generate low-value or unavailable model URLs.
- Keep account/utility and legal URLs out of the sitemap if they are not intended as search landing pages. Their presence is not by itself a critical error.
- Remove `<changefreq>` and `<priority>` for a cleaner sitemap, or leave them knowing they do not influence Google crawling.
- Verify every emitted URL returns 200 and its canonical matches the sitemap URL.

## Measurement limit

The deterministic sitemap discovery script was unavailable. The live sitemap contents were retrieved directly; the full crawl-to-sitemap comparison was not performed.
