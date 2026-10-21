import { entityMentions } from '../portfolio-entities.mjs';
import { matchQuestion } from '../portfolio-qa.mjs';

const normalizeQuery = text => text.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}'@.]+/gu, ' ').trim();
const cacheable = text => !/ignore.*instruct|system prompt|password|secret|delete|hack|\b(?:my|mine|i am|i'm)\b/i.test(text);
// Require the same entities, intent, numbers and temporal/negative qualifiers.
// Embedding similarity alone can confuse questions with opposite meanings.
function queryGuard(text) {
  const entities = [...new Set(entityMentions(text).map(m => m.text.toLowerCase()).filter(t => !/^pavan(?: trinath(?: vutukuru)?)?$/.test(t)))].sort();
  const qualifiers = [...new Set(normalizeQuery(text).match(/\b(?:\d+|not|never|without|before|after|previous|current|first|last|future)\b/g) || [])].sort();
  return JSON.stringify([matchQuestion(text), entities, qualifiers]);
}
function unitVector(value) {
  if (!Array.isArray(value) || !value.length || !value.every(Number.isFinite)) return null;
  const norm = Math.hypot(...value);
  return norm ? value.map(x => x / norm) : null;
}
export class SemanticAnswerCache {
  constructor({ capacity = 100, ttl = 3600000, threshold = 0.94, now = Date.now } = {}) {
    this.entries = new Map();
    this.capacity = capacity;
    this.ttl = ttl;
    this.threshold = threshold;
    this.now = now;
  }
  prune() {
    for (const [key, entry] of this.entries) if (entry.expires <= this.now()) this.entries.delete(key);
  }
  async lookup(message, namespace, ai) {
    this.prune();
    if (!cacheable(message)) return { skip: true };
    const key = namespace + ':' + normalizeQuery(message);
    const guard = queryGuard(message);
    const exact = this.entries.get(key);
    if (exact) { exact.hits++; exact.used = this.now(); return { answer: exact.answer, hit: 'exact' }; }
    let vector = null;
    if (ai) {
      let timer;
      try {
        const result = await Promise.race([
          ai.run('@cf/baai/bge-small-en-v1.5', { text: [message] }),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Embedding timeout')), 2000); })
        ]);
        vector = unitVector(result?.data?.[0]);
      } catch { /* Cache failure must not block a fresh answer. */ }
      finally { clearTimeout(timer); }
    }
    if (vector) {
      const matches = [];
      for (const entry of this.entries.values()) {
        if (entry.namespace !== namespace || entry.guard !== guard || entry.vector?.length !== vector.length) continue;
        const score = vector.reduce((sum, v, i) => sum + v * entry.vector[i], 0);
        const threshold = matchQuestion(message) ? Math.min(this.threshold, 0.88) : this.threshold;
        if (score >= threshold) matches.push({ entry, score });
      }
      matches.sort((a, b) => b.score - a.score);
      const best = matches[0];
      if (best && (!matches[1] || best.entry.answer === matches[1].entry.answer || best.score - matches[1].score >= 0.03)) {
        best.entry.hits++;
        best.entry.used = this.now();
        return { answer: best.entry.answer, hit: 'semantic' };
      }
    }
    return { key, namespace, guard, vector };
  }
  remember(ticket, answer) {
    if (!ticket.key || !answer) return;
    this.prune();
    const existing = this.entries.get(ticket.key);
    this.entries.set(ticket.key, { ...ticket, answer, hits: (existing?.hits || 0) + 1, used: this.now(), expires: this.now() + this.ttl });
    while (this.entries.size > this.capacity) {
      const victim = [...this.entries].sort((a,b) => a[1].hits - b[1].hits || a[1].used - b[1].used)[0];
      this.entries.delete(victim[0]);
    }
  }
}
