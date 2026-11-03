/* Shallow white nacre relief with local pointer displacement.
 * Canvas2D keeps the verified appearance identical without a WebGL requirement.
 * This is a painted light field, not a claim of full Navier–Stokes simulation.
 */
(() => {
  let canvas,ctx,frame=null,last=0,active=false,resizeObserver;
  let pointer=[-.5,-.5],ripples=[],start=performance.now(),lastInput=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function setup(){
    canvas=document.getElementById('pearl-surface');if(!canvas)return false;
    ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return false;
    canvas.dataset.renderer='canvas2d';resizeObserver=new ResizeObserver(size);resizeObserver.observe(document.documentElement);size();return true;
  }
  function size(){if(!ctx)return;const scale=Math.min(devicePixelRatio||1,1.25)*.75;canvas.width=Math.max(1,Math.round(innerWidth*scale));canvas.height=Math.max(1,Math.round(innerHeight*scale));}
  function drawPainted(now){
    const w=canvas.width,h=canvas.height,t=reduced.matches?0:(now-start)/1000;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
    const wash=ctx.createLinearGradient(0,0,w,h);wash.addColorStop(0,'#ffffff');wash.addColorStop(.5,'#f9fbff');wash.addColorStop(1,'#ffffff');ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
    
    const drift=Math.sin(t*.08)*h*.014;
    // Three broad, irregular pearl folds. Each has a cool shallow shadow,
    // a neutral white crest and a thin reflected edge; never coloured fog.
    const paths=[[-.10,.21,.21,-.04,.57,.18,1.12,.04],[-.12,.93,.30,.54,.76,1.15,1.13,.61],[.76,-.15,.50,.25,1.16,.38,.95,.74]];
    function curve(v,offset){
      ctx.beginPath();
      for(let j=0;j<=68;j++){
        const q=j/68,u=1-q;
        let x=(u*u*u*v[0]+3*u*u*q*v[2]+3*u*q*q*v[4]+q*q*q*v[6])*w;
        let y=(u*u*u*v[1]+3*u*u*q*(v[3]+drift/h)+3*u*q*q*(v[5]-drift/h)+q*q*q*v[7])*h+offset;
        const dx=(3*u*u*(v[2]-v[0])+6*u*q*(v[4]-v[2])+3*q*q*(v[6]-v[4]))*w;
        const dy=(3*u*u*(v[3]-v[1])+6*u*q*(v[5]-v[3])+3*q*q*(v[7]-v[5]))*h;
        const length=Math.hypot(dx,dy)||1;
        for(const r of ripples){const age=t-r.t,dist=Math.hypot(x-r.x*w,y-r.y*h)/h;const wave=Math.sin(dist*19-age*4.5)*Math.exp(-age*.9-dist*5)*h*.012;x+=-dy/length*wave;y+=dx/length*wave;}
        if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
    }
    ctx.lineCap='round';
    for(const v of paths){
      ctx.save();ctx.globalAlpha=.56;ctx.filter='blur(16px)';curve(v,h*.012);ctx.strokeStyle='#dbe6f6';ctx.lineWidth=h*.066;ctx.stroke();
      ctx.filter='blur(6px)';curve(v,0);ctx.strokeStyle='#f8fbff';ctx.lineWidth=h*.047;ctx.stroke();
      ctx.filter='blur(2px)';curve(v,-h*.009);ctx.strokeStyle='#ffffff';ctx.lineWidth=h*.014;ctx.stroke();
      ctx.globalAlpha=.32;curve(v,h*.027);ctx.strokeStyle='#d6e2f4';ctx.lineWidth=1;ctx.stroke();ctx.restore();
    }
    const veil=ctx.createRadialGradient(w*.48,h*.48,0,w*.48,h*.48,w*.62);veil.addColorStop(0,'rgba(255,255,255,.72)');veil.addColorStop(.65,'rgba(255,255,255,.18)');veil.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=veil;ctx.fillRect(0,0,w,h);
  }

  function tick(now){frame=null;if(!active||document.hidden)return;if(now-last>(ripples[0]&&(now-start)/1000-ripples[0].t<4?66:125)){drawPainted(now);last=now;}if(!reduced.matches)frame=requestAnimationFrame(tick);}
  function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;}
  function sync(){stop();if(!active||document.hidden)return;if(!ctx&&!setup())return;drawPainted(performance.now());if(!reduced.matches)frame=requestAnimationFrame(tick);}
  document.addEventListener('pointermove',e=>{
    if(!active||reduced.matches||document.hidden)return;const now=performance.now();if(now-lastInput<110)return;
    const x=e.clientX/innerWidth,y=e.clientY/innerHeight;
    if(Math.hypot(x-pointer[0],y-pointer[1])<.035)return;
    lastInput=now;pointer=[x,y];ripples.unshift({x,y,t:(now-start)/1000});ripples.length=Math.min(ripples.length,4);
  },{passive:true});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',sync);
  window.pearlSurface={setActive(value){active=value;sync();}};
})();
