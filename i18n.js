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
  var VERSIONS = /*VERSIONS*/{"ar":"9d7f017206","bn":"67f048878d","ca":"ed1214099c","cs":"c8cdf7b23a","da":"9c0da22f29","de":"597f902989","el":"d96f7cb88d","en":"11853e8354","es":"1b18eced3a","fi":"162d241cf5","gu":"5a90014dde","he":"b89b910bc3","hi":"4af8a2b84b","hr":"f06ab97ccc","hu":"0ec4f7788f","id":"4f33d7437d","it":"36a1de1558","ja":"923643ca37","kn":"d2c10fd960","ko":"f7198d8523","ml":"9d6b032848","mr":"025856dfaf","ms":"cbb930b194","nb":"ad3039500e","nl":"b82ce0687f","or":"a845cc00e2","pa":"c639184f03","pl":"d20bed3523","pt-BR":"29daf02ee0","pt-PT":"bfbc69991d","ro":"3c34a9209e","ru":"b382999379","sk":"6cf9a9d475","sl":"0816527fa3","sv":"6f67e07600","ta":"47059b8205","te":"72520a65c1","th":"d8a0ebc90c","tr":"e32d7d07b8","uk":"44b80373a5","ur":"fea25690ea","vi":"35bf49f029","zh-Hans":"595aefab55","zh-Hant":"a99a3b7ccc"}/*/VERSIONS*/;
  var STORE_KEY = 'oceanbuddy_lang';

  function resolve(tag) {
    if (!tag) return null;
    var t = String(tag).replace('_', '-');
    var low = t.toLowerCase();
    if (LANGS[t]) return t;
    if (low.indexOf('zh') === 0) return /hant|tw|hk|mo/.test(low) ? 'zh-Hant' : 'zh-Hans';
    if (low.indexOf('pt') === 0) return low === 'pt-pt' || low === 'pt-ao' || low === 'pt-mz' ? 'pt-PT' : 'pt-BR';
    if (low === 'no' || low === 'nn' || low.indexOf('nb') === 0 || low.indexOf('no-') === 0) return 'nb';
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

  if (lang === 'fr') return; // texte source : rien à traduire

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
      if (!v || v === k) return;
      var nk = norm(k);
      if (/\{\d+\}/.test(nk)) {
        var parts = nk.split(/\{(\d+)\}/);
        var re = '';
        for (var i = 0; i < parts.length; i++) re += i % 2 ? '(.*?)' : escapeRe(parts[i]);
        // Une valeur vide (icône, balise) laisse l'espace voisin facultatif.
        re = re.replace(/ \(\.\*\?\)/g, ' ?(.*?)').replace(/\(\.\*\?\) /g, '(.*?) ?');
        var order = [];
        for (var j = 1; j < parts.length; j += 2) order.push(+parts[j]);
        templates.push([new RegExp('^' + re + '$'), v, order, nk.replace(/\{\d+\}/g, '').length]);
      } else {
        exact[nk] = v;
        if (nk.length >= 8 && /\s/.test(nk)) {
          var w = nk.split(' ')[0];
          (byFirstWord[w] = byFirstWord[w] || []).push(nk);
        }
      }
    });
    templates.sort(function (a, b) { return b[3] - a[3]; });
    Object.keys(byFirstWord).forEach(function (w) { byFirstWord[w].sort(function (a, b) { return b.length - a.length; }); });
    return true;
  }

  function translate(text) {
    if (!text || !prepare()) return text;
    var nt = norm(text);
    if (!nt) return text;
    var hit = exact[nt];
    if (hit === undefined) {
      for (var i = 0; i < templates.length; i++) {
        var m = templates[i][0].exec(nt);
        if (m) {
          var order = templates[i][2];
          hit = templates[i][1].replace(/\{(\d+)\}/g, function (_, n) {
            var idx = order.indexOf(+n);
            var val = idx >= 0 ? m[idx + 1] : '';
            return exact[norm(val)] || val;
          });
          break;
        }
      }
    }
    if (hit === undefined) hit = partial(nt);
    if (hit === undefined || hit === nt) return text;
    var lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
    return lead + hit + trail;
  }

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
      if (!done && i === 0 && exact[words[0]] !== undefined && /^[A-ZÀ-Ö]/.test(words[0])) {
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
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'data-tip'];
  var done = new WeakMap(); // nœud texte -> valeur déjà traduite

  function skipped(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.tagName] || e.isContentEditable || e.getAttribute('translate') === 'no' || e.hasAttribute('data-no-i18n')) return true;
    }
    return false;
  }

  function doText(node) {
    var v = node.nodeValue;
    if (!v || !/[A-Za-zÀ-ÿ]/.test(v) || done.get(node) === v) return;
    if (skipped(node.parentNode)) return;
    var t = translate(v);
    done.set(node, t);
    if (t !== v) node.nodeValue = t;
  }

  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute(a)) continue;
      var v = el.getAttribute(a);
      var t = translate(v);
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
      if (skipped(rootNode)) return;
      doAttrs(rootNode);
    }
    var tw = document.createTreeWalker(rootNode, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) doText(n);
      else if (!SKIP[n.tagName]) doAttrs(n);
    }
  }

  function start() {
    if (!prepare()) return;
    document.title = translate(document.title);
    walk(document.body);
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') { if (m.target.nodeType === 1 && !skipped(m.target)) doAttrs(m.target); }
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
