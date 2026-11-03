/* UI pieces are actual sleeping rigid bodies, rendered as original transparent artwork.
 * Matter is bundled locally; no CDN / network dependency at runtime.
 */
(() => {
  const {Engine,Composite,Bodies,Body,Constraint,Query,Sleeping,Events}=Matter;
  let manifestPromise;
  window.UIPlayground={mount({openPortfolio}){
    const zone=document.getElementById('ui-orb-zone'),orb=document.getElementById('liquid-orb');
    const stack=document.getElementById('orb-stack'),layer=document.getElementById('piece-layer');
    const recall=document.getElementById('asset-return');
    const shakeHint=document.getElementById('orb-shake-hint');
    const status=document.getElementById('playground-status'),hint=document.getElementById('physics-hint');
    const abort=new AbortController(),signal=abort.signal;
    const engine=Engine.create({enableSleeping:true,positionIterations:8,velocityIterations:8,constraintIterations:4});
    engine.gravity.y=1;engine.gravity.scale=.00105;
    let phase='ready',disposed=false,items=[],pieces=[],walls=[],width=0,height=0,frame=null,last=0,acc=0;
    let lastTap=null;
    let drag=null,orbDrag=null,spawnIndex=0,spawnAge=0,recallAge=0,collisions=0,pending=0,ballExit=-1;
    let animations=[];
    const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function listen(el,name,fn){el.addEventListener(name,fn,{signal});}
    function point(e){const r=zone.getBoundingClientRect();return {x:clamp(e.clientX-r.left,10,width-10),y:clamp(e.clientY-r.top,10,height-10)};}
    function positionOrb(x,y){orb.style.setProperty('--orb-x',`${x}px`);orb.style.setProperty('--orb-y',`${y}px`);}
    function bounds(){
      Composite.remove(engine.world,walls);
      width=zone.clientWidth;height=zone.clientHeight;
      walls=[Bodies.rectangle(width/2,height+35,width+150,80,{isStatic:true,friction:.7}),Bodies.rectangle(-36,height/2,80,height*4,{isStatic:true}),Bodies.rectangle(width+36,height/2,80,height*4,{isStatic:true}),Bodies.rectangle(width/2,-120,width+150,80,{isStatic:true})];
      Composite.add(engine.world,walls);
    }
    const resize=new ResizeObserver(()=>{
      const oldWidth=width,oldHeight=height;bounds();
      if(!oldWidth)return;
      const targetScale=layoutScale();
      for(const p of pieces){const next=targetScale/p.layoutScale;Body.scale(p.body,next,next);p.w*=next;p.h*=next;p.layoutScale=targetScale;p.el.style.width=p.w+'px';p.el.style.height=p.h+'px';Body.setPosition(p.body,{x:clamp(p.body.position.x*width/oldWidth,p.w/2+8,width-p.w/2-8),y:clamp(p.body.position.y*height/oldHeight,p.h/2+8,height-p.h/2-6)});Sleeping.set(p.body,false);}
    });resize.observe(zone);bounds();
    function layoutScale(){return clamp(Math.sqrt(width*height/(1200*660)),.56,1.13);}
    function createPiece(item,index,x,y,vx,vy){
      const scale=layoutScale();
      const ratio=item.width/item.height;
      // Visual bounds (transparent margins already trimmed), comfortable mixed sizes.
      const long=ratio>2?88:ratio<.8?88:62;
      const factor=long/Math.max(item.width,item.height)*scale;
      const w=Math.max(18,item.width*factor),h=Math.max(18,item.height*factor);
      const opts={label:item.id,restitution:.26,friction:.52,frictionStatic:.9,frictionAir:.009,density:.0018,sleepThreshold:75,slop:.03};
      const body=item.round?Bodies.circle(x,y,Math.min(w,h)*.49,opts):Bodies.rectangle(x,y,w*.96,h*.96,{...opts,chamfer:{radius:Math.min(4,w*.05,h*.05)}});
      Body.setAngle(body,(Math.random()-.5)*.65);
      const other=pieces.map(p=>p.body);
      const initial={x,y};
      for(let attempt=0;attempt<24&&Query.collides(body,other).length;attempt++){
        const col=(attempt%5)-2,row=Math.floor(attempt/5)+1;
        Body.setPosition(body,{x:clamp(initial.x+col*(w+9),w*.6+6,width-w*.6-6),y:clamp(initial.y-row*(h+10),h*.6+12,height-h*.6-12)});
      }
      Body.setVelocity(body,{x:vx,y:vy});Body.setAngularVelocity(body,(Math.random()-.5)*.16);
      const el=document.createElement('button');el.type='button';el.className='physics-piece';el.dataset.piece=item.id;el.setAttribute('aria-label',`${item.project==='vending'?'售货机':'画中灵'}：${item.label}，可拖动；方向键移动，空格抛起，回车查看`);el.style.width=w+'px';el.style.height=h+'px';el.style.setProperty('--piece-w',w+'px');
      const img=document.createElement('img');img.src=item.src;img.alt=item.label;img.draggable=false;el.append(img);layer.append(el);
      const p={body,el,item,w,h,layoutScale:scale,index};pieces.push(p);Composite.add(engine.world,body);
      listen(el,'pointerdown',e=>grab(e,p));
      listen(el,'keydown',e=>{
        if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){
          e.preventDefault();Sleeping.set(body,false);
          const v={...body.velocity};if(e.key==='ArrowLeft')v.x=-6;if(e.key==='ArrowRight')v.x=6;if(e.key==='ArrowUp'||e.key===' ')v.y=-10;if(e.key==='ArrowDown')v.y=5;Body.setVelocity(body,v);
        }else if(e.key==='Enter'){e.preventDefault();inspect(p);}
      });
      
      return p;
    }
    let origin={x:0,y:0}, impulse={x:0,y:0},assetsReady=false,loading=null,pendingRequest=null;
    function ensureAssets(){
      if(assetsReady)return Promise.resolve();
      if(loading)return loading;
      zone.dataset.assetsReady='loading';
      loading=(async()=>{
        if(!manifestPromise)manifestPromise=window.PLAYGROUND_ASSETS?Promise.resolve(window.PLAYGROUND_ASSETS):fetch('assets/playground/manifest.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).catch(e=>{manifestPromise=null;throw e;});
        const data=await manifestPromise;
        await Promise.all(data.map(item=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(new Error(item.src));im.src=item.src;})));
        if(disposed)return;
        items=data.map((item,i)=>({item,key:Math.sin((i+1)*97.13)})).sort((a,b)=>a.key-b.key).map(x=>x.item);
        assetsReady=true;zone.dataset.assetsReady='ready';
        if(pendingRequest){const r=pendingRequest;pendingRequest=null;enqueueBatch(r.at,r.velocity);}
      })().catch(e=>{loading=null;pendingRequest=null;if(!disposed){zone.dataset.assetsReady='error';status.textContent='素材尚未加载完成，再摇晃可重试';}throw e;});
      return loading;
    }
    function requestBatch(at,velocity){
      if(disposed||!['ready','partial'].includes(phase))return;
      if(!assetsReady){pendingRequest={at,velocity};status.textContent='正在准备素材';ensureAssets().catch(()=>{});return;}
      enqueueBatch(at,velocity);
    }
    function enqueueBatch(at,velocity){
      if(disposed||!['ready','partial'].includes(phase))return;
      // Inventory is consumed by the gesture itself, not by animation time.
      // A slow/throttled frame cannot merge, lose, or keep firing batches.
      pending=Math.min(6,items.length-spawnIndex);
      if(!pending)return;
      origin={x:clamp(at.x,70,width-70),y:clamp(at.y,75,height*.67)};impulse=velocity;
      phase='partial';hint.hidden=false;recall.hidden=false;
      shakeHint.textContent='继续摇晃 · 再撒出一些';
      status.textContent='已撒出一批，继续摇晃可撒出更多';
      while(pending>0)spawn();
      render();wake();
    }
    function spawn(){
      if(pending<=0||spawnIndex>=items.length)return;
      const i=spawnIndex++,withinBatch=6-pending;pending--;
      const spread=(withinBatch-2.5)*17*layoutScale();
      const x=clamp(origin.x+spread,48,width-48),y=origin.y+12+(withinBatch%2)*7;
      // A gentle sideways spill, with gravity doing most of the movement.
      createPiece(items[i],i,x,y,spread*.035+clamp(impulse.x*.14,-2.5,2.5),.4+(withinBatch%3)*.25+clamp(impulse.y*.08,-1,1));
      if(spawnIndex===items.length){
        pending=0;phase='scattered';ballExit=0;orbDrag=null;
        orb.classList.remove('is-grabbed');
        stack.classList.add('is-dissolving');
        animations.push(orb.animate([{scale:'1',opacity:1},{scale:'.82',opacity:.8,offset:.45},{scale:'.12',opacity:0}],{duration:reduced.matches?100:380,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}));
        status.textContent='素材已全部撒出，可拖动、双击查看或收回';
      }
    }
    // Load quietly before the first gesture. A gesture during loading stores
    // only one batch intent, never a queue for all remaining assets.
    ensureAssets().catch(()=>{});
    function grab(e,p){
      if(phase!=='scattered'&&phase!=='partial')return;
      if(e.button!==0||drag)return;e.preventDefault();
      const at=point(e);zone.setPointerCapture(e.pointerId);Sleeping.set(p.body,false);
      const a=p.body.angle,dx=at.x-p.body.position.x,dy=at.y-p.body.position.y;
      // Matter Constraint keeps the initial attachment vector in world orientation
      // and rotates it with body.angle - angleB on subsequent updates.
      const c=Constraint.create({pointA:at,bodyB:p.body,pointB:{x:dx,y:dy},angleB:a,length:0,stiffness:.38,damping:.18});
      Composite.add(engine.world,c);drag={id:e.pointerId,p,c,x:at.x,y:at.y,time:e.timeStamp,vx:0,vy:0,distance:0};p.el.classList.add('is-held');p.el.style.zIndex='100';status.textContent=`拿起：${p.item.label}`;
    }
    function finishDrag(e,cancelled=false){
      if(!drag||e.pointerId!==drag.id)return;
      const d=drag;drag=null;Composite.remove(engine.world,d.c);Sleeping.set(d.p.body,false);
      if(!cancelled){const stale=e.timeStamp-d.time>110;Body.setVelocity(d.p.body,{x:stale?0:clamp(d.vx,-18,18),y:stale?0:clamp(d.vy,-18,18)});Body.setAngularVelocity(d.p.body,clamp(d.vx*.012,-.16,.16));}
      d.p.el.classList.remove('is-held');d.p.el.style.zIndex='';status.textContent='拖起、松手，看看零件如何落下';
      if(!cancelled && d.distance<8){if(lastTap && lastTap.p===d.p && e.timeStamp-lastTap.time<420){lastTap=null;inspect(d.p);}else lastTap={p:d.p,time:e.timeStamp};}else lastTap=null;
    }
    listen(zone,'pointermove',e=>{
      const at=point(e);
      if(drag&&drag.id===e.pointerId){const dt=Math.max(8,e.timeStamp-drag.time);drag.distance+=Math.hypot(at.x-drag.x,at.y-drag.y);drag.vx=(at.x-drag.x)/dt*16.667;drag.vy=(at.y-drag.y)/dt*16.667;Object.assign(drag,{x:at.x,y:at.y,time:e.timeStamp});drag.c.pointA=at;Sleeping.set(drag.p.body,false);return;}
      if(!orbDrag||e.pointerId!==orbDrag.id)return;
      const d=orbDrag,dt=Math.max(8,e.timeStamp-d.time),dx=e.clientX-d.lastX;
      d.distance+=Math.hypot(e.clientX-d.lastX,e.clientY-d.lastY);
      d.vx=dx/dt*16.667;d.vy=(e.clientY-d.lastY)/dt*16.667;d.lastX=e.clientX;d.lastY=e.clientY;d.time=e.timeStamp;
      positionOrb(clamp(e.clientX-d.x,-width*.30,width*.30),clamp(e.clientY-d.y,-height*.22,height*.20));orb.style.rotate=`${clamp((e.clientX-d.x)*.05,-12,12)}deg`;
      if(d.meter.push(e.clientX,e.clientY,e.timeStamp))requestBatch(at,{x:d.vx,y:d.vy});
    });
    listen(orb,'pointerdown',e=>{
      if(!['ready','partial'].includes(phase)||e.button!==0)return;
      e.preventDefault();orb.setPointerCapture(e.pointerId);
      orbDrag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:e.timeStamp,distance:0,vx:0,vy:0,meter:ShakeMeter.create(e.clientX,e.clientY,e.timeStamp)};
      orb.classList.add('is-grabbed');
    });
    function finishOrb(e,cancelled=false){if(!orbDrag||orbDrag.id!==e.pointerId)return;const d=orbDrag;orbDrag=null;positionOrb(0,0);orb.style.rotate='0deg';orb.classList.remove('is-grabbed');if(!cancelled&&d.distance<9)openPortfolio();}
    listen(zone,'pointerup',e=>{finishDrag(e);finishOrb(e);});
    listen(zone,'pointercancel',e=>{finishDrag(e,true);finishOrb(e,true);});
    listen(orb,'keydown',e=>{
      if(!['ready','partial'].includes(phase))return;
      if(e.key==='Enter'){e.preventDefault();openPortfolio();}
      if(e.key===' '){e.preventDefault();const r=orb.getBoundingClientRect(),z=zone.getBoundingClientRect();requestBatch({x:r.left-z.left+r.width/2,y:r.top-z.top+r.height/2},{x:0,y:0});}
    });
    listen(recall,'click',()=>{
      if(!['scattered','partial'].includes(phase)||!pieces.length)return;
      if(drag)finishDrag({pointerId:drag.id,timeStamp:performance.now()},true);
      closeInspect();pending=0;pendingRequest=null;orbDrag=null;stack.hidden=true;positionOrb(0,0);orb.style.rotate='0deg';orb.classList.remove('is-grabbed');phase='recalling';recallAge=0;recall.disabled=true;hint.hidden=true;
      for(const p of pieces){p.from={x:p.body.position.x,y:p.body.position.y,angle:p.body.angle};Body.setStatic(p.body,true);}
      status.textContent='素材正在汇聚';zone.classList.add('is-gathering');wake();
    });
    // A lightweight native dialog lets every small original be inspected without
    // turning the physics field into cards or replacing the portfolio reader.
    const dialog=document.getElementById('piece-inspector');
    function inspect(p){if(phase!=='scattered'&&phase!=='partial')return;dialog.querySelector('img').src=p.item.src;dialog.querySelector('img').alt=p.item.label;dialog.querySelector('figcaption').textContent=(p.item.project==='vending'?'售货机 · ':'画中灵 · ')+p.item.label;dialog.showModal();}
    function closeInspect(){if(dialog.open)dialog.close();}
    listen(document.getElementById('piece-inspector-close'),'click',closeInspect);
    listen(dialog,'click',e=>{if(e.target===dialog)closeInspect();});
    Events.on(engine,'collisionStart',e=>{collisions+=e.pairs.length;});
    function render(){
      for(const p of pieces){const {x,y}=p.body.position;p.el.style.transform=`translate(${x-p.w/2}px,${y-p.h/2}px) rotate(${p.body.angle}rad)`;}
      // DOM diagnostics are passive, also useful to QA a packaged offline site.
      zone.dataset.phase=phase;zone.dataset.pieces=pieces.length;zone.dataset.collisions=collisions;zone.dataset.remaining=assetsReady?items.length-spawnIndex:'loading';zone.dataset.pending=pending;
    }
    function step(dt){
      if((phase==='partial'||phase==='scattered')&&pieces.length){
        Engine.update(engine,1000/60);
        // Catch rare high-speed solver escapes at a browser resize / corner.
        for(const p of pieces){const b=p.body,margin=Math.max(p.w,p.h)*.55;if(b.position.y>height+margin||b.position.x < -margin||b.position.x>width+margin){Body.setPosition(b,{x:clamp(b.position.x,margin,width-margin),y:Math.min(height-margin,Math.max(margin,b.position.y))});Body.setVelocity(b,{x:0,y:0});}}
      }else if(phase==='recalling'){
        recallAge+=dt;const center={x:width*.5,y:height*.42};
        for(const p of pieces){const delay=(p.index%12)*22,duration=reduced.matches?180:1040;const t=clamp((recallAge-delay)/duration,0,1),smooth=t*t*(3-2*t),arc=Math.sin(t*Math.PI)*(p.index%2?1:-1)*55;
          const x=p.from.x+(center.x-p.from.x)*smooth+arc,y=p.from.y+(center.y-p.from.y)*smooth-Math.sin(t*Math.PI)*70;
          p.el.style.transform=`translate(${x-p.w/2}px,${y-p.h/2}px) rotate(${p.from.angle*(1-smooth)}rad) scale(${1-.96*smooth})`;p.el.style.opacity=String(1-smooth);p.el.style.filter=`blur(${smooth*4}px)`;
        }
        if(recallAge>430&&stack.hidden){stack.hidden=false;stack.classList.remove('is-dissolving');orb.classList.remove('is-grabbed');positionOrb(0,0);orb.style.rotate='0deg';for(const a of animations)a.cancel();animations=[];animations.push(orb.animate([{transform:'scale(.12)',opacity:0,filter:'blur(8px)'},{transform:'scale(1.025,.98)',opacity:1,filter:'blur(0)'},{transform:'scale(1)',opacity:1}],{duration:reduced.matches?180:1100,easing:'cubic-bezier(.2,.75,.25,1)'}));}
        if(recallAge>1600){for(const p of pieces)p.el.remove();pieces=[];Composite.clear(engine.world,false);Engine.clear(engine);bounds();phase='ready';spawnIndex=0;pending=0;spawnAge=0;ballExit=-1;recall.hidden=true;recall.disabled=false;shakeHint.textContent='按住球体，来回摇晃，撒出素材';status.textContent='素材已收回';zone.classList.remove('is-gathering');}
      }
      if(phase!=='recalling')render();else{zone.dataset.phase=phase;zone.dataset.pieces=pieces.length;}
    }
    function tick(now){
      frame=null;if(disposed||document.hidden)return;
      const elapsed=last?now-last:16.667;last=now;
      // Recall is a visual transition: use visible wall time, independently of
      // the fixed-step physics budget, so low frame rates cannot stretch it.
      if(phase==='recalling'){step(elapsed);acc=0;}
      else{acc+=Math.min(elapsed,50);while(acc>=1000/60){step(1000/60);acc-=1000/60;}}
      if(ballExit>=0&&phase==='scattered'){ballExit+=elapsed;if(ballExit>400){stack.hidden=true;ballExit=-1;}}
      frame=requestAnimationFrame(tick);
    }
    function wake(){if(disposed||document.hidden||frame!==null)return;last=0;frame=requestAnimationFrame(tick);}
    listen(document,'visibilitychange',()=>{if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;acc=0;}else wake();});
    wake();
    return ()=>{disposed=true;abort.abort();resize.disconnect();if(frame!==null)cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());closeInspect();Composite.clear(engine.world,false);Engine.clear(engine);pieces=[];};
  }};
})();
