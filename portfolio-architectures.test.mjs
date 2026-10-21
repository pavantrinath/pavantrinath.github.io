import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARCHITECTURE_FAMILIES, BRANCH_ARCHITECTURES, ARCHITECTURE_CONTEXT, renderArchitectureKnowledge } from './portfolio-architectures.mjs';
import { entityMentions } from './portfolio-entities.mjs';
import { isModelingQuestion } from './portfolio-qa.mjs';
import { SYSTEM_CONTEXT } from './worker/portfolio-context.mjs';

test('owner-confirmed architectures appear in the knowledge families and model context',()=>{
 const worked=Object.values(ARCHITECTURE_FAMILIES).flatMap(f=>f.worked);
 for(const name of ['MaskNet','PLE','RealMLP','Llama','All attention blocks','All Transformer blocks','OneRec','PLUM','TIGER','Mixture of experts','Looped Transformers','Decision heads'])assert(worked.includes(name),name);
 assert(SYSTEM_CONTEXT.includes(ARCHITECTURE_CONTEXT));
 assert.match(ARCHITECTURE_CONTEXT,/not confirmation that each architecture was deployed at that employer/);
 assert.match(ARCHITECTURE_CONTEXT,/Related patterns are educational comparisons/);
});
test('timeline branch families render hands-on and related knowledge with reference links',()=>{
 for(const [job,branches] of Object.entries(BRANCH_ARCHITECTURES)) for(const [index,keys] of branches.entries()){
  const html=renderArchitectureKnowledge(job,index);
  for(const key of keys){assert(ARCHITECTURE_FAMILIES[key]);assert(html.includes(ARCHITECTURE_FAMILIES[key].title.replace(/&/g,'&amp;')));}
  if(keys.length){assert.match(html,/Worked with/);assert.match(html,/Related patterns/);}
 }
 const ranking=renderArchitectureKnowledge('robinhood',0);
 assert.match(ranking,/MaskNet/);
 assert.match(ranking,/PLUM/);
 assert.match(ranking,/rel="noopener noreferrer"/);
 assert.equal(renderArchitectureKnowledge('unknown',0),'');
});
test('architecture names receive live NER tags and technical questions route to the LLM',()=>{
 for(const name of ['MaskNet','PLE','Llama','OneRec','PLUM','TIGER','RealMLP','mixture of experts','looped Transformers','decision heads']){
  assert.equal(entityMentions(name)[0]?.type,'ARCHITECTURE',name);
  assert.equal(isModelingQuestion('Explain '+name),true,name);
 }
 assert.equal(isModelingQuestion('What architectures do you know?'),true);
});
