/* Mini-jeu de surf : gestes tactiles (pointer events) -> objet d’entrée du modèle. Seuils en pixels CSS. */
(function(root){
  'use strict';
  const DEAD=10,RANGE=70,TAP_MS=250,HOLD_MS=220,DBL_MS=320,DBL_PX=60,CUT_MS=380,CUT_MIN=26,CUT_MAX=110;
  function attach(canvas,inp){
    const g={id:-1,x0:0,y0:0,t0:0,x:0,y:0,drag:false,lastTapT:-9999,lastTapX:0,lastTapY:0,on:true};
    function down(e){
      if(!g.on||g.id!==-1)return;
      g.id=e.pointerId;g.x0=g.x=e.clientX;g.y0=g.y=e.clientY;g.t0=e.timeStamp;g.drag=false;
      try{canvas.setPointerCapture(e.pointerId);}catch(_){}
      e.preventDefault();
    }
    function move(e){
      if(e.pointerId!==g.id)return;
      g.x=e.clientX;g.y=e.clientY;
      const dx=g.x-g.x0,dy=g.y-g.y0;
      if(!g.drag&&dx*dx+dy*dy>DEAD*DEAD)g.drag=true;
      if(g.drag){
        const ax=dx>0?dx-DEAD:dx+DEAD,ay=dy>0?dy-DEAD:dy+DEAD;
        let mx=Math.abs(dx)>DEAD?ax/RANGE:0,my=Math.abs(dy)>DEAD?-ay/RANGE:0;
        inp.mx=mx>1?1:mx<-1?-1:mx;inp.my=my>1?1:my<-1?-1:my;inp.hold=false;
      }
      e.preventDefault();
    }
    function up(e){
      if(e.pointerId!==g.id)return;
      const dx=g.x-g.x0,dy=g.y-g.y0,dt=e.timeStamp-g.t0,d2=dx*dx+dy*dy;
      if(e.type==='pointerup'){
        if(!g.drag&&dt<TAP_MS){
          if(g.t0-g.lastTapT<DBL_MS&&(g.x0-g.lastTapX)*(g.x0-g.lastTapX)+(g.y0-g.lastTapY)*(g.y0-g.lastTapY)<DBL_PX*DBL_PX){inp.dbl=true;g.lastTapT=-9999;}
          else{inp.tap=true;g.lastTapT=g.t0;g.lastTapX=g.x0;g.lastTapY=g.y0;}
        }else if(g.drag&&dt<CUT_MS&&d2>CUT_MIN*CUT_MIN&&d2<CUT_MAX*CUT_MAX){
          const ax=Math.abs(dx),ay=Math.abs(dy);
          if(ax>0.45*ay&&ay>0.45*ax)inp.cut=true;
        }
      }
      inp.mx=0;inp.my=0;inp.hold=false;g.id=-1;g.drag=false;
      try{canvas.releasePointerCapture(e.pointerId);}catch(_){}
    }
    function poll(now){
      if(g.id!==-1&&!g.drag&&now-g.t0>=HOLD_MS)inp.hold=true;
    }
    function reset(){inp.mx=0;inp.my=0;inp.hold=false;inp.tap=inp.dbl=inp.cut=false;g.id=-1;g.drag=false;}
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    return{poll,reset,detach(){g.on=false;canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);}};
  }
  root.SurfInput={attach};
})(window);
