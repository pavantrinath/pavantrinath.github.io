# Cloudflare hosting

The existing GitHub Pages site continues to work. Cloudflare configuration is ready; no Cloudflare deployment or domain registration has been completed by this commit.

## Deploy on the free plan

1. Sign in at https://dash.cloudflare.com/ and choose Workers & Pages > Create application > Import a repository.
2. Connect GitHub and select pavantrinath/pavantrinath.github.io, branch master.
3. Use Worker name pavantrinath. Leave the dashboard build command empty: Wrangler's build configuration runs node scripts/build-cloudflare.mjs. Deploy command: npx wrangler deploy.
4. Deploy and verify the returned workers.dev URL. Stay on Workers Free.
5. Future pushes to master deploy through the Cloudflare Git integration.

Local packaging: node scripts/build-cloudflare.mjs
Local deployment after Cloudflare CLI authentication: npx wrangler deploy

Only website files are copied to dist; repository configuration and credentials are not served.

## Purchase and attach pavantrinath.xyz

1. Search for the exact spelling pavantrinath.xyz at https://porkbun.com/.
2. Confirm availability and final checkout pricing. The advertised standard .xyz price checked October 21, 2026 was USD 2.04 for year one and USD 14.21 for renewal; premium domains and taxes may differ.
3. Register in your own account.
4. Add pavantrinath.xyz as a website/zone in Cloudflare on the Free plan. Replace its nameservers at Porkbun with the two Cloudflare assigns.
5. Once the zone is active, open the deployed Worker > Settings > Domains & Routes > Add > Custom Domain, and add pavantrinath.xyz. Cloudflare provisions DNS and TLS.
6. Optionally add www.pavantrinath.xyz as another custom domain.
7. Verify the custom domain before changing links or redirecting the existing GitHub Pages address.

## LLM backend

This configuration deploys the current static website. It does not enable an LLM or incur LLM API charges. A future Worker handler can expose /api/chat and keep the provider credential in a Cloudflare secret. Never put an API key in app.js or commit it.
