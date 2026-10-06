/*
 * Ocean Buddy — traduction de l'interface.
 *
 * Le texte source de l'application est en français. Ce module choisit la langue
 * (réglage enregistré, sinon langue de l'appareil), charge le dictionnaire
 * locales/<langue>.js puis traduit à l'affichage le texte des pages et des
 * éléments ajoutés ensuite. Les dictionnaires associent chaque texte français
 * (clé extraite par scripts/i18n-extract.cjs) à sa traduction ; {0}, {1}…
 * remplacent les valeurs variables.
 *
 * Doit être chargé en premier dans <head>, avant tout autre script.
 */
(function () {
  'use strict';

  var LANGS = {
    fr: 'Français', en: 'English', ar: 'العربية', bn: 'বাংলা', ca: 'Català', cs: 'Čeština',
    da: 'Dansk', de: 'Deutsch', el: 'Ελληνικά', es: 'Español', fi: 'Suomi', gu: 'ગુજરાતી',
    he: 'עברית', hi: 'हिन्दी', hr: 'Hrvatski', hu: 'Magyar', id: 'Bahasa Indonesia', it: 'Italiano',
    ja: '日本語', kn: 'ಕನ್ನಡ', ko: '한국어', ml: 'മലയാളം', mr: 'मराठी', ms: 'Bahasa Melayu',
    nb: 'Norsk', nl: 'Nederlands', or: 'ଓଡ଼ିଆ', pa: 'ਪੰਜਾਬੀ', pl: 'Polski',
    'pt-BR': 'Português (Brasil)', 'pt-PT': 'Português (Portugal)', ro: 'Română', ru: 'Русский',
    sk: 'Slovenčina', sl: 'Slovenščina', sv: 'Svenska', ta: 'தமிழ்', te: 'తెలుగు', th: 'ไทย',
    tr: 'Türkçe', uk: 'Українська', ur: 'اردو', vi: 'Tiếng Việt',
    'zh-Hans': '简体中文', 'zh-Hant': '繁體中文'
  };
  var RTL = { ar: 1, he: 1, ur: 1 };
  var VERSIONS = /*VERSIONS*/{"ar":"19039e85f5","bn":"1b535f216f","ca":"b0cb71ff28","cs":"c3ba0206a6","da":"2972e27ac2","de":"c3b1bf46e2","el":"ce66f4d5f6","en":"42f42c64e8","es":"78e81552a9","fi":"43e0fc25d9","gu":"255fe277da","he":"96b239ef39","hi":"09ab8fd7f9","hr":"827c85d3e2","hu":"80d426c41a","id":"643a247be9","it":"97613228f6","ja":"54a723c643","kn":"c194417e12","ko":"27b15eebf8","ml":"a7f90749b5","mr":"fc52724060","ms":"90c156e8a5","nb":"1d5b9c3d84","nl":"70971a6548","or":"e68379e9cf","pa":"f0ead1d5fa","pl":"006e0be1b8","pt-BR":"e3723c9682","pt-PT":"e282075133","ro":"6e242599e9","ru":"e55b1d2b67","sk":"ccc0da6afc","sl":"065e26edda","sv":"332c588bff","ta":"cffcedb1ad","te":"0b0d371dab","th":"dbc3a419c7","tr":"6cb95bcca3","uk":"ff07dad3cf","ur":"867d45741a","vi":"ea91cdabb2","zh-Hans":"eb195043cb","zh-Hant":"fb7c9f65e9"}/*/VERSIONS*/;
  var STORE_KEY = 'oceanbuddy_lang';

  function resolve(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-');
    var low = t.toLowerCase();
    if (LANGS[t]) return t;
    if (low.indexOf('zh') === 0) return /hant|tw|hk|mo/.test(low) ? 'zh-Hant' : 'zh-Hans';
    if (low.indexOf('pt') === 0) return low === 'pt-pt' || low === 'pt-ao' || low === 'pt-mz' ? 'pt-PT' : 'pt-BR';
    if (/^(no|nn|nb)(-|$)/.test(low)) return 'nb';
    if (low === 'iw' || low.indexOf('iw-') === 0) return 'he';
    if (low === 'in' || low.indexOf('in-') === 0) return 'id';
    var base = low.split('-')[0];
    return LANGS[base] ? base : null;
  }

  function pickLanguage() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && resolve(q)) return resolve(q);
    } catch (e) {}
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && LANGS[saved]) return saved;
    } catch (e) {}
    var prefs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (var i = 0; i < prefs.length; i++) {
      var r = resolve(prefs[i]);
      if (r) return r;
    }
    return 'en';
  }

  var lang = pickLanguage();
  // Langue sans dictionnaire : anglais s'il existe, sinon texte source français.
  if (lang !== 'fr' && !VERSIONS[lang]) lang = VERSIONS.en ? 'en' : 'fr';
  var intlTag = lang === 'nb' ? 'nb-NO' : lang;
  var root = document.documentElement;
  root.lang = lang;
  root.dir = RTL[lang] ? 'rtl' : 'ltr';

  var OB = window.OB_I18N = {
    lang: lang,
    locale: intlTag,
    languages: LANGS,
    isRTL: !!RTL[lang],
    dict: null,
    setLanguage: function (code) {
      if (!LANGS[code]) return;
      try { localStorage.setItem(STORE_KEY, code); } catch (e) {}
      try {
        var u = new URL(location.href);
        u.searchParams.delete('lang');
        location.replace(u.toString());
      } catch (e) { location.reload(); }
    },
    t: function (s) { return translate(s); }
  };
  window.OB_LOCALE = intlTag;
  window.obT = OB.t;
  // Nombre décimal dans la langue choisie : 1,8 (fr) · 1.8 (en) · ١٫٨ (ar).
  window.obNum = function (n, digits) {
    var d = digits == null ? 1 : digits;
    try { return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : intlTag, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n); }
    catch (e) { return Number(n).toFixed(d); }
  };

  /* ---------- Formats de date et de nombre ---------- */
  if (lang !== 'fr') {
    var swap = function (loc) {
      if (loc === 'fr-FR' || loc === 'fr' || loc === undefined) return intlTag;
      return loc;
    };
    ['toLocaleDateString', 'toLocaleTimeString', 'toLocaleString'].forEach(function (m) {
      var orig = Date.prototype[m];
      Date.prototype[m] = function (loc, opts) { return orig.call(this, swap(loc), opts); };
    });
    var numOrig = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function (loc, opts) { return numOrig.call(this, swap(loc), opts); };
    ['DateTimeFormat', 'NumberFormat', 'RelativeTimeFormat', 'PluralRules', 'ListFormat'].forEach(function (k) {
      var C = Intl[k];
      if (!C) return;
      var W = function (loc, opts) { return new C(swap(loc), opts); };
      W.prototype = C.prototype;
      W.supportedLocalesOf = C.supportedLocalesOf;
      Intl[k] = W;
    });
  }

  // Liste des langues dans les réglages : <select id="setLang">.
  function languagePicker() {
    var sel = document.getElementById('setLang');
    if (!sel || sel.options.length) return;
    Object.keys(LANGS).filter(function (c) { return c === 'fr' || VERSIONS[c]; })
      .sort(function (a, b) { return LANGS[a].localeCompare(LANGS[b]); })
      .forEach(function (c) {
        var o = document.createElement('option');
        o.value = c;
        o.textContent = LANGS[c];
        o.lang = c;
        if (c === lang) o.selected = true;
        sel.appendChild(o);
      });
    sel.addEventListener('change', function () { OB.setLanguage(sel.value); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', languagePicker);
  else languagePicker();

  // iOS dessine ↗, ▶… en émoji bleu : le sélecteur de variation U+FE0E demande la version texte.
  var EMOJI_ARROW = /([\u2194-\u2199\u21A9\u21AA\u25B6\u25C0])(?![\uFE0E\uFE0F])/g;
  var HAS_ARROW = /[\u2194-\u2199\u21A9\u21AA\u25B6\u25C0](?![\uFE0E\uFE0F])/;
  function textArrows(s) { return s && HAS_ARROW.test(s) ? s.replace(EMOJI_ARROW, '$1\uFE0E') : s; }

  /* Français (pas de dictionnaire) : seules les flèches passent en version texte. */
  function arrowsOnly() {
    var fix = function (node) {
      if (node.nodeType === 3) { var v = node.nodeValue, t = textArrows(v); if (t !== v) node.nodeValue = t; return; }
      if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
      var tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), n, list = [];
      while ((n = tw.nextNode())) if (HAS_ARROW.test(n.nodeValue)) list.push(n);
      for (var i = 0; i < list.length; i++) fix(list[i]);
    };
    fix(document.body);
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var m = records[i];
        if (m.type === 'characterData') fix(m.target);
        else for (var j = 0; j < m.addedNodes.length; j++) fix(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  if (lang === 'fr') { // texte source : rien à traduire, seulement les flèches
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrowsOnly); else arrowsOnly();
    return;
  }

  /* ---------- Chargement du dictionnaire ---------- */
  var base = (function () {
    var s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/i18n\.js(\?.*)?$/, '') : '';
  })();
  if (document.readyState === 'loading' && VERSIONS[lang]) {
    document.write('<script src="' + base + 'locales/' + lang + '.js?v=' + VERSIONS[lang] + '"><\/script>');
  }

  /* ---------- Moteur de traduction ---------- */
  var exact = null;      // texte normalisé -> traduction
  var templates = [];    // [RegExp, traduction avec {n}]
  var byFirstWord = null; // premier mot -> clés longues pour les remplacements partiels
  var hasRich = false;   // le dictionnaire contient des phrases avec balises <b>…</b>

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function prepare() {
    if (exact) return true;
    var d = window.OB_I18N_DICT;
    if (!d) return false;
    OB.dict = d;
    exact = Object.create(null);
    byFirstWord = Object.create(null);
    Object.keys(d).forEach(function (k) {
      var v = d[k];
      if (!v) return;
      var nk = norm(k);
      // Un gabarit identique (« Expert {0} » en anglais) reste utile : ses valeurs se traduisent.
      if (v === k && !(/\{\d+\}/.test(nk) && /[A-Za-zÀ-ÿ]{2}/.test(nk.replace(/\{\d+\}/g, '')))) return;
      if (/<\/?(b|strong|em|i|span)>|<br>/.test(nk)) hasRich = true;
      if (/\{\d+\}/.test(nk)) {
        var parts = nk.split(/\{(\d+)\}/);
        var re = '';
        for (var i = 0; i < parts.length; i++) re += i % 2 ? '(.*?)' : escapeRe(parts[i]);
        // Une valeur vide (icône, balise) rend facultatif l'espace voisin ; une valeur non vide
        // garde son espace (« {0} jour » ne reconnaît pas « Bonjour »).
        re = re.replace(/\(\.\*\?\) /g, '(?:(.*?) )?').replace(/ \(\.\*\?\)/g, '(?: (.*?))?');
        var order = [];
        for (var j = 1; j < parts.length; j += 2) order.push(+parts[j]);
        templates.push([new RegExp('^' + re + '$'), v, order, nk.replace(/\{\d+\}/g, '').length]);
      } else {
        exact[nk] = v;
        if (nk.length >= 8 && /\s/.test(nk) && nk.indexOf('<') < 0) {
          var w = nk.split(' ')[0];
          (byFirstWord[w] = byFirstWord[w] || []).push(nk);
        }
      }
    });
    templates.sort(function (a, b) { return b[3] - a[3]; });
    Object.keys(byFirstWord).forEach(function (w) { byFirstWord[w].sort(function (a, b) { return b.length - a.length; }); });
    return true;
  }

  // Valeur insérée dans un gabarit : « 3 sessions », « surf » (nom d'activité en minuscules).
  var LOWER_OK = /^(en|es|it|pt|ca|ro|nl|sv|da|nb|fi|pl|cs|sk|sl|hr|hu|tr|id|ms|vi|ru|uk|el)/;
  function value(val, whole) {
    var nv = norm(val);
    if (!nv) return val;
    var tv = exact[nv];
    if (tv === undefined && nv.length < whole.length) tv = lookup(nv);
    if (tv === undefined && /^[a-zà-ÿ]/.test(nv)) {
      var cap = exact[nv.charAt(0).toUpperCase() + nv.slice(1)];
      if (cap !== undefined) tv = LOWER_OK.test(lang) && cap.charAt(1) === cap.charAt(1).toLowerCase() ? cap.charAt(0).toLowerCase() + cap.slice(1) : cap;
    }
    return tv === undefined ? val : tv;
  }

  // Traduction exacte ou par gabarit {0} ; undefined si le texte est inconnu.
  function lookup(nt) {
    var hit = exact[nt];
    if (hit !== undefined) return hit;
    for (var i = 0; i < templates.length; i++) {
      var m = templates[i][0].exec(nt);
      if (m) {
        var order = templates[i][2];
        return templates[i][1].replace(/\{(\d+)\}/g, function (_, n) {
          var idx = order.indexOf(+n);
          var val = (idx >= 0 && m[idx + 1]) || '';
          return value(val, nt);
        });
      }
    }
    return undefined;
  }

  function translate(text) {
    if (!text || !prepare()) return text;
    var nt = norm(text);
    if (!nt) return text;
    var hit = lookup(nt);
    if (hit === undefined && nt.indexOf(' · ') > 0) hit = joined(nt, ' · ');
    if (hit === undefined && nt.indexOf(', ') > 0) hit = joined(nt, ', ');
    if (hit === undefined) hit = partial(nt);
    if (hit === undefined || hit === nt) return text;
    var lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    return lead + hit + trail;
  }

  /* Libellés assemblés : « Surf · Intermédiaire », « Surf, Plongée, Baignade ». Avec « · », chaque
     morceau est traduit s'il est connu ; avec « , », seulement si tous les morceaux sont connus. */
  function joined(nt, sep) {
    var parts = nt.split(sep), changed = false, strict = sep === ', ';
    for (var i = 0; i < parts.length; i++) {
      var h = lookup(parts[i]);
      if (h === undefined && !strict) h = parts[i].indexOf(', ') > 0 ? joined(parts[i], ', ') : partial(parts[i]);
      if (h === undefined) { if (strict) return undefined; continue; }
      if (h !== parts[i]) changed = true;
      parts[i] = h;
    }
    return changed ? parts.join(sep) : undefined;
  }

  // Premiers mots de noms de lieux (« La Gravière », « Plage de… ») : ne pas les traduire seuls.
  var TOPONYM = {};
  ('La Le Les L’ Un Une Des Du De Au Aux Plage Mer Baie Pointe Île Îles Cap Côte Lac Port Anse Grand Grande Petit Petite ' +
   'Saint Sainte Mont Récif Golfe Passe Rocher Roche Dune Étang Crique Calanque Porto Praia Playa Punta Ponta').split(' ')
    .forEach(function (w) { TOPONYM[w] = 1; });

  // Remplace les phrases connues contenues dans un texte plus long (concaténations).
  function partial(nt) {
    var words = nt.split(' ');
    if (words.length < 2) return undefined;
    var out = '', i = 0, changed = false, pos = 0;
    while (i < words.length) {
      var rest = nt.slice(pos);
      var cands = byFirstWord[words[i]];
      var done = false;
      if (cands) {
        for (var c = 0; c < cands.length; c++) {
          var k = cands[c];
          if (rest.indexOf(k) === 0 && (rest.length === k.length || /[\s,.;:!?)»"'’—–-]/.test(rest[k.length]))) {
            out += exact[k];
            pos += k.length;
            i += k.split(' ').length;
            changed = true;
            done = true;
            break;
          }
        }
      }
      if (!done && i === 0 && exact[words[0]] !== undefined && /^[A-ZÀ-Ö]/.test(words[0]) && !TOPONYM[words[0]]) {
        // verbe ou libellé en tête suivi d'un nom propre : « Explorer » + nom du spot
        out += exact[words[0]];
        pos += words[0].length;
        i++;
        changed = true;
        done = true;
      }
      if (!done) {
        out += words[i];
        pos += words[i].length;
        i++;
      }
      if (i < words.length) { out += ' '; pos += 1; }
    }
    return changed ? out : undefined;
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'aria-valuetext', 'alt', 'data-tip'];
  var done = new WeakMap(); // nœud texte -> valeur déjà traduite

  // Le texte d'un <textarea> appartient à l'utilisateur, mais son placeholder se traduit.
  function attrsAllowed(el) {
    return el.tagName === 'TEXTAREA' ? !skipped(el.parentNode) : !skipped(el);
  }

  function skipped(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] || e.isContentEditable || e.getAttribute('translate') === 'no' || e.hasAttribute('data-no-i18n')) return true;
    }
    return false;
  }

  /* Phrases avec mots en gras : « ne retiens <b>jamais</b> ta respiration » est traduite d'un bloc
     (clé extraite avec ses balises) plutôt que morceau par morceau. */
  var INLINE = { B: 1, STRONG: 1, EM: 1, I: 1, SPAN: 1 };
  var richDone = new WeakMap(); // élément -> contenu riche déjà traduit

  function richKey(el) {
    var s = '', tags = false;
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) s += c.nodeValue;
      else if (c.nodeType === 1 && c.tagName === 'BR' && !c.attributes.length) { s += '<br>'; tags = true; }
      else if (c.nodeType === 1 && INLINE[c.tagName] && !c.attributes.length && !c.firstElementChild) {
        var tg = c.tagName.toLowerCase();
        s += '<' + tg + '>' + c.textContent + '</' + tg + '>';
        tags = true;
      } else if (c.nodeType !== 8) return null;
    }
    return tags ? norm(s) : null;
  }

  function doRich(el) {
    if (!hasRich || !el || el.nodeType !== 1 || (INLINE[el.tagName] && !el.attributes.length)) return false;
    var key = richKey(el);
    if (!key) return false;
    if (richDone.get(el) === key) return true;
    var t = lookup(key);
    if (t === undefined || t === key) return false;
    // Construit le résultat sans innerHTML : seules les balises b/strong/em/i sont recréées.
    var frag = document.createDocumentFragment(), stack = [frag], re = /<(\/?)(b|strong|em|i|span)>|<br>/g, last = 0, m;
    var text = function (str) { if (str) stack[stack.length - 1].appendChild(document.createTextNode(str)); };
    while ((m = re.exec(t))) {
      text(t.slice(last, m.index));
      last = re.lastIndex;
      if (!m[2]) stack[stack.length - 1].appendChild(document.createElement('br'));
      else if (!m[1]) { var e = document.createElement(m[2]); stack[stack.length - 1].appendChild(e); stack.push(e); }
      else if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === m[2]) stack.pop();
    }
    text(t.slice(last));
    var tw = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT), n;
    while ((n = tw.nextNode())) { n.nodeValue = textArrows(flipArrows(n.nodeValue)); done.set(n, n.nodeValue); }
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
    richDone.set(el, richKey(el));
    return true;
  }

  // En arabe, hébreu et ourdou, « suivant → » et « A → B → C » se lisent vers la gauche.
  var ARROWS = { '→': '←', '←': '→', '↗': '↖', '↖': '↗', '↘': '↙', '↙': '↘' };
  function flipArrows(s) {
    return OB.isRTL && s ? s.replace(/[→←↗↖↘↙]/g, function (a) { return ARROWS[a]; }) : s;
  }

  // Mesures écrites à la française dans le catalogue (« 1,8 m ») : séparateur décimal de la langue.
  var DEC = (function () { try { return new Intl.NumberFormat(intlTag).format(1.5).charAt(1); } catch (e) { return ','; } })();
  function localNumbers(s) {
    return DEC === ',' || !s ? s : s.replace(/(\d),(\d+)(?=\s?(?:m\b|km|kn|nœuds|°|h\b|s\b|%|mm))/g, '$1' + DEC + '$2');
  }

  function doText(node) {
    var v = node.nodeValue;
    if (v && HAS_ARROW.test(v) && !/[A-Za-zÀ-ÿ]/.test(v)) { var ta = textArrows(v); done.set(node, ta); if (ta !== v) node.nodeValue = ta; return; }
    if (!v || !/[A-Za-zÀ-ÿ]/.test(v) || done.get(node) === v) return;
    if (skipped(node.parentNode)) return;
    var p = node.parentNode;
    if (p && INLINE[p.tagName] && !p.attributes.length) p = p.parentNode;
    if (doRich(p)) return;
    var t = textArrows(localNumbers(flipArrows(translate(v))));
    done.set(node, t);
    if (t !== v) node.nodeValue = t;
  }

  var attrDone = new WeakMap(); // élément -> { attribut: valeur déjà traduite }

  function doAttrs(el) {
    var memo = attrDone.get(el);
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      // Une valeur déjà traduite n'est pas retraduite : sinon un gabarit comme « {0} spot{1} » peut
      // reconnaître sa propre traduction et allonger le texte sans fin (page bloquée).
      if (memo && memo[a] === v) continue;
      var t = translate(v);
      if (!memo) attrDone.set(el, memo = {});
      memo[a] = t;
      if (t !== v) el.setAttribute(a, t);
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) {
      var tv = translate(el.value);
      if (tv !== el.value) el.value = tv;
    }
  }

  function walk(rootNode) {
    if (!rootNode) return;
    if (rootNode.nodeType === 3) { doText(rootNode); return; }
    if (rootNode.nodeType !== 1 && rootNode.nodeType !== 9 && rootNode.nodeType !== 11) return;
    if (rootNode.nodeType === 1) {
      if (attrsAllowed(rootNode)) doAttrs(rootNode);
      if (skipped(rootNode)) return;
    }
    // Liste figée avant traduction : doRich() reconstruit certains éléments, et un TreeWalker posé
    // sur un nœud retiré s'arrêterait là, laissant tout le reste de la page en français.
    var tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var nodes = [], n;
    while ((n = tw.nextNode())) nodes.push(n);
    for (var i = 0; i < nodes.length; i++) {
      n = nodes[i];
      if (n.nodeType === 3) { if (n.parentNode) doText(n); }
      else if (!SKIP[n.tagName] || n.tagName === 'TEXTAREA') doAttrs(n);
    }
  }

  function start() {
    if (!prepare()) return;
    document.title = translate(document.title);
    var metas = document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]');
    for (var k = 0; k < metas.length; k++) metas[k].setAttribute('content', translate(metas[k].getAttribute('content')));
    walk(document.body);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') { if (m.target.nodeType === 1 && attrsAllowed(m.target)) doAttrs(m.target); }
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* ---------- Boîtes de dialogue natives ---------- */
  ['alert', 'confirm', 'prompt'].forEach(function (k) {
    var orig = window[k];
    if (typeof orig !== 'function') return;
    window[k] = function (msg) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof msg === 'string') args[0] = translate(msg);
      return orig.apply(window, args);
    };
  });
})();
