// A small vector scene: the foreground arm is the bowler's left arm.
// One nine-second performance, then a quiet final frame beside the answers.
export function initBowlingScene(root) {
  if (!root) return;
  const svg = root.querySelector('svg');
  const replay = root.querySelector('button');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const get = name => svg.querySelector(`[data-part="${name}"]`);
  const parts = Object.fromEntries(['head','eye','torso','left-arm','right-arm','left-leg','right-leg','ball','desk','seat','shadow','caption','crease'].map(n => [n, get(n)]));
  parts['left-arm'].setAttribute('stroke','#325c47');
  parts['left-arm'].setAttribute('stroke-width','3.75');
  parts['right-arm'].setAttribute('stroke','#829085');
  let frame = 0, started = 0;
  const mix = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
  const ease = t => t*t*(3-2*t);
  // hip, shoulder, head, right elbow/hand, left elbow/hand, knees/feet
  const poses = {
    run: [0,79, 5,52, 7,39, -6,62,-15,51, 18,62,26,47, -13,94,-24,108, 16,94,29,101],
    bound: [0,68, 3,41, 5,28, 13,30,17,13, -13,53,-20,63, -4,87,-20,96, 21,78,23,95],
    coil: [0,78, 2,49, 4,35, 16,35,20,18, -18,37,-12,18, 16,94,28,111, -13,92,-22,108],
    release: [0,78, 9,49, 13,35, 19,65,12,78, 13,29,17,9, 17,94,29,111, -12,92,-22,108],
    follow: [4,78, 26,58, 32,46, 24,76,13,86, 38,72,21,87, 18,94,29,111, -10,88,-20,76],
    stand: [0,78, 0,50, 0,36, -8,66,-4,79, 9,64,8,79, -5,94,-8,111, 6,95,9,111],
    sit: [0,84, -2,57, 0,43, 10,72,28,73, 11,72,32,73, 18,85,19,109, 22,87,25,109]
  };
  // Shorter legs, with a fixed-length thigh and shin instead of stretching
  // each joint independently. The feet alternate contact with the ground.
  for (const pose of Object.values(poses)) {
    const hip = pose[1];
    for (let i=1;i<14;i+=2) pose[i]+=5;
    for (let i=14;i<22;i+=2) {
      pose[i]*=.65;
      pose[i+1]=hip+5+(pose[i+1]-hip)*.85;
    }
  }
  // A running stride has a short stance and an airborne interval; it is
  // not a walking cycle with one foot permanently touching the ground.
  const runEnd=1700, boundEnd=1960, coilEnd=2180, releaseAt=2400;
  const followEnd=2850, recoverEnd=3200, deskRunEnd=4050;
  function gait(ms,speed=92/runEnd) {
    const pose=[...poses.run];
    const cycle=420, duty=.38;
    const u=(ms/cycle)%1;
    const flight=(u>=duty&&u<.5)||(u>=.5+duty);
    const flightT=u<.5?(u-duty)/(.5-duty):(u-.5-duty)/(.5-duty);
    const lift=flight?Math.sin(Math.PI*flightT)*5:0;
    pose[1]-=lift;
    for(let i=3;i<14;i+=2)pose[i]-=lift;
    // Forward lean and a higher heel recovery make the pace legible at
    // this tiny scale. Stance travel matches world travel to avoid sliding.
    pose[2]+=6;pose[4]+=7;
    const stanceTravel=speed*cycle*duty;
    for(const [offset,shift] of [[14,0],[18,.5]]) {
      const phase=(u+shift)%1;
      const planted=phase<duty;
      const t=planted?phase/duty:(phase-duty)/(1-duty);
      const fx=planted?stanceTravel/2-stanceTravel*t:-stanceTravel/2+stanceTravel*ease(t);
      const fy=planted?112:112-Math.sin(Math.PI*t)*22;
      const dx=fx-pose[0],dy=fy-pose[1],distance=Math.hypot(dx,dy);
      const along=(17*17-16*16+distance*distance)/(2*distance);
      const bend=Math.sqrt(Math.max(0,17*17-along*along));
      pose[offset]=pose[0]+dx/distance*along+dy/distance*bend;
      pose[offset+1]=pose[1]+dy/distance*along-dx/distance*bend;
      pose[offset+2]=fx;pose[offset+3]=fy;
    }
    for(const [offset,shift] of [[6,0],[10,Math.PI]]) {
      const angle=Math.cos(u*Math.PI*2+shift)*.5;
      const elbowX=pose[2]+Math.sin(angle)*21;
      const elbowY=pose[3]+Math.cos(angle)*21;
      const forearmAngle=-.12+angle*.15;
      pose[offset]=elbowX;pose[offset+1]=elbowY;
      pose[offset+2]=elbowX+Math.cos(forearmAngle)*16;
      pose[offset+3]=elbowY+Math.sin(forearmAngle)*16;
    }
    return pose;
  }
  function draw(ms) {
    let pose, x, ball = null;
    if (ms < runEnd) {
      pose=gait(ms);x=32+ms/runEnd*92;
      ball=[x+pose[12],pose[13]];
    } else if(ms<boundEnd) {
      const t=(ms-runEnd)/(boundEnd-runEnd);
      pose=mix(gait(runEnd),poses.bound,ease(t));x=124+t*18;
      ball=[x+pose[12],pose[13]];
    } else if(ms<coilEnd) {
      pose=mix(poses.bound,poses.coil,ease((ms-boundEnd)/(coilEnd-boundEnd)));x=142;
      ball=[x+pose[12],pose[13]];
    } else if(ms<releaseAt) {
      pose=mix(poses.coil,poses.release,ease((ms-coilEnd)/(releaseAt-coilEnd)));x=142;
      ball=[x+pose[12],pose[13]];
    } else if(ms<followEnd) {
      const t=(ms-releaseAt)/(followEnd-releaseAt);
      pose=mix(poses.release,poses.follow,ease(t));x=142;
      ball=[159+t*180,14+t*90*t];
    } else if(ms<recoverEnd) {
      pose=mix(poses.follow,poses.stand,ease((ms-followEnd)/(recoverEnd-followEnd)));x=142;
    } else if(ms<deskRunEnd) {
      const t=(ms-recoverEnd)/(deskRunEnd-recoverEnd);
      const blend=Math.min(1,t*8,(1-t)*8);
      pose=mix(poses.stand,gait(ms-recoverEnd,58/(deskRunEnd-recoverEnd)),ease(blend));
      x=142+t*58;
    } else {
      pose=mix(poses.stand,poses.sit,ease(Math.min(1,(ms-deskRunEnd)/600)));x=200;
      if(ms>4700 && ms<9000){const tap=Math.sin(ms/65)*1.5;pose[9]+=tap;pose[13]-=tap;}
    }
    const [hx,hy,sx,sy,cx,cy,rex,rey,rhx,rhy,lex,ley,lhx,lhy,rkx,rky,rfx,rfy,lkx,lky,lfx,lfy]=pose;
    const path=(name,points)=>parts[name].setAttribute('d',points.map(([px,py],i)=>`${i?'L':'M'}${x+px} ${py}`).join(' '));
    path('torso',[[hx,hy],[sx,sy],[cx,cy+7.5]]);
    path('right-arm',[[sx,sy],[rex,rey],[rhx,rhy]]);
    path('left-arm',[[sx,sy],[lex,ley],[lhx,lhy]]);
    path('right-leg',[[hx,hy],[rkx,rky],[rfx,rfy],[rfx+7,rfy]]);
    path('left-leg',[[hx,hy],[lkx,lky],[lfx,lfy],[lfx+7,lfy]]);
    parts.head.setAttribute('cx',x+cx);parts.head.setAttribute('cy',cy);
    parts.eye.setAttribute('cx',x+cx+3);parts.eye.setAttribute('cy',cy-1);
    parts.shadow.setAttribute('cx',x+3);
    parts.ball.setAttribute('opacity',ball?1:0);
    if(ball){parts.ball.setAttribute('cx',ball[0]);parts.ball.setAttribute('cy',ball[1]);}
    const deskOpacity=Math.max(0,Math.min(1,(ms-3000)/400));
    parts.desk.setAttribute('opacity',deskOpacity);parts.seat.setAttribute('opacity',deskOpacity);
    parts.crease.setAttribute('opacity',1-deskOpacity);
    parts.caption.textContent=ms<boundEnd?'left-arm fast bowling':ms<recoverEnd?'left-arm release. follow through.':ms<4650?'switching disciplines…':'different pitch. same delivery.';
  }
  function stop(){cancelAnimationFrame(frame);frame=0;root.removeAttribute('data-playing');replay.textContent='↻ Replay';replay.setAttribute('aria-label','Replay bowling and coding animation');}
  function tick(now){const elapsed=Math.min(now-started,9000);draw(elapsed);if(elapsed<9000)frame=requestAnimationFrame(tick);else stop();}
  function play(){stop();if(motion.matches){draw(9000);return;}root.setAttribute('data-playing','');replay.textContent='Ⅱ Pause';replay.setAttribute('aria-label','Pause animation');started=performance.now();draw(0);frame=requestAnimationFrame(tick);}
  replay.addEventListener('click',()=>{if(frame){stop();return;}play();});
  motion.addEventListener('change',()=>{stop();draw(9000);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();draw(9000);}});
  // Reduced motion stays on the finished coding scene, without an autoplay.
  if(motion.matches)draw(9000);else play();
}
