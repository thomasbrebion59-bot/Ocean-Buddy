"""Compatibility entry point: credits and catalogue are now built together."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('build_photo_catalog.py')))
