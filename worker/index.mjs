import { saveVisitorName } from './visitor-names.mjs';
import { SYSTEM_CONTEXT } from './portfolio-context.mjs';
import { SemanticAnswerCache } from './semantic-cache.mjs';

// Opportunistic, bounded public-answer cache; eviction/restarts are ordinary misses.
const answerCache = new SemanticAnswerCache();

const json = (data, status = 200, headers = {}) => Response.json(data, {
  status, headers: { 'Cache-Control': 'no-store', ...headers }
});
const ready = env => Boolean(env.GEMINI_API_KEY && env.CHAT_RATE_LIMIT);

async function chat(request, env) {
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405, { Allow: 'POST' });
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Use the chat on this website.' }, 403);
  }
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ error: 'Expected JSON.' }, 415);
  }
  if (!ready(env)) return json({ error: 'AI is not connected yet. Local answers are available.' }, 503);
  if (Number(request.headers.get('Content-Length')) > 4096) return json({ error: 'Question too long.' }, 413);
  // Bound the streamed body too; Content-Length is optional and untrusted.
  const reader = request.body?.getReader();
  if (!reader) return json({ error: 'Add a question.' }, 400);
  let bytes = 0, text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return json({ error: 'Question too long.' }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return json({ error: 'Could not read the question.' }, 400);
  }
  let data;
  try { data = JSON.parse(text); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (!message || message.length > 600) return json({ error: 'Ask a question of 1–600 characters.' }, 400);
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limit = await env.CHAT_RATE_LIMIT.limit({ key: ip });
    if (!limit.success) return json({ error: 'Too many questions. Try again in a minute.' }, 429, { 'Retry-After': '60' });
    const model = env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    if (!/^[a-zA-Z0-9._-]+$/.test(model)) return json({ error: 'AI is temporarily unavailable.' }, 503);
    const ticket = await answerCache.lookup(message, model, env.AI);
    if (ticket.answer) return json({ answer: ticket.answer, provider: 'Gemini', cache: ticket.hit });
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_CONTEXT }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 320, temperature: 0.3 }
        }),
        signal: AbortSignal.timeout(12000)
      }
    );
    if (!response.ok) return json({
      error: response.status === 429 ? 'AI quota reached. Local answers are still available.' : 'AI is temporarily unavailable.'
    }, response.status === 429 ? 429 : 502);
    const result = await response.json();
    const candidate = result.candidates?.[0];
    const answer = candidate?.content?.parts?.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
    if (!answer || !['STOP', 'MAX_TOKENS'].includes(candidate.finishReason)) {
      return json({ error: 'No answer available. Try another question or contact Pavan.' }, 502);
    }
    const boundedAnswer = answer.slice(0, 2400);
    if (candidate.finishReason === 'STOP') answerCache.remember(ticket, boundedAnswer);
    return json({ answer: boundedAnswer, provider: 'Gemini', cache: 'miss' });
  } catch {
    // Do not log visitor messages, credentials, or raw upstream errors.
    return json({ error: 'AI is temporarily unavailable. Local answers are still available.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/config') {
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Use GET.' }, 405);
      return json({ enabled: ready(env), provider: 'Gemini' });
    }
    if (path === '/api/visitor-name') return saveVisitorName(request, env);
    if (path === '/api/chat') return chat(request, env);
    if (path.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return env.ASSETS.fetch(request);
  }
};
