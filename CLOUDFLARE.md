# Cloudflare hosting

## Current deployment (October 21, 2026)

- Cloudflare Worker: pavantrinath
- URL: https://pavantrinath.pavantrinath.workers.dev
- Account: eb88723ebcb227538828d4a35c4e7d69
- Deployment: ff29f514f9bc48018c7b093c8cda836a
- Custom domain attached: pavantrinath.xyz
- Domain registration: purchased by the owner at Porkbun.
- Zone status at last check: pending nameserver activation, Free Website plan.
- No paid subscription was enabled.
- No automatic GitHub-to-Cloudflare deployment is connected yet. The GitHub app connection was looping, so the initial deployment was uploaded directly through the Cloudflare MCP API.
- The direct upload serves the current index.html, app.js, and style.css from an embedded Worker module. Future Wrangler deployments can use the static assets configuration in this repository.
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

## LLM backend

The current deployment does not enable an LLM. A future Worker handler can expose /api/chat and keep the provider credential in a Cloudflare secret. Never put an API key in app.js or commit it.
