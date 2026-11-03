/* One qualified swing is a long stroke followed by a deliberate reversal.
 * No timer emits further swings; small jitter and one-way dragging emit none. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShakeMeter=api;})(typeof window==='object'?window:this,()=>({
  create(x,y,time=0){
    let axis=null,startX=x,startY=y,legStart=0,peak=0,dir=0,lastStroke=-Infinity;
    return {push(x,y,t){
      if(!axis){if(Math.hypot(x-startX,y-startY)<22)return null;axis=Math.abs(x-startX)>=Math.abs(y-startY)?'x':'y';legStart=axis==='x'?startX:startY;peak=legStart;}
      const v=axis==='x'?x:y;
      if(!dir){if(Math.abs(v-peak)<8)return null;dir=Math.sign(v-peak);peak=v;return null;}
      if((v-peak)*dir>=0){peak=v;return null;}
      if(Math.abs(v-peak)<18)return null;
      const span=Math.abs(peak-legStart),next=-dir;legStart=peak;peak=v;dir=next;
      if(span<56||t-lastStroke<120)return null;
      lastStroke=t;return {axis,span,direction:next};
    }};
  }
}));
