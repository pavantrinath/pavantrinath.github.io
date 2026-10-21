// A small vector scene: the foreground arm is the bowler's left arm.
// One nine-second performance, then a quiet final frame beside the answers.
export function initBowlingScene(root) {
  if (!root) return;
  const svg = root.querySelector('svg');
  const replay = root.querySelector('button');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const get = name => svg.querySelector(`[data-part="${name}"]`);
  const parts = Object.fromEntries(['head','eye','torso','left-arm','right-arm','left-leg','right-leg','ball','desk','seat','shadow','caption','crease'].map(n => [n, get(n)]));
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
  function gait(ms, walking=false) {
    const pose=[...(walking?poses.stand:poses.run)];
    const phase=ms/(walking?160:105);
    pose[1]-=Math.abs(Math.sin(phase))*(walking?.5:1.5);
    const bounce=pose[1]-(walking?poses.stand[1]:poses.run[1]);
    for(let i=3;i<14;i+=2)pose[i]+=bounce;
    for(const [offset,shift] of [[14,0],[18,Math.PI]]) {
      const angle=phase+shift;
      // Swinging feet travel forward; planted feet move backward relative
      // to the advancing hips. The old sign made the figure moonwalk.
      const fx=-Math.cos(angle)*(walking?7:6);
      const fy=112-Math.max(0,Math.sin(angle))*(walking?5:12);
      const dx=fx-pose[0],dy=fy-pose[1],distance=Math.hypot(dx,dy);
      const along=(17*17-16*16+distance*distance)/(2*distance);
      const bend=Math.sqrt(Math.max(0,17*17-along*along));
      pose[offset]=pose[0]+dx/distance*along+dy/distance*bend;
      pose[offset+1]=pose[1]+dy/distance*along-dx/distance*bend;
      pose[offset+2]=fx;pose[offset+3]=fy;
    }
    // Bent elbows swing beside the waist during the run-up, rather than
    // lifting the hands toward the face. Opposing shoulders drive the swing.
    for(const [offset,shift] of [[6,0],[10,Math.PI]]) {
      const angle=Math.cos(phase+shift)*(walking?.25:.5);
      const elbowX=pose[2]+Math.sin(angle)*21;
      const elbowY=pose[3]+Math.cos(angle)*21;
      const forearmAngle=walking?.9:-.12+angle*.15;
      pose[offset]=elbowX;pose[offset+1]=elbowY;
      pose[offset+2]=elbowX+Math.cos(forearmAngle)*16;
      pose[offset+3]=elbowY+Math.sin(forearmAngle)*16;
    }
    return pose;
  }
  function draw(ms) {
    let pose, x, ball = null;
    if (ms < 2600) {
      const t=ms/2600;
      pose=gait(ms);
      x=32+t*92;
      ball=[x+pose[12],pose[13]];
    } else if(ms<3200) {
      pose=mix(gait(2600),poses.bound,ease((ms-2600)/600));x=124+(ms-2600)/600*18;ball=[x+pose[12],pose[13]];
    } else if(ms<3650) {
      pose=mix(poses.bound,poses.coil,ease((ms-3200)/450));x=142;ball=[x+pose[12],pose[13]];
    } else if(ms<4050) {
      pose=mix(poses.coil,poses.release,ease((ms-3650)/400));x=142;ball=[x+pose[12],pose[13]];
    } else if(ms<4700) {
      const t=(ms-4050)/650;
      pose=mix(poses.release,poses.follow,ease(t));x=142;
      ball=[159+t*180,14+t*90*t];
    } else if(ms<5350) {
      pose=mix(poses.follow,poses.stand,ease((ms-4700)/650));x=142;
    } else if(ms<6600) {
      const t=(ms-5350)/1250;
      const blend=Math.min(1,t*8,(1-t)*8);
      pose=mix(poses.stand,gait(ms-5350,true),ease(blend));
      x=142+ease(t)*58;
    } else {
      pose=mix(poses.stand,poses.sit,ease(Math.min(1,(ms-6600)/600)));x=200;
      if(ms>7300 && ms<9000){const tap=Math.sin(ms/65)*1.5;pose[9]+=tap;pose[13]-=tap;}
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
    const deskOpacity=Math.max(0,Math.min(1,(ms-4950)/550));
    parts.desk.setAttribute('opacity',deskOpacity);parts.seat.setAttribute('opacity',deskOpacity);
    parts.crease.setAttribute('opacity',1-deskOpacity);
    parts.caption.textContent=ms<3200?'left-arm pace':ms<5000?'release. follow through.':ms<7200?'switching disciplines…':'different pitch. same delivery.';
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
