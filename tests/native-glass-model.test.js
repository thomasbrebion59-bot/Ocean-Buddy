const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../native-glass-model.js');

const VW=390,VH=844;
const bar={x:20,y:770,width:350,height:60};
const tabs=[
  {id:'home',label:'Accueil',shown:true},
  {id:'spots',label:'Spots'},
  {id:'surf',label:'Surf',badge:'12'},
  {id:'trips',label:'Voyages',shown:false},
  {id:'challenges',label:'Défis',badge:3},
  {id:'profile',label:'Profil'}
];
const base={vw:VW,vh:VH,phone:true,navShown:true,navOnTop:true,navRect:bar,tabs,selected:'spots'};

test('rect arrondit au demi-point et accepte un DOMRect-like',()=>{
  assert.deepEqual(M.rect({left:10.2,top:20.8,width:100.6,height:40.1}),{x:10,y:21,w:100.5,h:40});
  assert.deepEqual(M.rect({x:1.26,y:2.74,w:3.3,h:4.6}),{x:1.5,y:2.5,w:3.5,h:4.5});
  assert.equal(M.rect(null),null);
  assert.equal(M.rect(undefined),null);
  assert.deepEqual(M.rect({left:'abc',top:0,width:0,height:0}).x,0);
});

test('onScreen refuse les rectangles vides ou hors fenêtre',()=>{
  assert.equal(M.onScreen(null,VW,VH),false);
  assert.equal(M.onScreen({x:0,y:0,w:8,h:100},VW,VH),false);
  assert.equal(M.onScreen({x:0,y:0,w:100,h:8},VW,VH),false);
  assert.equal(M.onScreen({x:VW,y:0,w:100,h:100},VW,VH),false);
  assert.equal(M.onScreen({x:0,y:VH,w:100,h:100},VW,VH),false);
  assert.equal(M.onScreen({x:-200,y:0,w:100,h:100},VW,VH),false);
  assert.equal(M.onScreen({x:-50,y:0,w:100,h:100},VW,VH),true);
});

test('items garde seulement les onglets connus et affichés, dans l’ordre',()=>{
  const ids=M.items(tabs).map(t=>t.id);
  assert.deepEqual(ids,['home','spots','surf','challenges','profile']);
  assert.deepEqual(M.items([{id:'inconnu',label:'X'},null,{id:'home',label:'A',shown:false}]),[]);
  assert.deepEqual(M.items(undefined),[]);
});

test('items associe les symboles SF, actif et repos',()=>{
  const [home,spots]=M.items(tabs);
  assert.equal(home.symbol,'house');
  assert.equal(home.symbolOn,'house.fill');
  assert.equal(spots.symbol,'globe.europe.africa');
  assert.equal(spots.symbolOn,'globe.europe.africa.fill');
  assert.equal(M.items([{id:'surf'}])[0].symbolOn,'figure.surfing');
});

test('items nettoie les libellés et retombe sur l’id si vide',()=>{
  const [a]=M.items([{id:'home',label:'  Accueil  ',a11y:'  Ouvrir  '}]);
  assert.equal(a.label,'Accueil');
  assert.equal(a.a11y,'Ouvrir');
  const [b]=M.items([{id:'trips',label:'   '}]);
  assert.equal(b.label,'trips');
  const [c]=M.items([{id:'trips'}]);
  assert.equal(c.label,'trips');
  assert.equal(c.a11y,'');
  const [d]=M.items([{id:'profile',label:'Profil'}]);
  assert.equal(d.a11y,'Profil');
});

test('items tronque le badge à 3 caractères',()=>{
  const [surf]=M.items([{id:'surf',badge:'12345'}]);
  assert.equal(surf.badge,'123');
  assert.equal(M.items([{id:'surf',badge:3}])[0].badge,'3');
  assert.equal(M.items([{id:'surf'}])[0].badge,'');
});

test('state est visible seulement si téléphone, barre affichée, au-dessus et à l’écran, avec des onglets',()=>{
  const s=M.state(base);
  assert.equal(s.visible,true);
  assert.equal(s.selected,'spots');
  assert.equal(s.items.length,5);
  assert.deepEqual(s.bar,{x:20,y:770,w:350,h:60});
  assert.equal(M.state({...base,phone:false}).visible,false);
  assert.equal(M.state({...base,navShown:false}).visible,false);
  assert.equal(M.state({...base,navOnTop:false}).visible,false);
  assert.equal(M.state({...base,navRect:{x:0,y:VH+10,width:350,height:60}}).visible,false);
  assert.equal(M.state({...base,tabs:[]}).visible,false);
  assert.equal(M.state({...base,tabs:[{id:'trips',shown:false}]}).visible,false);
});

