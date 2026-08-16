#!/usr/bin/env python3
"""
check_google_fonts.py

Queries Google Fonts metadata for a given font family and reports verified facts:
available weights, italic availability, variable font axes, and subsets (character set
coverage).

This exists to replace "I recall this font has weights X/Y/Z" with an actual data pull —
free-font weight ranges and feature support change over time and are easy to misremember.

Usage:
    python check_google_fonts.py "Inter"
    python check_google_fonts.py "DM Sans" "Space Grotesk" "IBM Plex Sans"

Requires network access to fonts.google.com. If unavailable in the current sandbox,
run this in an environment with internet access and report results back, or tell the user
to verify manually at https://fonts.google.com/specimen/<font-name> — do not present
memorized/guessed specs as if they were verified.
"""

import sys
import json
import urllib.request
import urllib.error

METADATA_URL = "https://fonts.google.com/metadata/fonts"


def fetch_all_fonts_metadata():
    req = urllib.request.Request(
        METADATA_URL, headers={"User-Agent": "Mozilla/5.0 (font-selection-skill)"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read().decode("utf-8")
    # Google prefixes this JSON endpoint with a security string: )]}'
    if raw.startswith(")]}'"):
        raw = raw[4:]
    return json.loads(raw)


def find_font(all_metadata, family_name):
    target = family_name.strip().lower()
    for family in all_metadata.get("familyMetadataList", []):
        if family.get("family", "").strip().lower() == target:
            return family
    return None


def summarize(family_data):
    name = family_data.get("family", "Unknown")
    category = family_data.get("category", "unknown")
    is_variable = bool(family_data.get("axes"))
    axes = family_data.get("axes", [])
    fonts = family_data.get("fonts", {})  # keys like "regular", "700", "italic", "700italic"
    subsets = family_data.get("subsets", [])

    weights = sorted(
        {k for k in fonts.keys() if "italic" not in k and k != "regular"} | (
            {"400"} if "regular" in fonts else set()
        ),
        key=lambda x: int(x)
    )
    has_italic = any("italic" in k for k in fonts.keys())

    print(f"\n=== {name} ===")
    print(f"Category: {category}")
    print(f"Variable font: {'yes' if is_variable else 'no'}")
    if is_variable:
        axis_names = [a.get("tag") for a in axes]
        print(f"Variable axes: {', '.join(axis_names)}")
    print(f"Static weights available: {', '.join(weights) if weights else 'unknown'}")
    print(f"Has italic: {'yes' if has_italic else 'NO — check for synthetic italic risk'}")
    print(f"Subsets (character sets): {', '.join(subsets)}")
    if "latin" in subsets:
        print("  -> basic Latin: covered")
    if not is_variable and len(weights) <= 2:
        print("CAUTION: narrow static weight range — verify this covers your design system's needs before committing.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python check_google_fonts.py <font-name> [<font-name> ...]")
        sys.exit(1)

    try:
        all_metadata = fetch_all_fonts_metadata()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
        print(f"ERROR: could not reach fonts.google.com ({e}).")
        print("Cannot verify font specs programmatically in this environment.")
        print("Do not substitute memorized/guessed font specs — ask the user to check")
        print("https://fonts.google.com/specimen/<font-name> manually, or run this script")
        print("in an environment with network access.")
        sys.exit(2)

    for font_name in sys.argv[1:]:
        family_data = find_font(all_metadata, font_name)
        if family_data is None:
            print(f"\n=== {font_name} ===")
            print("NOT FOUND on Google Fonts — double check the exact family name/spelling.")
            continue
        summarize(family_data)


if __name__ == "__main__":
    main()
