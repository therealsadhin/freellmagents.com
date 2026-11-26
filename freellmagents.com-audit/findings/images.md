# Image SEO report

**Sampled URLs:** homepage, cost calculator, model comparison
**Checked:** 2026-11-26

## Image audit summary

| Metric | Homepage | Calculator | Comparison |
|---|---:|---:|---:|
| `<img>` count | 24 | 24 | 27 |
| Missing alt | 0 | 0 | 0 |
| Missing width/height | 0 | 0 | 0 |
| Missing `loading` | 24 | 24 | 27 |
| Missing `srcset` | 24 | 24 | 27 |

The sampled images are 44×44 provider/model logos, served from the Hugging Face avatar CDN. The image bytes and negotiated formats were not probed, so no conversion or size-savings claim is made.

## Findings and recommendations

- **Positive:** logos have descriptive alt text and explicit dimensions, reducing avoidable layout shifts.
- **Low:** images are not lazy-loaded. Lazy-load below-the-fold logos while keeping any above-the-fold/LCP image eager.
- **Low:** no responsive `srcset` was observed. For 44×44 logos the practical gain may be limited; avoid adding complexity without confirming asset dimensions and CDN support.
- The existing component uses raw `<img>` because logo hosts are dynamic. Before switching to `next/image`, check Next.js 16 and OpenNext Cloudflare guidance, remote-host controls, and image-loader compatibility. Cloudflare Workers should not be assumed to provide Next's default Node image optimizer; use Cloudflare Images only if the project has the required service/configuration.

## Measurement limit

No image probe utility was available. Served format, transfer size, CDN caching, and responsive variants are unverified.
