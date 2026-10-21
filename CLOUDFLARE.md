# Cloudflare hosting

## Current deployment (October 21, 2026)

- Cloudflare Worker: pavantrinath
- URL: https://pavantrinath.pavantrinath.workers.dev
- Account: eb88723ebcb227538828d4a35c4e7d69
- Deployment: updated through the Cloudflare MCP API; see the Worker deployment history.
- Custom domain attached: pavantrinath.xyz
- Domain registration: purchased by the owner at Porkbun.
- Zone status at last check: pending nameserver activation, Free Website plan.
- No paid subscription was enabled.
- No automatic GitHub-to-Cloudflare deployment is connected yet. The GitHub app connection was looping, so the initial deployment was uploaded directly through the Cloudflare MCP API.
- The direct upload serves the current website from an embedded Worker module and exposes /api/config and /api/chat. scripts/build-mcp-bundle.mjs reproduces that bundle. Wrangler deployments use worker/index.mjs and the static assets configuration.
- Local route/content checks passed. The deployment and custom domain attachment were confirmed by Cloudflare's API; public HTTP verification from the execution environment returned 403 and could not confirm rendering.

## Required Porkbun step

In Porkbun > Domain Management > pavantrinath.xyz > Nameservers, replace the existing nameservers with exactly:

- nitin.ns.cloudflare.com
- susan.ns.cloudflare.com

Cloudflare activates the zone once delegation is detected. The custom domain is already attached to the Worker, so no GitHub Pages A records are needed. Verify https://pavantrinath.xyz once activation and TLS issuance finish.

## Future deployments

Local packaging: node scripts/build-cloudflare.mjs
Local deployment after Cloudflare CLI authentication: npx wrangler deploy

Wrangler runs the configured build command and uploads dist as static assets. Only website files are copied to dist; repository configuration and credentials are not served.

To enable automatic deployment later, connect this repository's master branch to the existing pavantrinath Worker through Cloudflare Builds. Leave the dashboard build command empty; deploy command: npx wrangler deploy. Until that connection is confirmed, GitHub pushes alone do not update Cloudflare.

The existing GitHub Pages site remains available separately.

## Gemini backend

Gemini is prepared but disabled until GEMINI_API_KEY is present as a Cloudflare Worker secret.

1. Create an API key at https://aistudio.google.com/apikey using a project on the Gemini API free tier; do not enable paid billing if you want free-only usage.
2. Open Cloudflare > Workers & Pages > pavantrinath > Settings > Variables and Secrets > Add.
3. Choose Secret, name GEMINI_API_KEY, paste the key there, and deploy/save the change. Never paste the key into chat, GitHub, or frontend files.
4. Refresh the website. An Ask AI button and Enter-to-submit become available when /api/config reports enabled.
5. Optional non-secret setting GEMINI_MODEL overrides the default gemini-3.5-flash-lite. Check current free-tier availability in Google AI Studio before changing models.

The server supplies worker/portfolio-context.mjs on every request. It includes all supplied public portfolio facts and the TL, modeling attribution for both agentic trading and Cortex assistant. Portfolio claims must stay grounded in the supplied public facts. Questions must be about Pavan or directly relevant to his documented work, skills, or interests. Unrelated questions receive a refusal; missing portfolio facts are never invented. Mixed questions answer only relevant parts. Successful model responses display “replied by Atom”; local answers and failed model calls do not receive that label. The uploaded PavanTrinathsResume.pdf supplies current education, skills, awards, and professional highlights: UT Dallas master’s in Cognitive Science (July 2015), KL University B.Tech in Computer Science (May 2013). It supersedes conflicting September 2025 resume details. Earlier Capgemini and dated community background remain sourced to the September 2025 resume. Direct owner instructions about TL, modeling attribution take precedence. Indian Champs / NACL cricket participation was confirmed directly by the owner. The private resume itself is not published. Each question is independent; there is no stored chat history.

The frontend sends questions only on Ask AI or Enter, renders answers as text, and retains local matching when unconfigured or unavailable. Visitors see a notice that submitted questions are processed by an external AI service. The interface calls the assistant Atom. Google free-tier data handling may allow inputs/outputs to improve products; see https://ai.google.dev/gemini-api/docs/pricing.

Requests are limited to 600 characters, 4 KiB bodies, 320 output tokens and a 12-second provider timeout. A Cloudflare rate limiter allows approximately six calls/minute per IP per Cloudflare location. It is an abuse control, not a global billing cap. Keep the Gemini project on its free tier to avoid paid usage. Provider quota failures fall back to local responses; there is no paid-provider fallback. This code does not log question text or store conversations.

A ChatGPT subscription does not include OpenAI API credits; OpenAI API billing is separate.

Validation: node --test worker/chat.test.mjs
Direct MCP packaging: node scripts/build-mcp-bundle.mjs
Wrangler packaging and deployment: npx wrangler deploy (uses the configured build command).

