/* Mini-jeu de surf : rendu canvas 2D (lit l'état du modèle, ne le modifie pas). Vue de face depuis la plage. */
(function(root){
  'use strict';
  const M=root.SurfModel;
  const LIME='#e0ff91',CORAL='#ff6b57',TAU=Math.PI*2;
  const NP=64;
  const U_MIN=-0.3,U_SPAN=1.45;
  /* Poses du repli (cases de 256, pieds sur y=232, personnage tourné vers la droite).
     [hanche x,y, épaules x,y, tête x,y, genou1 x,y, genou2 x,y, pied1 x,y, pied2 x,y, main1 x,y, main2 x,y, inclinaison planche] */
  const POSES=[
    [126,166,132,116,138,90, 92,198,164,200, 100,230,156,230, 84,134,186,124, 0],
    [126,166,132,116,138,90, 92,198,164,200, 100,230,156,230, 84,134,186,124, 0],
    [126,166,132,116,138,90, 92,198,164,200, 100,230,156,230, 84,134,186,124, 0],
    [126,166,132,116,138,90, 92,198,164,200, 100,230,156,230, 84,134,186,124, 0],
    [112,170, 98,122, 90,98, 84,202,162,196, 96,230,150,230, 168,136, 40,146, -0.16],
    [118,196,146,160,166,142, 98,210,172,204, 98,230,152,230, 176,218, 150,226, 0.02],
    [126,170,128,122,130,98, 98,196,162,186, 104,214,160,206, 66,92,188,88, -0.38],
    [150,196,178,212,198,226, 120,170,92,206, 104,150,70,212, 204,170,140,150, 0.9]
  ];
  const WORK=new Array(19);

  function create(canvas){
    const ctx=canvas.getContext('2d',{alpha:false});
    const r={canvas,ctx,W:0,H:0,dpr:1,inset:0,char:'surfeur',atlas:null,atlasOk:false,
      th:{main:'#1a5ad6',deep:'#082a78',bright:'#3a8bff'},
      g:{},fonts:{},baseY:0,faceMax:0,
      px:new Float32Array(NP),py:new Float32Array(NP),pvx:new Float32Array(NP),pvy:new Float32Array(NP),pl:new Float32Array(NP),pn:0,
      lastFig:0,lastFall:0,lastScore:-1,scoreStr:'0',lastSec:-1,secStr:'75',figStr:'',lastFigSeq:-1,sx:0,sy:0,sh:0,tt:0,spawn:0};
    r.setTheme=function(th){if(th.main)r.th.main=th.main;if(th.deep)r.th.deep=th.deep;if(th.bright)r.th.bright=th.bright;if(r.W)build();};
    r.setChar=function(c){
      r.char=c==='surfeuse'?'surfeuse':'surfeur';r.atlas=null;r.atlasOk=false;
      const img=new Image();img.onload=function(){if(img.naturalWidth>=256*8-1&&r.atlas===img)r.atlasOk=true;};img.onerror=function(){r.atlasOk=false;};
      r.atlas=img;img.src='assets/surf/'+r.char+'.webp';
    };
    r.resize=function(w,h,dpr,inset){
      r.W=w;r.H=h;r.dpr=dpr;r.inset=inset||0;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
      r.baseY=h*0.86;r.faceMax=h*0.80;build();
    };
    function build(){
      const W=r.W,H=r.H,c=ctx,g=r.g,th=r.th;
      g.sky=c.createLinearGradient(0,0,0,H*0.3);g.sky.addColorStop(0,'#7fc4ff');g.sky.addColorStop(1,'#e6f6ff');
      g.far=c.createLinearGradient(0,H*0.08,0,r.baseY);g.far.addColorStop(0,'#5fb0f0');g.far.addColorStop(1,th.deep);
      g.face=c.createLinearGradient(0,H*0.1,0,r.baseY);g.face.addColorStop(0,'rgba(150,220,255,0.75)');g.face.addColorStop(0.18,th.bright);g.face.addColorStop(0.55,th.main);g.face.addColorStop(1,th.deep);
      g.trough=c.createLinearGradient(0,r.baseY,0,H);g.trough.addColorStop(0,th.deep);g.trough.addColorStop(1,'#04164a');
      g.foam=c.createLinearGradient(0,0,W*0.4,0);g.foam.addColorStop(0,'#ffffff');g.foam.addColorStop(0.7,'#f1f9ff');g.foam.addColorStop(1,'rgba(241,249,255,0.55)');
      g.cav=c.createRadialGradient(0,0,0,0,0,100);g.cav.addColorStop(0,'rgba(2,10,36,0.98)');g.cav.addColorStop(0.65,'rgba(5,24,72,0.9)');g.cav.addColorStop(1,'rgba(8,42,120,0)');
      g.vig=c.createRadialGradient(W/2,H*0.55,Math.min(W,H)*0.25,W/2,H*0.55,Math.max(W,H)*0.75);g.vig.addColorStop(0,'rgba(2,10,36,0)');g.vig.addColorStop(1,'rgba(2,10,36,0.8)');
      g.glow=c.createRadialGradient(0,0,0,0,0,100);g.glow.addColorStop(0,'rgba(180,235,255,0.65)');g.glow.addColorStop(1,'rgba(180,235,255,0)');
      const fs=Math.round(Math.min(W,H)*0.095);
      r.fonts.score='800 '+Math.max(30,Math.min(46,fs))+'px "Barlow Condensed",sans-serif';
      r.fonts.fig='800 '+Math.max(34,Math.min(54,Math.round(fs*1.2)))+'px "Barlow Condensed",sans-serif';
      r.fonts.small='700 15px "Barlow Condensed",sans-serif';
    }
    const sx=function(u){return r.W*((u-U_MIN)/U_SPAN);};
    const lipY=function(u){return r.baseY-M.faceHeight(u)*r.faceMax;};

    function spawn(x,y,vx,vy,l){
      let i=r.pn<NP?r.pn++:(r.spawn=(r.spawn+1)%NP);
      r.px[i]=x;r.py[i]=y;r.pvx[i]=vx;r.pvy[i]=vy;r.pl[i]=l;
    }
    function burst(x,y,n,pw){for(let i=0;i<n;i++){const a=Math.random()*Math.PI;spawn(x,y,Math.cos(a)*pw*(Math.random()+.3),-Math.sin(a)*pw*(Math.random()+.3),0.6+Math.random()*0.5);}}

    r.draw=function(s,dt,now){
      const c=ctx,W=r.W,H=r.H,t=now,baseY=r.baseY,dist=s.dist;
      if(dt>0.1)dt=0.1;
      c.setTransform(r.dpr,0,0,r.dpr,0,0);
      /* ciel et mer lointaine */
      c.fillStyle=r.g.sky;c.fillRect(0,0,W,H*0.3);
      c.fillStyle=r.g.far;c.fillRect(0,H*0.1,W,baseY-H*0.1);
      /* face de la vague : bord supérieur lisse (courbes passant par les milieux) */
      const N=12,wob=H*0.009;
      c.beginPath();c.moveTo(0,baseY);
      let qx=0,qy=lipY(U_MIN)+wob*Math.sin(dist*3);
      c.lineTo(0,qy);
      for(let i=1;i<=N;i++){
        const x=W*i/N,y=lipY(U_MIN+U_SPAN*i/N)+wob*Math.sin(x*0.016+dist*3);
        c.quadraticCurveTo(qx,qy,(qx+x)/2,(qy+y)/2);qx=x;qy=y;
      }
      c.lineTo(W,qy);c.lineTo(W,baseY);c.closePath();c.fillStyle=r.g.face;c.fill();
      /* nervures qui défilent avec la progression */
      c.lineWidth=2;c.strokeStyle='rgba(255,255,255,0.12)';c.beginPath();
      for(let k=1;k<6;k++){
        const f=k/6;let px0=0,py0=0;
        for(let i=0;i<=N;i++){
          const x=W*i/N,u=U_MIN+U_SPAN*i/N,ly=lipY(u),y=ly+(baseY-ly)*(f+0.025*Math.sin(x*0.02+dist*4+k*1.7));
          if(i===0)c.moveTo(x,y);else c.quadraticCurveTo(px0,py0,(px0+x)/2,(py0+y)/2);px0=x;py0=y;
        }
      }
      c.stroke();
      /* liseré d'écume le long de la crête */
      c.lineWidth=4;c.lineCap='round';c.strokeStyle='rgba(255,255,255,0.7)';c.beginPath();
      qx=0;qy=lipY(U_MIN)+wob*Math.sin(dist*3);c.moveTo(0,qy);
      for(let i=1;i<=N;i++){
        const x=W*i/N,y=lipY(U_MIN+U_SPAN*i/N)+wob*Math.sin(x*0.016+dist*3);
        c.quadraticCurveTo(qx,qy,(qx+x)/2,(qy+y)/2);qx=x;qy=y;
      }
      c.stroke();
      /* creux devant la vague */
      c.fillStyle=r.g.trough;c.fillRect(0,baseY,W,H-baseY);
      c.strokeStyle='rgba(255,255,255,0.18)';c.lineWidth=3;c.beginPath();
      for(let k=0;k<4;k++){const y=baseY+(H-baseY)*(0.2+k*0.2),o=(dist*160+k*57)%W;c.moveTo(W-o,y);c.lineTo(W-o+W*0.18,y);c.moveTo(-o,y);c.lineTo(-o+W*0.18,y);}
      c.stroke();
      /* tube : cavité sombre sous la lèvre qui déferle */
      const hol=s.hollow,uc=0.24,ux=sx(uc),ly=lipY(uc),fh=baseY-ly,fx=sx(0);
      if(hol>0.3){
        c.save();c.translate(ux,ly+fh*0.55);c.scale(W*0.24*(0.5+hol*0.5)/100,fh*0.34*(0.5+hol*0.5)/100);
        c.globalAlpha=Math.min(1,(hol-0.2)*1.6);c.fillStyle=r.g.cav;c.beginPath();c.arc(0,0,100,0,TAU);c.fill();c.restore();
      }
      /* mousse derrière le front : bord bouillonnant fait de cercles */
      const fr=W*0.05,ft=lipY(0)-4;
      c.fillStyle=r.g.foam;c.beginPath();c.rect(0,ft,fx-fr*1.2,H-ft);
      for(let y=ft;y<H+fr;y+=fr*1.15){
        const k=(y-ft)/fr,xx=fx-fr*1.2+fr*0.45*Math.sin(k*1.9+t*2.6)+fr*0.25*Math.sin(k*4.1-t*4.2),rr=fr*(0.9+0.25*Math.sin(k*2.7+t*1.3));
        c.moveTo(xx+rr,y);c.arc(xx,y,rr,0,TAU);
      }
      for(let x=0;x<fx;x+=fr*1.2){const k=x/fr,yy=ft+fr*0.15*Math.sin(k*2.3+t*3),rr=fr*(0.75+0.2*Math.sin(k*3.1+t*2));c.moveTo(x+rr,yy);c.arc(x,yy,rr,0,TAU);}
      c.fill();
      c.fillStyle='rgba(190,225,255,0.55)';c.beginPath();
      for(let k=0;k<7;k++){const bx=((k*83+t*60*(1+k%3*0.3))%(fx-fr)),by=ft+(H-ft)*((k*37%100)/100);c.moveTo(bx+fr*0.5,by);c.arc(bx,by,fr*0.5,0,TAU);}
      c.fill();
      /* lèvre qui s'enroule vers la mousse, écume et embruns sur la crête */
      const lx0=sx(0.55),ly0=lipY(0.55)+3,lx1=sx(-0.03),ly1=lipY(0.1)+fh*0.15,lc=hol>0.3?hol:0.3;
      c.lineCap='round';
      c.beginPath();c.moveTo(lx0,ly0);c.bezierCurveTo(sx(0.3),ly0-fh*0.05,sx(0.02),ly0-fh*0.02*lc,lx1,ly1);
      c.strokeStyle='rgba(120,200,255,0.55)';c.lineWidth=18*lc+4;c.stroke();
      c.strokeStyle='rgba(255,255,255,0.95)';c.lineWidth=7;c.stroke();
      c.fillStyle='rgba(255,255,255,0.9)';c.beginPath();
      for(let k=0;k<8;k++){const ph=(t*1.4+k*0.37)%1,bx=sx(0.35-k*0.05)-ph*W*0.05,by=lipY(0.35-k*0.05)-ph*fh*0.07+ph*ph*fh*0.07;c.moveTo(bx+2.5,by);c.arc(bx,by,2.5*(1-ph*0.5),0,TAU);}
      c.fill();
      /* position du surfeur */
      const u=s.u,hf=baseY-lipY(u);
      const px=sx(u),pyBase=baseY-(0.08+0.84*s.y)*hf;
      const pyy=pyBase-s.z*r.faceMax*0.7;
      const S=Math.min(W*0.42,H*0.24)*(0.9+0.2*(1-s.y));
      /* sillage */
      if(s.phase==='play'&&!s.air){
        c.fillStyle='rgba(255,255,255,0.32)';c.beginPath();c.moveTo(px-S*0.1,pyBase-S*0.03);c.lineTo(px-S*(0.9+0.4*Math.abs(s.vu)),pyBase+S*0.1);c.lineTo(px-S*0.1,pyBase+S*0.08);c.closePath();c.fill();
        if(Math.random()<dt*40)spawn(px-S*0.2,pyBase,-60-Math.random()*60,-30-Math.random()*50,0.5);
      }
      /* événements -> particules */
      if(s.figSeq!==r.lastFig){r.lastFig=s.figSeq;burst(px,pyBase,14,160);}
      if(s.fallSeq!==r.lastFall){r.lastFall=s.fallSeq;burst(px,pyBase,40,260);}
      /* personnage */
      c.save();
      const k=S/256;
      c.translate(px,pyy);
      let poseIdx=s.pose===M.POSE.GLIDE?((t*9)|0)&3:s.pose===M.POSE.TURN?4:s.pose===M.POSE.CROUCH?5:s.pose===M.POSE.AIR?6:7;
      let flip=s.dir;
      if(s.phase==='fall'){const p=s.fallT/M.FALL_DUR;c.translate(p*S*0.5,p<0.5?-Math.sin(p*TAU)*S*0.25:(p-0.5)*S*0.12);c.rotate(p*3);c.globalAlpha=p>0.75?(1-p)*4:1;}
      else if(s.spinning)flip*=Math.cos(s.spin)||0.01;
      c.scale(k*flip,k);c.translate(-128,-232);
      if(r.atlasOk&&r.atlas){c.drawImage(r.atlas,poseIdx*256,0,256,256,0,0,256,256);}
      else drawFallback(c,poseIdx,t);
      c.restore();
      c.globalAlpha=1;
      /* particules */
      c.fillStyle='rgba(255,255,255,0.9)';c.beginPath();
      for(let i=0;i<r.pn;i++){
        if(r.pl[i]<=0)continue;
        r.pl[i]-=dt;r.pvy[i]+=420*dt;r.px[i]+=r.pvx[i]*dt;r.py[i]+=r.pvy[i]*dt;
        const rad=2+r.pl[i]*4;c.moveTo(r.px[i]+rad,r.py[i]);c.arc(r.px[i],r.py[i],rad,0,TAU);
      }
      c.fill();
      /* assombrissement du tube */
      if(s.tube){c.fillStyle=r.g.vig;c.fillRect(0,0,W,H);}
      hud(s);
    };

    function hud(s){
      const c=ctx,W=r.W,m=16,y0=r.inset+10;
      const sc=s.score|0;
      if(sc!==r.lastScore){r.lastScore=sc;r.scoreStr=String(sc);}
      c.textBaseline='top';c.textAlign='left';c.font=r.fonts.score;
      c.lineJoin='round';c.lineWidth=5;c.strokeStyle='rgba(4,22,74,0.7)';c.strokeText(r.scoreStr,m,y0);
      c.fillStyle=LIME;c.fillText(r.scoreStr,m,y0);
      /* temps restant */
      const left=s.dur-s.t,sec=Math.ceil(left);
      if(sec!==r.lastSec){r.lastSec=sec;r.secStr=sec+' s';}
      const barW=W-2*m-56,barY=y0+Math.round(parseInt(r.fonts.score.slice(4),10)*1.1)+4;
      c.fillStyle='rgba(255,255,255,0.28)';c.fillRect(m,barY,barW,6);
      c.fillStyle=left<10?CORAL:LIME;c.fillRect(m,barY,barW*Math.max(0,left/s.dur),6);
      c.font=r.fonts.small;c.textAlign='right';c.fillStyle='#fff';c.fillText(r.secStr,m+barW,barY+12);
      /* multiplicateur tube */
      if(s.tube){c.textAlign='center';c.font=r.fonts.score;c.fillStyle=CORAL;c.strokeText('TUBE ×2',W/2,barY+34);c.fillText('TUBE ×2',W/2,barY+34);}
      /* figure en cours */
      if(s.figSeq!==r.lastFigSeq){r.lastFigSeq=s.figSeq;r.figStr=s.figSeq?s.figName+' +'+(s.figPts|0):'';}
      if(r.figStr&&s.figT<1.4&&s.phase!=='over'){
        const p=s.figT/1.4,sc2=p<0.15?0.6+p/0.15*0.5:1.1-p*0.1;
        c.save();c.translate(W/2,r.H*0.33);c.scale(sc2,sc2);c.globalAlpha=p>0.7?(1-p)/0.3:1;c.textAlign='center';c.textBaseline='middle';c.font=r.fonts.fig;
        c.strokeStyle='rgba(4,22,74,0.8)';c.lineWidth=7;c.strokeText(r.figStr,0,0);c.fillStyle=LIME;c.fillText(r.figStr,0,0);c.restore();
      }
      if(s.phase==='fall'){
        c.globalAlpha=1;c.textAlign='center';c.textBaseline='middle';c.font=r.fonts.fig;c.fillStyle=CORAL;c.strokeStyle='rgba(4,22,74,0.8)';c.lineWidth=7;
        c.strokeText('Chute !',W/2,r.H*0.33);c.fillText('Chute !',W/2,r.H*0.33);
      }
    }

    /* ----- repli : surfeur / surfeuse en formes simples ----- */
    function drawFallback(c,idx,t){
      const P=POSES[idx],f=idx<4?idx:0;
      const bob=idx<4?Math.sin(f*Math.PI/2+t*2)*3:0;
      for(let i=0;i<18;i++)WORK[i]=P[i];
      WORK[1]+=bob;WORK[3]+=bob;WORK[5]+=bob;
      const w=WORK,fem=r.char==='surfeuse';
      const skin=fem?'#d9976b':'#ecb78f',trunk=fem?'#16a39b':'#ff6b57',boardC=fem?'#ff7a66':'#e0ff91',boardD=fem?'#c9432f':'#8fc93a';
      c.lineCap='round';c.lineJoin='round';
      /* planche */
      c.save();c.translate(128,232);c.rotate(P[18]);
      c.fillStyle=boardC;c.beginPath();c.moveTo(-92,2);c.quadraticCurveTo(-60,-12,0,-11);c.quadraticCurveTo(70,-12,100,2);c.quadraticCurveTo(60,12,0,11);c.quadraticCurveTo(-60,12,-92,2);c.fill();
      c.strokeStyle=boardD;c.lineWidth=3;c.beginPath();c.moveTo(-70,1);c.lineTo(84,1);c.stroke();
      c.fillStyle=boardD;c.beginPath();c.moveTo(-70,8);c.lineTo(-84,24);c.lineTo(-52,10);c.fill();
      c.restore();
      /* jambes */
      c.strokeStyle=skin;c.lineWidth=17;
      c.beginPath();c.moveTo(w[0],w[1]);c.lineTo(w[6],w[7]);c.lineTo(w[10],w[11]);c.stroke();
      /* bras arrière */
      c.lineWidth=11;c.beginPath();c.moveTo(w[2],w[3]);c.lineTo(w[14],w[15]);c.stroke();
      /* torse */
      c.lineWidth=26;c.beginPath();c.moveTo(w[0],w[1]);c.lineTo(w[2],w[3]);c.stroke();
      if(fem){c.strokeStyle=trunk;c.lineWidth=27;c.beginPath();c.moveTo(w[2]+(w[0]-w[2])*0.1,w[3]+(w[1]-w[3])*0.1);c.lineTo(w[2]+(w[0]-w[2])*0.45,w[3]+(w[1]-w[3])*0.45);c.stroke();}
      /* short / maillot */
      c.strokeStyle=trunk;c.lineWidth=23;c.beginPath();c.moveTo(w[0],w[1]);c.lineTo(w[0]+(w[8]-w[0])*0.3,w[1]+(w[9]-w[1])*0.3);c.stroke();
      c.lineWidth=20;c.beginPath();c.moveTo(w[0],w[1]);c.lineTo(w[0]+(w[6]-w[0])*0.35,w[1]+(w[7]-w[1])*0.35);c.stroke();
      /* jambe avant */
      c.strokeStyle=skin;c.lineWidth=17;c.beginPath();c.moveTo(w[0]+(w[8]-w[0])*0.28,w[1]+(w[9]-w[1])*0.28);c.lineTo(w[8],w[9]);c.lineTo(w[12],w[13]);c.stroke();
      /* bras avant */
      c.lineWidth=11;c.beginPath();c.moveTo(w[2],w[3]);c.lineTo(w[16],w[17]);c.stroke();
      /* tête et cheveux */
      c.fillStyle=skin;c.beginPath();c.arc(w[4],w[5],17,0,TAU);c.fill();
      c.fillStyle=fem?'#6b3a1e':'#2a1c14';
      c.beginPath();c.arc(w[4]-2,w[5]-3,18,Math.PI*1.0,Math.PI*1.95);c.closePath();c.fill();
      if(fem){c.strokeStyle='#6b3a1e';c.lineWidth=9;c.beginPath();c.moveTo(w[4]-10,w[5]-6);c.quadraticCurveTo(w[4]-34,w[5]-4+Math.sin(t*6)*4,w[4]-52,w[5]+12+Math.sin(t*5)*6);c.stroke();}
      c.fillStyle='#1b1b1b';c.beginPath();c.arc(w[4]+9,w[5]-1,2.4,0,TAU);c.fill();
    }
    return r;
  }
  root.SurfRender={create};
})(window);
