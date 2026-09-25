#!/usr/bin/env python3
"""Traduit locales/source/fr.json avec ChatGPT (Codex CLI) vers locales/translations/<langue>.json.

Seuls les textes absents du fichier de traduction sont envoyés : relancer le script après
une nouvelle extraction ne traduit que les nouveautés. Chaque lot est vérifié (nombre de
textes, variables {0}, {1}…) avant d'être enregistré.

    python3 scripts/i18n-translate.py en es de        # langues choisies
    python3 scripts/i18n-translate.py --all           # toutes les langues de i18n.js
Options : --model gpt-6-sol  --batch 300  --jobs 6
"""
import argparse
import concurrent.futures as cf
import json
import os
import pathlib
import re
import subprocess
import tempfile
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "locales" / "source" / "fr.json"
OUT = ROOT / "locales" / "translations"
CODEX = os.environ.get("CODEX_BIN", str(pathlib.Path.home() / ".local/bin/codex"))

NAMES = {
    "en": "English", "ar": "Arabic", "bn": "Bengali", "ca": "Catalan", "cs": "Czech", "da": "Danish",
    "de": "German", "el": "Greek", "es": "Spanish (neutral, for Spain and Latin America)", "fi": "Finnish",
    "gu": "Gujarati", "he": "Hebrew", "hi": "Hindi", "hr": "Croatian", "hu": "Hungarian",
    "id": "Indonesian", "it": "Italian", "ja": "Japanese", "kn": "Kannada", "ko": "Korean",
    "ml": "Malayalam", "mr": "Marathi", "ms": "Malay", "nb": "Norwegian Bokmål", "nl": "Dutch",
    "or": "Odia", "pa": "Punjabi (Gurmukhi)", "pl": "Polish", "pt-BR": "Brazilian Portuguese",
    "pt-PT": "European Portuguese", "ro": "Romanian", "ru": "Russian", "sk": "Slovak",
    "sl": "Slovenian", "sv": "Swedish", "ta": "Tamil", "te": "Telugu", "th": "Thai", "tr": "Turkish",
    "uk": "Ukrainian", "ur": "Urdu", "vi": "Vietnamese", "zh-Hans": "Simplified Chinese",
    "zh-Hant": "Traditional Chinese (Taiwan)",
}

PROMPT = """You are a professional app localiser. Translate the user-interface texts of "Ocean Buddy", a friendly mobile app for discovering surf, diving, snorkelling, kitesurf, windsurf, sailing, paddle and swimming spots around the world and planning trips, from French into {language}.

Rules:
- Return ONLY a JSON array of strings, same length and same order as the input array, no commentary, no code fence.
- Keep placeholders such as {{0}}, {{1}} exactly, once each; you may move them to fit the grammar.
- Keep emojis, arrows, numbers, units (m, km, °C, kn), URLs and e-mail addresses unchanged.
- Keep proper nouns unchanged (spot, beach, reef, island and place names, "Ocean Buddy", "Poulpy", "Open-Meteo", "Wikimedia Commons"), unless the place has a well-established name in {language}.
- The app speaks informally to one person (French "tu"): use the natural informal/friendly register of {language}.
- Safety and legal texts must stay precise: do not add, remove or soften warnings.
- Short labels (buttons, tabs, filters) stay short. Keep leading/trailing punctuation such as "…", ":" and " ·".
- If a string is not translatable text (a code, a name, a file name), return it unchanged.
- Glossary (French → meaning): "conditions" = sea and weather conditions (not terms and conditions, except in legal texts); "spot" = surf/dive/water-sports spot (keep "spot" if usual in {language}); "houle" = swell; "marée" = tide; "vent offshore/onshore" = offshore/onshore wind; "étape" = stop on a trip itinerary; "voyage" = trip; "carnet" = notebook/journal; "fiche" = spot page; "niveau" = skill level; "débutant/intermédiaire/confirmé/expert" = beginner/intermediate/advanced/expert; "baïne" = rip-current channel on French Atlantic beaches; "Poulpy" is the octopus mascot and guide.

Input:
{payload}
"""

lock = threading.Lock()


def load(path, default):
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def placeholders(s):
    return sorted(re.findall(r"\{\d+\}", s))


def ask(model, language, batch):
    prompt = PROMPT.format(language=language, payload=json.dumps(batch, ensure_ascii=False, indent=0))
    with tempfile.TemporaryDirectory() as tmp:
        out = pathlib.Path(tmp) / "answer.txt"
        subprocess.run(
            [CODEX, "exec", "--skip-git-repo-check", "-c", 'sandbox_mode="read-only"', "-m", model,
             "-o", str(out), "-"],
            input=prompt, text=True, capture_output=True, cwd=tmp, timeout=1800,
        )
        text = out.read_text() if out.exists() else ""
    m = re.search(r"\[[\s\S]*\]", text)
    if not m:
        raise ValueError("réponse sans tableau JSON")
    result = json.loads(m.group(0))
    if not isinstance(result, list) or len(result) != len(batch):
        raise ValueError(f"{len(result) if isinstance(result, list) else '?'} textes reçus pour {len(batch)}")
    for src, dst in zip(batch, result):
        if not isinstance(dst, str) or placeholders(src) != placeholders(dst):
            raise ValueError(f"variables modifiées : {src!r} -> {dst!r}")
    return result


def run_batch(lang, model, batch, attempts=3):
    for n in range(1, attempts + 1):
        try:
            res = ask(model, NAMES[lang], batch)
            path = OUT / f"{lang}.json"
            with lock:
                data = load(path, {})
                data.update(dict(zip(batch, res)))
                path.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + "\n")
            return len(batch), None
        except Exception as e:  # noqa: BLE001 - on réessaie puis on rapporte
            err = str(e)[:300]
            time.sleep(5 * n)
    return 0, f"{lang}: lot de {len(batch)} textes non traduit ({err})"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("langs", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--model", default="gpt-6-sol")
    ap.add_argument("--batch", type=int, default=300)
    ap.add_argument("--jobs", type=int, default=6)
    a = ap.parse_args()
    langs = list(NAMES) if a.all else a.langs
    unknown = [l for l in langs if l not in NAMES]
    if unknown or not langs:
        raise SystemExit(f"Langues inconnues ou absentes : {unknown or '(aucune)'}")
    OUT.mkdir(parents=True, exist_ok=True)
    source = load(SOURCE, [])
    jobs = []
    for lang in langs:
        done = load(OUT / f"{lang}.json", {})
        todo = [s for s in source if s not in done]
        for i in range(0, len(todo), a.batch):
            jobs.append((lang, todo[i:i + a.batch]))
    print(f"{len(jobs)} lots à traduire ({sum(len(b) for _, b in jobs)} textes) avec {a.model}", flush=True)
    errors, total = [], 0
    with cf.ThreadPoolExecutor(max_workers=a.jobs) as pool:
        futures = {pool.submit(run_batch, lang, a.model, b): lang for lang, b in jobs}
        for f in cf.as_completed(futures):
            n, err = f.result()
            total += n
            print(f"[{time.strftime('%H:%M:%S')}] {futures[f]} +{n} (total {total})" + (f" ERREUR {err}" if err else ""), flush=True)
            if err:
                errors.append(err)
    print(f"Terminé : {total} textes traduits, {len(errors)} lot(s) en échec.", flush=True)
    for e in errors:
        print("  -", e)


if __name__ == "__main__":
    main()
