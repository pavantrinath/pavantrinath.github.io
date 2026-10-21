import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initBowlingScene } from './bowling-scene.mjs';

test('run-up advances the swinging foot while keeping the planted foot grounded', () => {
  const originals = Object.fromEntries(['document','matchMedia','performance','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  const part = () => ({attrs:{},setAttribute(k,v){this.attrs[k]=String(v);},addEventListener(){}});
  const parts = new Map();
  const svg={querySelector(selector){if(!parts.has(selector))parts.set(selector,part());return parts.get(selector);}};
  const button=part();let callback;
  const root={querySelector(s){return s==='svg'?svg:button;},setAttribute(){},removeAttribute(){}};
  const points=name=>parts.get(`[data-part="${name}"]`).attrs.d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
  try {
    for (const [name,value] of Object.entries({document:{addEventListener(){}},matchMedia:()=>({matches:false,addEventListener(){}}),performance:{now:()=>0},requestAnimationFrame:cb=>{callback=cb;return 1;},cancelAnimationFrame(){}}))Object.defineProperty(globalThis,name,{configurable:true,value});
    initBowlingScene(root);
    const initialRight=points('right-leg'),initialLeft=points('left-leg');
    callback(Math.PI*105);
    const right=points('right-leg'),left=points('left-leg');
    assert(right[4]-initialRight[4]>20,'the lifted foot should swing forward with travel');
    assert(Math.abs(left[4]-initialLeft[4])<2,'the planted foot should stay near its world position');
    for (const limb of [right,left]) {
      assert(Math.abs(Math.hypot(limb[2]-limb[0],limb[3]-limb[1])-17)<.01);
      assert(Math.abs(Math.hypot(limb[4]-limb[2],limb[5]-limb[3])-16)<.01);
    }
  } finally {
    for(const [key,descriptor] of Object.entries(originals))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  }
});
