import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';

const origin = 'https://pavantrinath.xyz';
const request = (data, options = {}) => new Request(origin + '/api/chat', {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...options.headers },
  body: typeof data === 'string' ? data : JSON.stringify(data)
});
const env = {
  GEMINI_API_KEY: 'test-key',
  CHAT_RATE_LIMIT: { limit: async () => ({ success: true }) },
  ASSETS: { fetch: async () => new Response('site') }
};

test('inactive without key or rate limiter; never exposes secrets', async () => {
  for (const e of [{}, { GEMINI_API_KEY: 'secret' }]) {
    const r = await worker.fetch(new Request(origin + '/api/config'), e);
    assert.deepEqual(await r.json(), { enabled: false, provider: 'Gemini' });
    assert.equal((await worker.fetch(request({ message: 'Hi' }), e)).status, 503);
  }
});
test('validates origin, media type, method and bounded input', async () => {
  assert.equal((await worker.fetch(request({ message: 'Hi' }, { headers: { Origin: 'https://other.example' } }), env)).status, 403);
  assert.equal((await worker.fetch(request('{}', { headers: { 'Content-Type': 'text/plain' } }), env)).status, 415);
  assert.equal((await worker.fetch(new Request(origin + '/api/chat'), env)).status, 405);
  for (const data of ['bad json', null, {}, { message: '' }, { message: 'x'.repeat(601) }]) {
    assert.equal((await worker.fetch(request(data), env)).status, 400);
  }
  assert.equal((await worker.fetch(request({ message: 'x'.repeat(5000) }), env)).status, 413);
});
test('rate limited requests never reach provider', async () => {
  const response = await worker.fetch(request({ message: 'Hi' }), {
    ...env, CHAT_RATE_LIMIT: { limit: async () => ({ success: false }) }
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});
test('sends full public context and returns text; hides upstream errors', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /gemini-3.5-flash-lite:generateContent$/);
      assert.equal(options.headers['x-goog-api-key'], 'test-key');
      const body = JSON.parse(options.body);
      assert.equal(body.contents[0].parts[0].text, 'What did Pavan build?');
      const context = body.system_instruction.parts[0].text;
      for (const fact of ['TL, modeling', 'agentic trading', 'Cortex assistant', 'San Francisco Bay Area', 'Liftoff', 'eBay', 'xAI', 'pavantrinath@gmail.com']) assert(context.includes(fact));
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Answer' }] } }] });
    };
    assert.equal((await (await worker.fetch(request({ message: 'What did Pavan build?' }), env)).json()).answer, 'Answer');
    globalThis.fetch = async () => new Response('sensitive provider error', { status: 429 });
    let response = await worker.fetch(request({ message: 'Hi' }), env);
    assert.equal(response.status, 429);
    assert(!(await response.text()).includes('sensitive'));
    globalThis.fetch = async () => Response.json({ candidates: [{ finishReason: 'SAFETY' }] });
    assert.equal((await worker.fetch(request({ message: 'Hi' }), env)).status, 502);
    globalThis.fetch = async () => { throw new Error('test-key'); };
    response = await worker.fetch(request({ message: 'Hi' }), env);
    assert.equal(response.status, 502);
    assert(!(await response.text()).includes('test-key'));
  } finally { globalThis.fetch = original; }
});
test('website fallback works and unknown API paths return 404', async () => {
  assert.equal(await (await worker.fetch(new Request(origin), env)).text(), 'site');
  assert.equal((await worker.fetch(new Request(origin + '/api/nope'), env)).status, 404);
});

test('draft cache checks never generate and use a separate limiter key', async () => {
 const original=globalThis.fetch;
 let calls=0, key='';
 try {
   globalThis.fetch=async()=>{calls++;throw Error('must not generate');};
   const response=await worker.fetch(request({message:'A fresh draft question',lookupOnly:true}),{
     ...env,CHAT_RATE_LIMIT:{limit:async data=>{key=data.key;return {success:true};}}
   });
   assert.equal(response.status,200);
   assert.deepEqual(await response.json(),{cache:'miss'});
   assert.match(key,/^lookup:/);
   assert.equal(calls,0);
 } finally {globalThis.fetch=original;}
});

