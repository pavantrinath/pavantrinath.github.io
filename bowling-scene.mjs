// A small vector scene: the foreground arm is the bowler's left arm.
// One nine-second performance, then a quiet final frame beside the answers.
export function initBowlingScene(root) {
  if (!root) return;
  const svg = root.querySelector('svg');
  const replay = root.querySelector('button');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const get = name => svg.querySelector(`[data-part="${name}"]`);
  const parts = Object.fromEntries(['head','hair','torso','left-arm','right-arm','left-leg','right-leg','ball','desk','seat','shadow','caption','crease'].map(n => [n, get(n)]));
  let frame = 0, started = 0;
  const mix = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
  const ease = t => t*t*(3-2*t);
  // hip, shoulder, head, right elbow/hand, left elbow/hand, knees/feet
  const poses = {
    run: [0,79, 5,52, 7,39, -6,62,-15,51, 18,62,26,47, -13,94,-24,108, 16,94,29,101],
    bound: [0,68, 1,41, 1,28, 17,30,20,12, -13,27,-15,8, -4,87,-20,96, 21,78,23,95],
    coil: [0,78, 0,49, 0,35, 16,45,22,29, -15,38,-11,18, -16,92,-25,109, 18,94,29,110],
    release: [0,78, 10,49, 13,35, 25,64,23,78, 7,25,20,9, -12,96,-23,111, 19,94,31,111],
    follow: [0,78, 24,58, 31,46, 28,76,37,88, 40,67,48,82, -12,93,-24,109, 16,96,24,111],
    stand: [0,78, 0,50, 0,36, -8,66,-4,79, 9,64,8,79, -5,94,-8,111, 6,95,9,111],
    sit: [0,84, -2,57, 0,43, 10,72,28,73, 11,72,32,73, 18,85,19,109, 22,87,25,109]
  };
  function draw(ms) {
    let pose, x, ball = null;
    if (ms < 2600) {
      const t=ms/2600, stride=Math.sin(ms/115);
      pose=[...poses.run];
      pose[10]+=stride*8;pose[12]-=stride*8;pose[14]+=stride*13;pose[16]+=stride*16;pose[18]-=stride*13;pose[20]-=stride*16;
      pose=pose.map((n,i)=>i%2 ? n-Math.abs(stride)*4:n);
      x=32+t*92;
      ball=[x+pose[12],pose[13]];
    } else if(ms<3200) {
      pose=mix(poses.run,poses.bound,ease((ms-2600)/600));x=124+(ms-2600)/600*18;ball=[x+pose[12],pose[13]];
    } else if(ms<3650) {
      pose=mix(poses.bound,poses.coil,ease((ms-3200)/450));x=142;ball=[x+pose[12],pose[13]];
    } else if(ms<4050) {
      pose=mix(poses.coil,poses.release,ease((ms-3650)/400));x=142;ball=[x+pose[12],pose[13]];
    } else if(ms<4700) {
      const t=(ms-4050)/650;
      pose=mix(poses.release,poses.follow,ease(t));x=142;
      ball=[162+t*180,9+t*90*t];
    } else if(ms<5350) {
      pose=mix(poses.follow,poses.stand,ease((ms-4700)/650));x=142;
    } else if(ms<6600) {
      const t=(ms-5350)/1250, stride=Math.sin(t*Math.PI*6);
      pose=[...poses.stand];pose[14]+=stride*7;pose[16]+=stride*8;pose[18]-=stride*7;pose[20]-=stride*8;
      x=142+ease(t)*58;
    } else {
      pose=mix(poses.stand,poses.sit,ease(Math.min(1,(ms-6600)/600)));x=200;
      if(ms>7300 && ms<9000){const tap=Math.sin(ms/65)*1.5;pose[9]+=tap;pose[13]-=tap;}
    }
    const [hx,hy,sx,sy,cx,cy,rex,rey,rhx,rhy,lex,ley,lhx,lhy,rkx,rky,rfx,rfy,lkx,lky,lfx,lfy]=pose;
    const path=(name,points)=>parts[name].setAttribute('d',points.map(([px,py],i)=>`${i?'L':'M'}${x+px} ${py}`).join(' '));
    path('torso',[[hx,hy],[sx,sy]]);
    path('right-arm',[[sx,sy],[rex,rey],[rhx,rhy]]);
    path('left-arm',[[sx,sy],[lex,ley],[lhx,lhy]]);
    path('right-leg',[[hx,hy],[rkx,rky],[rfx,rfy],[rfx+7,rfy]]);
    path('left-leg',[[hx,hy],[lkx,lky],[lfx,lfy],[lfx+7,lfy]]);
    parts.head.setAttribute('cx',x+cx);parts.head.setAttribute('cy',cy);
    parts.hair.setAttribute('d',`M${x+cx-7} ${cy-2} Q${x+cx-6} ${cy-12} ${x+cx+5} ${cy-7}`);
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
