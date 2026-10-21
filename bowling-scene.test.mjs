import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initBowlingScene } from './bowling-scene.mjs';

test('fast left-arm run-up has flight phases, planted-foot traction and a straight release', () => {
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
    callback(70);
    const plantedRight=points('right-leg');
    assert(Math.abs(plantedRight[4]-initialRight[4])<.01,'a planted running foot should stay fixed in world space');
    callback(300);
    const right=points('right-leg'),left=points('left-leg');
    assert(right[4]-initialRight[4]>10,'the recovering foot should advance with a faster run-up');
    callback(180);
    assert(points('right-leg')[5]<111&&points('left-leg')[5]<111,'both feet leave the ground during a running stride');
    for (const limb of [right,left]) {
      assert(Math.abs(Math.hypot(limb[2]-limb[0],limb[3]-limb[1])-17)<.01);
      assert(Math.abs(Math.hypot(limb[4]-limb[2],limb[5]-limb[3])-16)<.01);
    }

    for(const ms of [0,150,350,700,1200,1650]){
      callback(ms);
      const hipY=points('torso')[1];
      for(const name of ['left-arm','right-arm']){
        const arm=points(name);
        assert(arm[3]>=hipY-12 && arm[3]<=hipY+1,'running elbows stay beside the waist');
        assert(arm[5]>=hipY-15 && arm[5]<=hipY+2,'running hands stay near waist height');
        assert(Math.abs(Math.hypot(arm[2]-arm[0],arm[3]-arm[1])-21)<.01);
        assert(Math.abs(Math.hypot(arm[4]-arm[2],arm[5]-arm[3])-16)<.01);
      }
    }
    for(const ms of [0,500,1700,1960,2180,2399]){
      callback(ms);
      const leftHand=points('left-arm');
      const heldBall=parts.get('[data-part="ball"]').attrs;
      assert(Math.abs(Number(heldBall.cx)-leftHand[4])<.001,'the ball stays in the left hand');
      assert(Math.abs(Number(heldBall.cy)-leftHand[5])<.001,'the ball stays in the left hand');
    }
    callback(2400);
    const arm=points('left-arm');
    const upper=[arm[2]-arm[0],arm[3]-arm[1]];
    const fore=[arm[4]-arm[2],arm[5]-arm[3]];
    assert(Math.abs(upper[0]*fore[1]-upper[1]*fore[0])<.001,'bowling elbow is straight at release');
    assert(upper[0]*fore[0]+upper[1]*fore[1]>0,'the elbow extends toward the release hand');
    const ball=parts.get('[data-part="ball"]').attrs;
    assert(Math.abs(Number(ball.cx)-arm[4])<.001);
    assert(Math.abs(Number(ball.cy)-arm[5])<.001);
  } finally {
    for(const [key,descriptor] of Object.entries(originals))if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  }
});
