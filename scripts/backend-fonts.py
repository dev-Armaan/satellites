#!/usr/bin/env python3
"""
Build the static fonts the OG card renderer (api/og.tsx, satori) needs.

satori cannot read variable fonts or WOFF2, so we instance the self-hosted variable fonts at the
exact axis positions the design system uses on the web, and write plain TTFs:

  display  Instrument Sans   wdth 75   wght 560   (condensed display headline)
  sans     Instrument Sans   wdth 100  wght 400   (body)
  mono     Martian Mono      wdth 87.5 wght 350   (labels, readouts)
  serif    Instrument Serif  italic 400           (the one human phrase)

Each comes in two files, `latin` and `latin-ext`, mirroring fontsource's subsets; satori falls back
per glyph across all registered fonts, so "São Paulo" and "Łódź" render with the right face.
Non-Latin scripts fall through to the dynamic Noto loader (api/_lib/fallbackFonts.ts).

Usage:  python3 scripts/backend-fonts.py        (writes api/_fonts/*.ttf)
"""
from __future__ import annotations

import io
import pathlib

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
NM = ROOT / "node_modules"
OUT = ROOT / "api" / "_fonts"

SUBSETS = ("latin", "latin-ext")

VARIABLE = [
    # (output stem, family name written into the font, source pattern, axis location)
    ("display", "Overflight Display", "@fontsource-variable/instrument-sans/files/instrument-sans-{s}-standard-normal.woff2", {"wdth": 75, "wght": 560}),
    ("sans", "Overflight Sans", "@fontsource-variable/instrument-sans/files/instrument-sans-{s}-standard-normal.woff2", {"wdth": 100, "wght": 400}),
    ("mono", "Overflight Mono", "@fontsource-variable/martian-mono/files/martian-mono-{s}-standard-normal.woff2", {"wdth": 87.5, "wght": 350}),
]
STATIC = [
    ("serif-italic", "Overflight Serif", "@fontsource/instrument-serif/files/instrument-serif-{s}-400-italic.woff"),
]

# Tables satori never reads; dropping them keeps the function bundle small.
DROP = ("DSIG", "hdmx", "LTSH", "VDMX", "gasp", "STAT", "MVAR", "HVAR", "avar", "fvar", "gvar", "cvar")


def rename(font: TTFont, family: str) -> None:
    name = font["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 4, 16):
            rec.string = family
        elif rec.nameID == 6:
            rec.string = family.replace(" ", "") + "-Regular"
        elif rec.nameID in (2, 17):
            rec.string = "Regular"


def finish(font: TTFont, family: str, out: pathlib.Path) -> None:
    for tag in DROP:
        if tag in font:
            del font[tag]
    font.flavor = None  # plain sfnt (TTF/OTF), what satori/opentype.js accept
    rename(font, family)
    buf = io.BytesIO()
    font.save(buf)
    out.write_bytes(buf.getvalue())
    print(f"  {out.relative_to(ROOT)}  {len(buf.getvalue()) / 1024:.1f} KB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for stem, family, pattern, loc in VARIABLE:
        for s in SUBSETS:
            src = NM / pattern.format(s=s)
            font = TTFont(src)
            # updateFontNames would need STAT names; we rename ourselves.
            inst = instantiateVariableFont(font, loc, inplace=False, overlap=True)
            finish(inst, family, OUT / f"{stem}-{s}.ttf")
    for stem, family, pattern in STATIC:
        for s in SUBSETS:
            src = NM / pattern.format(s=s)
            finish(TTFont(src), family, OUT / f"{stem}-{s}.ttf")


if __name__ == "__main__":
    main()
