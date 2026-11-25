# FreeLLMAgents

FreeLLMAgents is a Next.js model directory. It reads paginated model metadata
from the Hugging Face Hub API and enriches matching entries with the Hugging
Face Inference Providers catalog. Provider logos are managed independently of
the model API and resolved from Hugging Face author avatars, followed by
official-site Simple Icons and favicon fallbacks where available.

## Local setup

1. Install the project dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local` (or use the provided blank local
   file) and fill in the values below.
3. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `HF_TOKEN` | No | Optional server-only Hugging Face token. Public model metadata can be requested without it. |
| `NEXT_PUBLIC_SITE_URL` | For deployment | Absolute canonical site origin, for example `https://freellmagents.com`. |
| `RESEND_API_KEY` | For contact delivery | Server-only API key used to send contact email through Resend. |
| `CONTACT_TO_EMAIL` | For contact delivery | Must be `support@freellmagents.com`; the API rejects a different configured recipient. |
| `CONTACT_FROM_EMAIL` | For contact delivery | Sender address/domain verified in Resend, for example `FreeLLMAgents Support <support@freellmagents.com>`. |

Never add `HF_TOKEN` or `RESEND_API_KEY` to a `NEXT_PUBLIC_` variable. The
`.env.local` file is git-ignored; `.env.local.example` contains placeholders
only. Contact submissions return an error when email credentials are missing
or delivery fails.
Do not fill in `CONTACT_FROM_EMAIL` until the sender/domain is verified in your
Resend account. Resend must accept the message before the form reports success;
the visitor's email is used as `Reply-To`, never as `From`.

## Model metadata and limitations

The directory requests 24 models per page and follows Hugging Face Hub cursor
links. The API does not always return an overall result count. Search, task,
author, and sort fields are sent to the Hub API. The Inference Providers
catalog is used to enrich matching Hub model IDs; its context lengths, pricing,
and tool support may vary by provider and can be absent.

License and model information comes from publisher-provided Hub metadata and
is not independently verified. An unknown license or missing metadata is not
classified as proprietary or open source. Provider pricing is only shown when
reported by the API.

## Contact delivery and deployment

Contact messages are validated on the server and delivered by Resend to the
configured recipient. Configure a verified sender in Resend before testing
delivery. The route includes a honeypot, bounded request body, and a
best-effort in-memory limit of five requests per address in 15 minutes. This
limit is process-local and may reset or differ across serverless instances;
use a shared rate-limit store at deployment time if a durable cross-instance
limit is required.

Before deploying, also confirm the hosting provider's request-log retention
and cookie behavior, Resend's applicable retention settings, and the legal
operator details called out on the policy pages.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```
