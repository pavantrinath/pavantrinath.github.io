// Single-module packaging for direct API/MCP deployment without a Git connection.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const assets = {};
for (const [path, type] of [['index.html', 'text/html'], ['app.js', 'text/javascript'], ['portfolio-qa.mjs', 'text/javascript'], ['style.css', 'text/css']]) {
  assets['/' + path] = { body: await read(path), type: type + '; charset=utf-8' };
}
const facts = (await read('portfolio-qa.mjs')).replace(/export /g, '');
const context = (await read('worker/portfolio-context.mjs')).replace("import { FACTS } from '../portfolio-qa.mjs';", '').replace('export const SYSTEM_CONTEXT', 'const SYSTEM_CONTEXT');
const handler = (await read('worker/index.mjs'))
  .replace("import { SYSTEM_CONTEXT } from './portfolio-context.mjs';", '')
  .replace('return env.ASSETS.fetch(request);', 'return env.ASSETS ? env.ASSETS.fetch(request) : serveStatic(request);');
const serving = `
const STATIC_ASSETS = ${JSON.stringify(assets)};
function serveStatic(request) {
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const path = new URL(request.url).pathname;
  const asset = STATIC_ASSETS[path === '/' ? '/index.html' : path];
  if (!asset) return new Response('Not found',{status:404});
  return new Response(request.method === 'HEAD' ? null : asset.body,{headers:{'Content-Type':asset.type,'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
`;
await mkdir(resolve(root, '.wrangler'), { recursive: true });
await writeFile(resolve(root, '.wrangler/deploy.mjs'), facts + '\n' + context + '\n' + serving + '\n' + handler);
console.log('Direct API bundle ready in .wrangler/deploy.mjs');

