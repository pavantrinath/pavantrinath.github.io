import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'app.js', 'portfolio-qa.mjs', 'bowling-scene.mjs', 'style.css']) {
  await copyFile(resolve(root, file), resolve(output, file));
}
for (const directory of ['img', 'fav', 'css', 'js']) {
  try {
    await cp(resolve(root, directory), resolve(output, directory), { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log('Cloudflare static assets ready in dist/.');

