const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/catalog.json'),'utf8'));
/* Bloc de l'app : de DANGER_FAMILY à spotTokens (familles de couleurs, DANGER_MAP, mots-clés, dangerStyle) ; poulpy-icons.js tel quel. */
function load(){
 const start=app.indexOf('var DANGER_FAMILY'),end=app.indexOf('function spotTokens');
 assert.ok(start>0&&end>start,'bloc DANGER_FAMILY … spotTokens introuvable');
 const ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'poulpy-icons.js'),'utf8'),ctx);
 vm.runInNewContext(app.slice(start,end)+';this.dangerStyle=dangerStyle;this.FALLBACK=DANGER_FALLBACK;',ctx);
 return {P:ctx.window.PoulpyIcons,dangerStyle:ctx.dangerStyle,FALLBACK:ctx.FALLBACK};
}
const lines=catalog.flatMap(s=>(s.dangers||[]).map(d=>({id:s.id,emoji:d[0],text:d[1]})));

test('le catalogue porte plus de mille lignes de danger (1 319 au moment du chantier)',()=>{assert.ok(lines.length>1000,String(lines.length));});

test('chaque ligne de danger donne un picto connu, des jetons de couleur, et au plus 3 lignes tombent sur le repli',()=>{
 const {P,dangerStyle,FALLBACK}=load();
 let fallback=0;const unknown=[],hard=[];
 for(const l of lines){
  const [key,bg,ink]=dangerStyle(l.emoji,l.text);
  if(!P.has(key))unknown.push(`${l.id} ${l.emoji} ${key}`);
  if(!/^var\(--k-[a-z]+\)$/.test(bg)||!/^var\(--k-[a-z]+-ink\)$/.test(ink))hard.push(`${l.id} ${bg} ${ink}`);
  if(key===FALLBACK[0])fallback++;
 }
 assert.deepEqual(unknown,[]);assert.deepEqual(hard,[]);
 assert.ok(fallback<=3,`${fallback} lignes sur le repli`);
 assert.notEqual(FALLBACK[0],'pin','le repli n’est plus l’épingle grise');
});

test('aucune ligne de danger ne retombe sur l’épingle',()=>{
 const {dangerStyle}=load();
 assert.deepEqual(lines.filter(l=>dangerStyle(l.emoji,l.text)[0]==='pin').map(l=>l.id),[]);
});

test('les fichiers des pictos utilisés existent',()=>{
 const {P,dangerStyle}=load();
 const keys=new Set(lines.map(l=>dangerStyle(l.emoji,l.text)[0]));
 for(const k of keys){const f=P.file(k);assert.ok(f&&fs.existsSync(path.join(root,f)),k);}
});

test('le sélecteur de variante U+FE0F ne change rien (soleil avec ou sans)',()=>{
 const {dangerStyle}=load();
 assert.deepEqual(dangerStyle('☀','Soleil fort'),dangerStyle('☀️','Soleil fort'));
 assert.equal(dangerStyle('☀','x')[0],'soleil');
 assert.equal(dangerStyle('⛈','Orages d’été')[0],dangerStyle('⛈️','Orages d’été')[0]);
});

test('les emojis du catalogue donnent le picto attendu, la couleur signalant la gravité',()=>{
 const {dangerStyle}=load();
 const k=(e,t='')=>dangerStyle(e,t);
 assert.equal(k('\u{1FAB8}')[0],'corail');
 assert.equal(k('\u{1FABC}')[0],'meduse');assert.match(k('\u{1FABC}')[1],/--k-coral\)/);
 assert.equal(k('\u{1F988}')[0],'requin');assert.match(k('\u{1F988}')[1],/--k-coral\)/);
 assert.equal(k('\u{1F3E5}')[0],'secours_eloignes');assert.match(k('\u{1F3E5}')[1],/--k-coral\)/);
 assert.equal(k('⛈')[0],'orage_pluie');
 assert.equal(k('\u{1F32A}')[0],'cyclone_typhon');
 assert.equal(k('\u{1F40A}')[0],'animal_a_risque');
 assert.equal(k('\u{1F9A0}')[0],'sante_maladie');
 assert.equal(k('\u{1F422}')[0],'tortue');
 assert.equal(k('\u{1F6AB}')[0],'interdit');
});

test('repli par mot entier sur le texte quand l’emoji est inconnu',()=>{
 const {dangerStyle,FALLBACK}=load();
 const u='\u{1F9FF}';/* emoji sans entrée */
 assert.equal(dangerStyle(u,'Méduses certains étés : regarde les drapeaux.')[0],'meduse');
 assert.equal(dangerStyle(u,'Typhons possibles de juillet à octobre')[0],'cyclone_typhon');
 assert.equal(dangerStyle(u,'Orages d’été soudains.')[0],'orage_pluie');
 assert.equal(dangerStyle(u,'Récif à l’entrée de la baie.')[0],'corail');
 assert.equal(dangerStyle(u,'Secours éloignés.')[0],'secours_eloignes');
 assert.equal(dangerStyle(u,'Requins signalés.')[0],'requin');
 assert.equal(dangerStyle(u,'Ferries dans le chenal.')[0],'bateau');
 assert.equal(dangerStyle(u,'Courants de baïne.')[0],'spirale');
 assert.equal(dangerStyle(u,'Foule le week-end.')[0],'affluence');
 /* mot entier : « ouragan » ne se cache pas dans un autre mot, « vent » non plus dans « événement » */
 assert.equal(dangerStyle(u,'Événement sportif')[0],FALLBACK[0]);
 assert.equal(dangerStyle(u,'')[0],FALLBACK[0]);
 assert.equal(dangerStyle(undefined,undefined)[0],FALLBACK[0]);
});

test('un emoji générique (⚠️, bateau) laisse le texte préciser le danger',()=>{
 const {dangerStyle}=load();
 assert.equal(dangerStyle('⚠️','Crocodiles signalés dans l’estuaire : on n’y nage pas.')[0],'animal_a_risque');
 assert.equal(dangerStyle('⚠️','Île isolée, secours médicaux éloignés.')[0],'secours_eloignes');
 assert.equal(dangerStyle('⚓','Pénétration dangereuse : désorientation et risque d’effondrement.')[0],'epave_penetration');
 assert.equal(dangerStyle('⚓','Bateaux de pêche dans le chenal.')[0],'bateau');
 assert.equal(dangerStyle('⚠️','Apnée : risque de syncope.')[0],'vigilance');
});
