/* Unités d'affichage (lot 1, nov. 2026) : logique pure, sans DOM. Le même fichier sert dans l'app (window.OceanUnits)
   et dans les tests Node (tests/conditions-lot1.test.js).

   Trois réglages indépendants, gardés dans oceanbuddy_units (préférence : elle suit l'appareil) :
     wind   'kmh' (défaut) ou 'kn'    vent et rafales : kilomètres par heure ou nœuds ;
     length 'm'   (défaut) ou 'ft'    hauteur de houle : mètres ou pieds ;
     temp   'C'   (défaut) ou 'F'     eau et air : °C ou °F.
   Toutes les valeurs de l'app restent en unités métriques (modèles, seuils, relevés gardés, calculs de verdict) : seul
   l'affichage convertit. Un nombre n'est jamais converti deux fois, et un seuil écrit en texte (« 10, 20, 30 km/h »)
   reste dans son unité source : il se lit comme un repère, pas comme un relevé.

   convert(kind, valeur, unités) -> { v, d, unit }   v : nombre arrondi à d décimales (0 ou 1), unit : « km/h », « kn », « m », « ft », « °C », « °F ».
   text(kind, valeur, unités, fmt) -> « 12 km/h » ou « 6 kn » ; fmt(nombre, décimales) écrit le nombre dans la langue.
   convertText(chaîne, unités, fmt) -> la même chaîne avec ses valeurs « 12 km/h », « 1,8 m » et « 17 °C » converties ;
     pour les textes de relevé produits par app.js (« 12 km/h NO », « 1,8 m », « 17 °C »), jamais pour une phrase libre. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OceanUnits = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const root = typeof window !== 'undefined' ? window : globalThis;
  'use strict';
  const KEY = 'oceanbuddy_units';
  const KN_PER_KMH = 1 / 1.852, FT_PER_M = 3.280839895;
  const DEFAULTS = Object.freeze({ wind: 'kmh', length: 'm', temp: 'C' });
  const CHOICES = Object.freeze({ wind: ['kmh', 'kn'], length: ['m', 'ft'], temp: ['C', 'F'] });
  const num = v => (v != null && v !== '' && Number.isFinite(+v) ? +v : null);

  /* Réglages lus d'une chaîne (ou d'un objet) : toute valeur inconnue retombe sur le défaut, jamais d'erreur. */
  function normalize(raw) {
    let o = raw;
    if (typeof raw === 'string') { try { o = JSON.parse(raw); } catch (e) { o = null; } }
    const out = Object.assign({}, DEFAULTS);
    if (o && typeof o === 'object') for (const k of Object.keys(CHOICES)) if (CHOICES[k].includes(o[k])) out[k] = o[k];
    return out;
  }
  const withChoice = (cur, patch) => normalize(Object.assign({}, normalize(cur), patch || {}));
  const isDefault = u => { const n = normalize(u); return Object.keys(DEFAULTS).every(k => n[k] === DEFAULTS[k]); };

  const round = (v, d) => { const p = d ? 10 : 1; return Math.round(v * p) / p; };
  /* kind : 'wind' (km/h), 'length' (m), 'temp' (°C), les valeurs d'entrée étant toujours métriques. */
  function convert(kind, value, units) {
    const v = num(value); if (v == null) return null;
    const u = normalize(units);
    if (kind === 'wind') return u.wind === 'kn' ? { v: round(v * KN_PER_KMH, 0), d: 0, unit: 'kn' } : { v: round(v, 0), d: 0, unit: 'km/h' };
    if (kind === 'length') return u.length === 'ft' ? { v: round(v * FT_PER_M, 1), d: 1, unit: 'ft' } : { v: round(v, 1), d: 1, unit: 'm' };
    if (kind === 'temp') return u.temp === 'F' ? { v: round(v * 9 / 5 + 32, 0), d: 0, unit: '°F' } : { v: round(v, 0), d: 0, unit: '°C' };
    return null;
  }
  const plain = (n, d) => (d ? n.toFixed(d) : String(n));
  function text(kind, value, units, fmt) {
    const c = convert(kind, value, units); if (!c) return '';
    return `${(fmt || plain)(c.v, c.d)} ${c.unit}`;
  }
  /* Nombre écrit à la française ou à l'anglaise (« 1,8 » ou « 1.8 ») : lu en nombre. */
  const read = s => +String(s).replace(',', '.');
  const NUM = '(-?\\d+(?:[.,]\\d+)?)';
  function convertText(str, units, fmt) {
    if (str == null) return str;
    const u = normalize(units);
    if (isDefault(u)) return String(str);
    let out = String(str);
    if (u.wind === 'kn') out = out.replace(new RegExp(NUM + '(\\s*)km/h', 'g'), (m, n, sp) => text('wind', read(n), u, fmt).replace(' ', sp || ' '));
    if (u.length === 'ft') out = out.replace(new RegExp(NUM + '(\\s*)m(?![\\w²/])', 'g'), (m, n, sp) => text('length', read(n), u, fmt).replace(' ', sp || ' '));
    if (u.temp === 'F') out = out.replace(new RegExp(NUM + '(\\s*)°\\s?C', 'g'), (m, n, sp) => text('temp', read(n), u, fmt).replace(' ', sp || ' '));
    return out;
  }
  const unitLabel = (kind, units) => { const c = convert(kind, 0, units); return c ? c.unit : ''; };


  /* ---------- Dans l'app : réglages lus et écrits sur l'appareil, nombres dans la langue choisie ---------- */
  const store = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } };
  function get() { const s = store(); let raw = null; try { raw = s && s.getItem(KEY); } catch (e) {} return normalize(raw); }
  function set(patch) {
    const next = withChoice(get(), patch), s = store();
    try { if (s) s.setItem(KEY, JSON.stringify(next)); } catch (e) {}
    try { if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('ocean:units', { detail: next })); } catch (e) {}
    return next;
  }
  const fmt = (n, d) => (typeof root.obNum === 'function' ? root.obNum(n, d) : plain(n, d));
  const show = (kind, value) => text(kind, value, get(), fmt);
  const showText = str => convertText(str, get(), fmt);
  const showConvert = (kind, value) => convert(kind, value, get());

  /* Réglages > Affichage et son : trois interrupteurs (vent en nœuds, houle en pieds, températures en °F). */
  const SWITCHES = [['setUnitWind', 'wind', 'kn', 'kmh'], ['setUnitLength', 'length', 'ft', 'm'], ['setUnitTemp', 'temp', 'F', 'C']];
  function syncSettings() {
    if (typeof document === 'undefined') return;
    const cur = get();
    for (const [id, k, on] of SWITCHES) { const el = document.getElementById(id); if (el) el.checked = cur[k] === on; }
  }
  function bindSettings() {
    if (typeof document === 'undefined') return;
    for (const [id, k, on, off] of SWITCHES) {
      const el = document.getElementById(id);
      if (el && !el._obUnits) { el._obUnits = true; el.addEventListener('change', () => set({ [k]: el.checked ? on : off })); }
    }
    syncSettings();
  }
  bindSettings();

  return { KEY, DEFAULTS, CHOICES, normalize, withChoice, isDefault, convert, text, convertText, unitLabel, KN_PER_KMH, FT_PER_M, get, set, show, showText, showConvert, fmt, syncSettings, bindSettings };
});
