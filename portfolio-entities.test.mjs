import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entityMentions, renderEntities } from './portfolio-entities.mjs';
test('labels locations and research topics, selecting longest matching phrases', () => {
  assert.deepEqual(entityMentions('San Francisco Bay Area; foundation models and post-training RL.').map(m=>[m.text,m.type]),[
    ['San Francisco Bay Area','LOCATION'], ['foundation models','RESEARCH TOPIC'], ['post-training RL','RESEARCH TOPIC']
  ]);
});
test('supports all suggestion topics and mixed model answer entities', () => {
  for (const [text,type] of [['contact','INTENT'],['foundation models','RESEARCH TOPIC'],['cricket','INTEREST'],['San Jose','LOCATION'],['talks','INTENT'],['new opportunity','INTENT'],['Pavan','PERSON'],['Robinhood','ORG'],['pavantrinath@gmail.com','EMAIL']]) assert.equal(entityMentions(text)[0].type,type);
});
test('escapes user/model markup and links without allowing HTML execution', () => {
  const html=renderEntities('<img src=x onerror="alert(1)"> Pavan <script>alert(1)</script> https://example.com/?a=1&b=2.');
  assert(!html.includes('<img'));assert(!html.includes('<script'));
  assert(html.includes('&lt;img'));assert(html.includes('a=1&amp;b=2'));
  assert(html.endsWith('</span>.'));
  assert(!renderEntities('javascript:alert(1)').includes('<a'));
});
test('matches whole mentions without highlighting parts of other words', () => {
  assert.equal(entityMentions('Chicago ongoing gopher javaish lets go outside').length,0);
});
