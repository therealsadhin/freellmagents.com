# Agentic browsing readiness report

**URL:** https://freellmagents.com/
**Checked:** 2026-11-26

## Summary

- **Lighthouse Agentic Browsing:** not measured. PageSpeed Insights returned HTTP 429; no X/N fraction is inferred.
- **Agent-UX heuristic:** not measured; no deterministic agent-UX script was available.
- **P0 failures:** not scored because the required Lighthouse and heuristic measurements were unavailable. The direct checks below are evidence, not a substitute score.

## Direct checks

| Check | Result | Evidence |
|---|---|---|
| Server-rendered content | Pass on sampled routes | Homepage and tool content appeared in initial HTML. |
| robots.txt reachable | Pass | HTTP 200; wildcard `Allow: /`, `Disallow: /api/`. |
| AI crawler groups | No explicit groups | Search and training agents inherit the wildcard policy. |
| Content-Signal | Not present | No Content-Signal directive in current robots.txt. |
| llms.txt | Missing | `/llms.txt` returns 404. |
| AI catalog / agent card | Not found | `/ai-catalog.json` and `/.well-known/agent-card.json` returned 404. |
| Unknown route status | Pass | Unknown path returns 404, not catch-all 200. |
| Accessibility tree | Qualitative only | Browser snapshot showed banner, main/content landmarks, navigation, headings, and labeled calculator controls. No score was produced. |
| WebMCP | Not measured | No WebMCP registration check was available; no claim is made about support. |
| WAF behavior | Not tested | No user-agent matrix was sent. |

## Recommendations

- Preserve the server-rendered content and real 404 behavior.
- Add `public/llms.txt` only if desired as an optional site map; it is not a Google ranking lever.
- Decide training-agent policy before adding explicit groups or Content-Signal. Search, training, and user-triggered agents are separate policy choices.
- WebMCP is optional; consider it only if the site intentionally wants browser agents to invoke existing forms/tools. Do not add tools that bypass confirmation or existing handlers.
- Re-run Lighthouse Agentic Browsing and the accessibility heuristic after the PSI quota/runtime is available.
