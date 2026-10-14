/* Pages jetables pour `node scripts/check-boot.mjs --self-test` : l'une respecte le contrat de démarrage, l'autre décale le contenu après la levée du rideau.
 * Throwaway pages for --self-test: one honours the boot contract, the other shifts content after the lift. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const page = (bad) => `<!doctype html><html lang="fr" class="ob-booting"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>
window.__seedReady=true;
window.OceanBoot={t0:performance.now(),lifted:false,liftedAt:null,reason:null,ready(reason){if(this.lifted)return;this.lifted=true;this.liftedAt=performance.now();this.reason=reason||'ready';
 document.documentElement.classList.remove('ob-booting');var c=document.getElementById('obBoot');if(c){c.style.opacity=0;setTimeout(function(){c.remove()},300);}
 window.dispatchEvent(new CustomEvent('ocean:home-ready',{detail:{reason:this.reason}}));}};
setTimeout(function(){OceanBoot.ready('timeout')},4000);
</script>
<style>
html,body{margin:0;height:100%}body{font:16px sans-serif;background:#eaf3f7}
#obBoot{position:fixed;inset:0;z-index:999;background:#0a2540;color:#fff;display:grid;place-items:center;transition:opacity .25s}
html.ob-booting #screenWrap{visibility:hidden}
#screenWrap{position:absolute;inset:0 0 70px 0;overflow-y:auto}
.hf-top{height:300px;background:linear-gradient(135deg,#0a7ea4,#f4a261 60%,#e76f51)}
.card{height:120px;margin:12px;border-radius:14px}
.nav{position:fixed;left:0;right:0;bottom:0;height:70px;display:flex;background:#fff}.nav button{flex:1;border:0;background:#fff}
.toast{position:fixed;bottom:90px;left:20px;opacity:0}
</style></head><body>
<div id="obBoot">Ocean Buddy</div>
<div id="onb" style="display:none">Bienvenue</div>
<div id="screenWrap"><div id="home"><div class="hf-top"></div><div class="hf-feed"></div></div></div>
<nav class="nav"><button>Accueil</button><button>Spots</button><button>Voyages</button><button>Profil</button></nav>
<div class="toast" id="toast"></div>
<script>
var cols=['#264653','#2a9d8f','#e9c46a','#f4a261','#e76f51','#8ab17d'];
function feed(){document.querySelector('.hf-feed').innerHTML=cols.map(function(c){return '<div class="card" style="background:'+c+'"></div>'}).join('');}
feed();
setTimeout(function(){OceanBoot.ready('ready')},700);
${bad ? `window.addEventListener('ocean:home-ready',function(){setTimeout(function(){var b=document.createElement('div');b.style.cssText='height:180px;background:#c1121f';document.getElementById('home').prepend(b);feed();},900)});` : ''}
</script></body></html>`;

export function makeFixtures() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-bootcheck-fx-'));
  const out = {};
  for (const [name, bad] of [['good', false], ['shifting', true]]) {
    const dir = path.join(base, name); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'index.html'), page(bad)); out[name] = dir;
  }
  return { base, ...out };
}
