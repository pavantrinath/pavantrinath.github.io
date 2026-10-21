import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationClassifier } from './presentation-classifier.mjs';
const examples=()=>({data:[...Array.from({length:8},()=>[1,0]),...Array.from({length:8},()=>[0,1])]});
test('semantic classifier distinguishes work from personal content and initializes examples once',async()=>{
 let calls=0;
 const ai={run:async(model,input)=>{calls++;assert.equal(input.text.length,16);return examples();}};
 const classify=createPresentationClassifier();
 assert.equal(await classify([1,0],ai),'career');
 assert.equal(await classify([0,1],ai),'text');
 assert.equal(await classify([1,1],ai),'text');
 assert.equal(calls,1);
});
test('classifier failures preserve text-only fallback and recover on a later request',async()=>{
 const classify=createPresentationClassifier();
 assert.equal(await classify(null,{}),'text');
 assert.equal(await classify([1,0],{run:async()=>{throw Error('offline')}}),'text');
 assert.equal(await classify([1,0],{run:async()=>examples()}),'career');
});
