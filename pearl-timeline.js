/* One visible-home clock owns BOTH gradient travel and envelope.
 * Travel curves and envelope keyframes are the Round 8 originals in seconds.
 * Only silent gaps change: Round 10 .8/.55/.95s -> Round 11 .7/.5/.85s.
 * Leaving home or hiding the document freezes phase, never resets it.
 */
(() => {
  const cycle = 23.158;
  const zones = [
    {name:'top', start:0, travel:5.4, delta:[-520,192], keys:[[0,0],[.192,0],[.36,.48],[.84,.92],[5.208,.94],[6,0]]},
    {name:'main', start:6.7, travel:7.2, delta:[-980,525], keys:[[0,0],[.3,0],[.6,.5],[1.008,.92],[7.08,.94],[8.1,0]]},
    {name:'bottom', start:15.3, travel:6.3, delta:[-898,237], keys:[[0,0],[.3,0],[.6,.5],[.9,.92],[6.3,.93],[7.008,0]]}
  ].map(z=>({...z, node:document.querySelector(`.sheen-${z.name}`), gradients:['wide','core'].map(k=>document.getElementById(`sheen-${z.name}-${k}`))}));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let home=false, running=false, phase=0, last=0, frame=null;
  // Exact SMIL cubic-bezier(.42,0,.58,1), not a new travel curve.
  function ease(x){
    let lo=0,hi=1,t=x;
    for(let i=0;i<18;i++){
      t=(lo+hi)/2;
      const bx=3*(1-t)*(1-t)*t*.42+3*(1-t)*t*t*.58+t*t*t;
      if(bx<x)lo=t;else hi=t;
    }
    return 3*(1-t)*t*t+t*t*t;
  }
  function paint(){
    for(const z of zones){
      const age=phase-z.start, keys=z.keys;
      let opacity=0;
      if(age>=0 && age<keys[keys.length-1][0]){
        for(let i=1;i<keys.length;i++)if(age<=keys[i][0]){
          const [a,av]=keys[i-1],[b,bv]=keys[i];
          opacity=av+(bv-av)*(age-a)/(b-a);break;
        }
      }
      const travel=ease(Math.max(0,Math.min(1,age/z.travel)));
      // Position and visibility are committed in the same animation frame.
      for(const g of z.gradients)g.setAttribute('gradientTransform',`translate(${z.delta[0]*travel} ${z.delta[1]*travel})`);
      z.node.style.opacity=String(opacity);
    }
  }
  function tick(now){
    frame=null;
    if(!running)return;
    phase=(phase+(now-last)/1000)%cycle;last=now;
    paint();frame=requestAnimationFrame(tick);
  }
  function sync(){
    const next=home && !document.hidden && !reduced.matches;
    if(next===running)return;
    const now=performance.now();
    if(running){phase=(phase+(now-last)/1000)%cycle;paint();}
    running=next;
    if(frame!==null){cancelAnimationFrame(frame);frame=null;}
    if(running){last=now;paint();frame=requestAnimationFrame(tick);}
    else if(reduced.matches)for(const z of zones)z.node.style.opacity='0';
  }
  window.pearlTimeline=Object.freeze({setHome(value){home=value;sync();}});
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pagehide',()=>{home=false;sync();});
  window.addEventListener('pageshow',()=>{home=!document.getElementById('home-screen').hidden;sync();});
  reduced.addEventListener('change',sync);
  paint();
})();
