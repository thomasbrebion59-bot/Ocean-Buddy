/* Décor de Noël (noel.css, section noel-deco) : illustrations de la direction A « lumières douces » (assets/noel/).
   Garde-fous : fichiers présents, légers et nets à ×3 ; images chargées seulement sous html.ob-noel ; aucune décoration
   au-dessus du contenu (pas de calque de neige sur la page, flocons et houx dans la marge vide des titres de l’accueil,
   guirlande hors des boutons de la barre d’onglets, paillettes sous le contenu) ; décor FIXE : aucune animation (décision
   du fondateur : le décor ne doit jamais gêner l’utilisation).
   Les mesures à l’écran (captures, aucun flocon sur un texte ni un bouton) sont dans noel-v2/scripts (hors du dépôt). */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const noel=read('noel.css'),noCom=noel.replace(/\/\*[\s\S]*?\*\//g,'');
const feedJs=read('home-feed.js'),feedCssNoCom=read('home-feed.css').replace(/\/\*[\s\S]*?\*\//g,'');
const DIR=path.join(root,'assets/noel');
const FILES={'guirlande-h-clair.webp':'--noel-bulbs-h','guirlande-v-clair.webp':'--noel-bulbs-v','guirlande-h.webp':'--noel-bulbs-nuit','flocons.webp':'--noel-snow','houx.webp':'--noel-holly','bonnet.webp':'--noel-hat'};

/* En-tête WebP étendu (VP8X) : drapeau de transparence et dimensions du canevas. */
function webp(file){
  const b=fs.readFileSync(path.join(DIR,file));
  assert.equal(b.toString('ascii',0,4),'RIFF',file);
  assert.equal(b.toString('ascii',8,12),'WEBP',file);
  assert.equal(b.toString('ascii',12,16),'VP8X',file+' : en-tête étendu attendu (transparence)');
  const flags=b[20],w=1+b.readUIntLE(24,3),h=1+b.readUIntLE(27,3);
  return {bytes:b.length,alpha:!!(flags&0x10),w,h};
}
/* Déclarations de la première règle dont le sélecteur contient exactement `sel` (et, si demandé, la propriété `prop`). */
function decl(sel,prop='content'){
  const re=/([^{}]+)\{([^{}]*)\}/g;let m,out=null;
  while((m=re.exec(noCom))&&out===null)if(m[1].split(',').some(p=>p.trim()===sel)&&new RegExp('(?:^|;)\\s*'+prop+':').test(m[2]))out=m[2];
  assert.ok(out!==null,'règle absente : '+sel);
  return out;
}
const px=(d,prop)=>{const m=new RegExp('(?:^|;)\\s*'+prop+':\\s*(-?[\\d.]+)px').exec(d);return m?+m[1]:null;};

test('assets/noel : six WebP transparents, légers, sans les PNG sources',()=>{
  const list=fs.readdirSync(DIR).sort();
  assert.deepEqual(list,Object.keys(FILES).sort(),'seulement les six illustrations (les PNG sources restent hors de l’app)');
  let total=0;
  for(const f of list){
    const i=webp(f);total+=i.bytes;
    assert.ok(i.alpha,f+' : transparence');
    assert.ok(i.bytes<=24*1024,`${f} : ${i.bytes} octets (plafond 24 Ko)`);
  }
  assert.ok(total<=72*1024,`décor complet : ${total} octets (plafond 72 Ko)`);
});

test('netteté ×3 : aucune illustration affichée plus grande que le tiers de sa définition',()=>{
  const g=webp('guirlande-h-clair.webp'),v=webp('guirlande-v-clair.webp'),n=webp('guirlande-h.webp'),h=webp('houx.webp'),b=webp('bonnet.webp'),s=webp('flocons.webp');
  assert.equal(v.w,g.h);assert.equal(v.h,g.w);
  for(const x of [...noCom.matchAll(/var\(--noel-bulbs-nuit\)[^;]*?\/auto (\d+(?:\.\d+)?)px/g)].map(m=>+m[1]))assert.ok(x*3<=n.h,`guirlande nuit affichée à ${x} px`);
  /* Guirlande horizontale : hauteurs affichées (« auto Npx ») ; verticale : largeurs (« Npx auto »). */
  const hs=[...noCom.matchAll(/var\(--noel-bulbs-h\)[^;]*?\/auto (\d+(?:\.\d+)?)px/g)].map(m=>+m[1]);
  const vs=[...noCom.matchAll(/var\(--noel-bulbs-v\)[^;]*?\/(\d+(?:\.\d+)?)px auto/g)].map(m=>+m[1]);
  assert.ok(hs.length>=2&&vs.length>=1);
  for(const x of hs)assert.ok(x*3<=g.h,`guirlande affichée à ${x} px pour ${g.h} px de définition`);
  for(const x of vs)assert.ok(x*3<=v.w,`guirlande verticale affichée à ${x} px`);
  /* Houx (contain dans sa boîte) */
  const hd=decl('html.ob-noel #home .hf-avent .as-sec h2::after'),hw=px(hd,'width'),hh=px(hd,'height');
  const scale=Math.min(hw/h.w,hh/h.h);
  assert.ok(scale*3<=1.001,`houx affiché à ${(h.w*scale).toFixed(1)} × ${(h.h*scale).toFixed(1)} px`);
  /* Bonnets : largeur de chaque boîte (contain, bonnet plus large que haut) */
  for(const sel of ['html.ob-noel .tab-poulpy::before','html.ob-noel .sidebar-poulpy::before','html.ob-noel .chrome-user::before','html.ob-noel .sidebar-user::before','html.ob-noel .ph-avatar::before']){
    const w=px(decl(sel,'width'),'width'),hh2=px(decl(sel,'width'),'height');
    assert.ok(w*3<=b.w&&hh2*3<=b.h+1,`${sel} : ${w} × ${hh2} px pour ${b.w} × ${b.h}`);
    assert.ok(Math.abs(w/hh2-b.w/b.h)<.06,`${sel} : proportions du nouveau bonnet`);
  }
  /* Flocons : bande affichée à « auto Npx » */
  const sh=[...noCom.matchAll(/var\(--noel-snow\)[^;]*?\/auto (\d+(?:\.\d+)?)px/g)].map(m=>+m[1]);
  assert.ok(sh.length>=1);
  for(const x of sh)assert.ok(x*3<=s.h,`flocons affichés à ${x} px`);
});

test('images chargées seulement en mode Noël (html.ob-noel)',()=>{
  /* Les fichiers ne sont nommés que dans les variables de :root (une variable ne télécharge rien tant qu’aucune règle
     active ne l’emploie), et chaque emploi est dans une règle sous html.ob-noel. */
  const named=[...noCom.matchAll(/(--noel-[\w-]+):url\("assets\/noel\/([\w.-]+)"\)/g)].map(m=>[m[1],m[2]]);
  assert.deepEqual(Object.fromEntries(named.map(([v,f])=>[f,v])),FILES);
  assert.equal((noCom.match(/assets\/noel\//g)||[]).length,6,'aucune autre mention des fichiers');
  const rootBlocks=[...noCom.matchAll(/:root\{([^}]*)\}/g)].map(m=>m[1]).join('');
  for(const [v] of named)assert.ok(rootBlocks.includes(v+':url('),v+' déclarée dans :root');
  const re=/([^{}]+)\{([^{}]*)\}/g;let m;
  while((m=re.exec(noCom))){
    if(!/var\(--noel-(?:hat|holly|bulbs-h|bulbs-v|bulbs-nuit|snow)\)/.test(m[2]))continue;
    for(const part of m[1].split(','))assert.match(part.trim().replace(/^@media\([^)]*\)\s*/,''),/^html\.ob-noel[ .:]/,'emploi hors mode Noël : '+part.trim());
  }
  for(const f of ['index.html','home-feed.js','home-feed.css','app-shell.css','sw.js','design.css'])
    assert.doesNotMatch(read(f),/assets\/noel\//,f+' ne charge pas le décor');
  /* Le paquet de l’app embarque tout assets/ (hors ligne) ; le service worker ne précharge pas le décor hors saison. */
  assert.match(read('scripts/build-mobile.cjs'),/fs\.cpSync\(path\.join\(root,'assets'\),path\.join\(dest,'assets'\)/);
  assert.doesNotMatch(read('sw.js').match(/const CORE=\[[^\]]*\]/)[0],/noel/);
});

test('aucune décoration au-dessus du contenu : plus de calque de neige, flocons dans la marge des titres de l’accueil',()=>{
  /* Plus de calque fixe sur toute la page (l’ancien html.ob-noel::after, z-index 4, passait sur les textes et les boutons). */
  assert.doesNotMatch(noCom,/html\.ob-noel(?::has\([^)]*\))?::(?:after|before)/,'aucun calque posé sur la page entière');
  assert.doesNotMatch(noCom,/position:fixed/,'aucune décoration fixe');
  /* Flocons : seulement au-dessus des titres de section de l’accueil (#home : jamais sur Explorer), dans la marge vide
     réservée (bande de 20 px qui finit 3 px au-dessus du titre ; marges de 24 px et plus, sauf la première section du
     contenu replié « Plus d’idées », 18 px, où la bande et le houx sont retirés). */
  const f=decl('html.ob-noel #home .as-sec::before');
  assert.match(f,/pointer-events:none/);
  assert.match(f,/bottom:calc\(100% \+ 3px\)/);
  assert.ok(px(f,'height')<=21,'bande de flocons dans la marge (3 + 20 px ≤ 24 px)');
  assert.ok(px(f,'right')>=110,'aucun flocon au-dessus du bouton de droite (« Mes tampons » dépasse de 7 px)');
  const h=decl('html.ob-noel #home .hf-avent .as-sec h2::after');
  assert.match(h,/pointer-events:none/);
  assert.ok(px(h,'top')+px(h,'height')<=-2&&px(h,'top')>=-26,'houx entre 26 et 2 px au-dessus du titre');
  const margins=[...['app-shell.css','home-feed.css','cultures.css','fiches-organisation.css','organisation.css'].flatMap(file=>[...read(file).matchAll(/([^{}]*\.as-sec)\{[^}]*margin(?:-top)?:(\d+)px/g)].map(m=>({file,sel:m[1].trim(),mt:+m[2]})))];
  assert.ok(margins.length>=5);
  /* « Ton espace » (.hub-title) : 16 px dans le bloc, lui-même 14 px sous la section précédente. */
  assert.match(read('organisation.css'),/\.ocean-hub \.hub-title\{grid-column:1\/-1;margin:16px 2px 0\}/);
  assert.match(read('home-feed.css'),/#oceanHub\{margin-top:14px\}/);
  for(const {file,sel,mt} of margins){
    if(mt>=24)continue;
    assert.match(noCom,new RegExp('html\\.ob-noel #home '+sel.replace(/[.*+?^${}()|[\]\\>]/g,'\\$&').replace(/\s+/g,'\\s*')+'::before[^{]*\\{display:none\\}'),`${file} : ${sel} (${mt} px) sans bande de flocons`);
  }
  /* Guirlande de la barre d’onglets (mobile) : dans la pilule (son propre contexte d’empilement, position fixe et
     z-index), le long du bord haut, SOUS les boutons (z-index -1) : jamais sur un onglet, jamais sur la page derrière. */
  const nav=decl('html.ob-noel .ocean-v2 .nav::after');
  assert.match(nav,/z-index:-1/);
  const navM=noCom.match(/@media\(max-width:959px\)\{\s*html\.ob-noel \.ocean-v2 \.nav::after\{([^}]*)\}/);
  assert.ok(navM,'règle mobile de la guirlande d’onglets');
  assert.ok(px(navM[1],'top')>=0&&px(navM[1],'top')+px(navM[1],'height')<=16,'dans le haut de la pilule');
  assert.match(read('app-shell.css'),/\.ocean-v2 \.nav,html\[data-act\] \.ocean-v2 \.nav\{\s*position:fixed;z-index:80;/);
  /* Barre du haut (.app-chrome) : rien ne pend sous la barre, donc rien ne passe sur le contenu qui défile. */
  assert.doesNotMatch(noCom,/\.app-chrome::after\{[^}]*bottom:\s*-/,'aucune guirlande pendue sous la barre du haut');
  assert.doesNotMatch(noCom,/--noel-bulbs-svg/,'plus d’ancienne guirlande dessinée');
  /* Paillettes du haut de l’accueil : sous le contenu (z-index -1 dans #home, juste après le fond d’ambiance). */
  const feedCss=read('home-feed.css');
  assert.match(feedCss,/\.hf-noel-sky\{position:absolute;z-index:-1;/);
  assert.match(feedCss,/#home\.hf-on\{position:relative;z-index:0\}/);
  assert.match(read('home-feed.js'),/\(home\.querySelector\(':scope>\.hf-ambient'\)\|\|home\.firstElementChild\)\?\.after\(sky\)/);
  /* Plus d’étoile posée sur l’onglet actif. */
  assert.doesNotMatch(noCom,/\.nav>button[^{]*::after/);
});

test('décor fixe : aucune animation, aucune transition, aucun will-change, aucun canevas animé, rien qui tombe ni qui clignote',()=>{
  /* Décision du fondateur : le décor de Noël ne doit jamais gêner l’utilisation. Fixe, que le mouvement soit réduit ou non. */
  assert.doesNotMatch(noCom,/@keyframes|animation|transition|will-change/,'noel.css : aucune animation, aucune transition, aucun will-change');
  /* Aucune feuille de style du dépôt ne déclare d’animation de Noël (neige, scintillement, respiration des guirlandes). */
  const sheets=fs.readdirSync(root).filter(n=>n.endsWith('.css'));
  assert.ok(sheets.length>20);
  for(const f of sheets){
    const c=read(f).replace(/\/\*[\s\S]*?\*\//g,'');
    assert.doesNotMatch(c,/@keyframes\s+[\w-]*(?:noel|flake|twinkle|snow|garland|sparkle|glitter)/i,f+' : animation de Noël');
    if(f!=='noel.css')assert.doesNotMatch(c,/ob-noel/,f+' : aucun style de Noël hors noel.css');
  }
  /* Bandeau, paillettes et Avent (home-feed.css) : aucune animation ni filtre sur le décor. */
  const feedBlock=feedCssNoCom.slice(feedCssNoCom.indexOf('.hf-noel-top{'),feedCssNoCom.indexOf('.hf-avent{'));
  assert.ok(feedBlock.includes('.hf-noel-sky{')&&feedBlock.includes('.hf-noel-garland{'));
  assert.doesNotMatch(feedBlock,/animation|@keyframes|will-change|filter:/,'bandeau et paillettes de home-feed.css fixes, sans filtre');
  assert.doesNotMatch(feedCssNoCom,/hf-noel-(?:bulbs|wire|twinkle)/,'plus de scintillement des ampoules du bandeau');
  /* Paillettes (canevas du haut de l’accueil) : un dessin posé une fois, aucune boucle d’animation. */
  const part=feedJs.slice(feedJs.indexOf('/* ---------- Mode Noël'),feedJs.indexOf('/* ---------- Fin du mode Noël')).replace(/\/\*[\s\S]*?\*\//g,'');
  assert.ok(part.includes('function skyDraw')&&part.includes('hf-noel-sky'),'canevas des paillettes présent (dessin fixe)');
  assert.doesNotMatch(part,/requestAnimationFrame|cancelAnimationFrame|setInterval|\.animate\(|IntersectionObserver|performance\.now|Math\.random/,'paillettes : aucune boucle, aucun hasard, aucun mouvement');
  assert.doesNotMatch(feedJs.replace(/\/\*[\s\S]*?\*\//g,''),/syncSky|skyFrame|skyLive|flakes\b|skyRun/,'plus de boucle des paillettes dans home-feed.js');
  assert.match(part,/new ResizeObserver\(skyDraw\)/,'redessiné seulement quand la taille change');
  /* Le bandeau de saison n’a plus d’ampoules animées : une bande vide, l’image est posée par noel.css. */
  assert.match(feedJs,/<span class="hf-noel-garland" aria-hidden="true"><\/span>/);
});

test('guirlandes sur fond crème : variante claire, bouts fondus ; variante nuit réservée aux fonds sombres',()=>{
  /* Barre d’onglets (mobile), menu latéral (ordinateur) et bandeau de saison sont sur fond crème : variante claire. */
  assert.match(decl('html.ob-noel .ocean-v2 .nav::after'),/var\(--noel-bulbs-h\)/);
  assert.match(noCom,/@media\(min-width:960px\)\{\s*html\.ob-noel \.ocean-v2 \.nav::after\{[^}]*var\(--noel-bulbs-v\)/);
  assert.match(decl('html.ob-noel .hf-noel-garland','background'),/var\(--noel-bulbs-h\)/);
  /* La variante nuit (halo blanc, invisible sur le crème) ne sert que sur la photo de l’en-tête de la fiche. */
  const re=/([^{}]+)\{([^{}]*var\(--noel-bulbs-nuit\)[^{}]*)\}/g;let m;
  while((m=re.exec(noCom)))for(const sel of m[1].split(','))assert.match(sel.trim(),/#detail \.detail-hero/,'variante nuit hors de la photo : '+sel.trim());
  /* Bouts fondus : la guirlande d’onglets et la verticale ne s’arrêtent pas net au milieu d’un motif. */
  assert.match(decl('html.ob-noel .ocean-v2 .nav::after'),/mask-image:var\(--noel-ends-h\)/);
  assert.match(noCom,/@media\(min-width:960px\)\{\s*html\.ob-noel \.ocean-v2 \.nav::after\{[^}]*mask-image:var\(--noel-ends-v\)/);
  assert.match(noCom,/--noel-ends-h:linear-gradient\(90deg,transparent,black \d+px,black calc\(100% - \d+px\),transparent\)/);
});
