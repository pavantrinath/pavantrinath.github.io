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

test('labels foods, drinks, places and objects by their specific type', () => {
  assert.deepEqual(entityMentions('Indian pizza, coffee and a laptop on the beach near San Francisco.').map(m=>[m.text,m.type]), [
    ['Indian pizza','FOOD'],['coffee','DRINK'],['laptop','OBJECT'],['the beach','LOCATION'],['San Francisco','LOCATION']
  ]);
  assert.deepEqual(entityMentions('A coffee mug, cricket ball and robot in Dallas.').map(m=>[m.text,m.type]), [
    ['coffee mug','OBJECT'],['cricket ball','OBJECT'],['robot','OBJECT'],['Dallas','LOCATION']
  ]);
  assert.equal(entityMentions('teaching keyboardist pizzazz').length, 0);
});
