#!/usr/bin/env python3
"""Traduit la fiche App Store (mobile/store/app-store-fr.md) avec ChatGPT (Codex CLI).

Produit mobile/store/localizations/<langue>.json : name, subtitle, keywords, promotionalText,
description, en respectant les limites d'App Store Connect. Les langues déjà faites sont ignorées.

    python3 scripts/store-translate.py --all [--jobs 4] [--model gpt-6-sol]
"""
import argparse
import concurrent.futures as cf
import importlib.util
import json
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "mobile/store/app-store-fr.md"
OUT = ROOT / "mobile/store/localizations"
spec = importlib.util.spec_from_file_location("i18n_translate", ROOT / "scripts/i18n-translate.py")
tr = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tr)

LIMITS = {"name": 30, "subtitle": 30, "keywords": 100, "promotionalText": 170, "description": 4000}

PROMPT = """You localise the App Store listing of "Ocean Buddy" (free app to discover surf, diving, snorkelling, paddle, kayak and other water-sports spots and plan trips) from French into {language}.
Return ONLY a JSON object with these keys: "name", "subtitle", "keywords", "promotionalText", "description".
Constraints (App Store Connect): name ≤ 30 characters and must stay "Ocean Buddy"; subtitle ≤ 30 characters; keywords ≤ 100 characters in total, comma-separated without spaces after commas, chosen for how people in {language}-speaking markets actually search (do not repeat words from the name); promotionalText ≤ 170 characters; description ≤ 4000 characters, same structure, section titles in capitals, same safety disclaimers, informal friendly tone.
Do not add features, prices, rankings or claims that are not in the source. Keep "Poulpy" unchanged.

French source:
- Sous-titre : {subtitle}
- Mots-clés : {keywords}

Description :
{description}
"""


def source():
    t = SRC.read_text()
    sub = re.search(r"Sous-titre : (.+)", t).group(1).strip()
    kw = re.search(r"Mots-clés : (.+)", t).group(1).strip()
    desc = t.split("## Description", 1)[1].split("\n## ", 1)[0].strip()
    return sub, kw, desc


def one(lang, model):
    sub, kw, desc = source()
    prompt = PROMPT.format(language=tr.NAMES[lang], subtitle=sub, keywords=kw, description=desc)
    for attempt in range(3):
        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp) / "a.txt"
            subprocess.run([tr.CODEX, "exec", "--skip-git-repo-check", "-c", 'sandbox_mode="read-only"', "-m", model,
                            "-o", str(out), "-"], input=prompt, text=True, capture_output=True, cwd=tmp, timeout=1200)
            text = out.read_text() if out.exists() else ""
        try:
            data = json.loads(re.search(r"\{[\s\S]*\}", text).group(0))
            too_long = [k for k, n in LIMITS.items() if len(data.get(k, "")) > n or not data.get(k)]
            if too_long:
                raise ValueError(f"champs hors limites : {too_long}")
            (OUT / f"{lang}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
            return f"{lang} ok"
        except Exception as e:  # noqa: BLE001
            err = str(e)[:200]
    return f"{lang} ÉCHEC ({err})"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("langs", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--model", default="gpt-6-sol")
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    langs = [l for l in (tr.NAMES if a.all else a.langs) if not (OUT / f"{l}.json").exists()]
    with cf.ThreadPoolExecutor(max_workers=a.jobs) as pool:
        for r in pool.map(lambda l: one(l, a.model), langs):
            print(r, flush=True)


if __name__ == "__main__":
    main()