test('state : la barre cachée par une couche (navOnTop false) n’est pas visible, poulpy non plus',()=>{
  const s=M.state({...base,navOnTop:false,poulpyShown:true,poulpyRect:{x:300,y:700,width:60,height:60}});
  assert.equal(s.visible,false);
  assert.equal(s.poulpy.visible,false);
});

test('state : poulpy visible exige une barre visible, poulpy affiché et à l’écran',()=>{
  const poulpyRect={left:300,top:700,width:60,height:60};
  const on=M.state({...base,poulpyShown:true,poulpyRect,poulpyLabel:'Poulpy'});
  assert.equal(on.poulpy.visible,true);
  assert.deepEqual(on.poulpy.rect,{x:300,y:700,w:60,h:60});
  assert.equal(on.poulpy.a11y,'Poulpy');
  assert.equal(M.state({...base,poulpyShown:false,poulpyRect}).poulpy.visible,false);
  assert.equal(M.state({...base,poulpyShown:true,poulpyRect:{x:VW+5,y:0,width:60,height:60}}).poulpy.visible,false);
  assert.equal(M.state({...base,phone:false,poulpyShown:true,poulpyRect}).poulpy.visible,false);
  assert.equal(M.state({...base,navShown:false,poulpyShown:true,poulpyRect}).poulpy.visible,false);
  assert.equal(M.state({...base,poulpyShown:true}).poulpy.a11y,'');
});

test('state : selected est vidé s’il n’est pas parmi les onglets',()=>{
  assert.equal(M.state({...base,selected:'trips'}).selected,'');
  assert.equal(M.state({...base,selected:'nope'}).selected,'');
  assert.equal(M.state({...base,selected:undefined}).selected,'');
  assert.equal(M.state({...base,selected:'profile'}).selected,'profile');
});

test('state : tucked et accent sont recopiés avec un repli',()=>{
  const s=M.state({...base,tucked:1,accent:'#1f55e0'});
  assert.equal(s.tucked,true);
  assert.equal(s.accent,'#1f55e0');
  const d=M.state(base);
  assert.equal(d.tucked,false);
  assert.equal(d.accent,'');
});

test('color lit rgb, rgba, espaces et pourcentages',()=>{
  assert.deepEqual(M.color('rgb(31, 85, 224)'),[31,85,224,1]);
  assert.deepEqual(M.color('rgba(0,0,0,0.5)'),[0,0,0,0.5]);
  assert.deepEqual(M.color('rgb(10 20 30 / 50%)'),[10,20,30,0.5]);
  assert.deepEqual(M.color('  rgb(1, 2, 3)  '),[1,2,3,1]);
});

test('color lit le hexadécimal court et long',()=>{
  assert.deepEqual(M.color('#abc'),[170,187,204,1]);
  assert.deepEqual(M.color('#1f55e0'),[31,85,224,1]);
  assert.deepEqual(M.color('#1F55E0'),[31,85,224,1]);
});

test('color renvoie null pour les formats non lisibles',()=>{
  assert.equal(M.color('color-mix(in srgb, red 50%, blue)'),null);
  assert.equal(M.color(''),null);
  assert.equal(M.color(null),null);
  assert.equal(M.color('#12'),null);
  assert.equal(M.color('hsl(0, 100%, 50%)'),null);
});

test('forcedOff détecte ?glass=off et le stockage "off"',()=>{
  assert.equal(M.forcedOff('?glass=off',null),true);
  assert.equal(M.forcedOff('?a=1&glass=off',null),true);
  assert.equal(M.forcedOff('?glass=off&a=1',null),true);
  assert.equal(M.forcedOff('',"off"),true);
  assert.equal(M.forcedOff('',' "off" '.trim()),true);
  assert.equal(M.forcedOff('?glass=offx',null),false);
  assert.equal(M.forcedOff('?xglass=off',null),false);
  assert.equal(M.forcedOff('?glass=on',null),false);
  assert.equal(M.forcedOff('',null),false);
  assert.equal(M.forcedOff(null,null),false);
});
