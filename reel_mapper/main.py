"""
Mapper pipeline: Instagram Reel → Gemini → Google Maps

Given an Instagram Reel URL, fetches metadata, streams the video directly to Gemini
(no disk write by default), extracts location mentions, and saves them to my_locations.json.

Setup:
    pip install instagrapi requests google-genai

Env vars:
    SESSION_ID          — Instagram sessionid cookie
    GEMINI_API_KEY      — Gemini API key
    GOOGLE_MAPS_API_KEY — Google Maps API key (optional, falls back to hardcoded)

Usage:
    python main.py <instagram_reel_url>            # stream directly, no disk write
    python main.py <instagram_reel_url> --cache    # download to hash-named file, reuse on re-runs
"""

import json
import os
import sys

from fetch_reel import shortcode, download_reel_cached, get_reel_info
from gemini_video import analyze_video
from google_maps import add_locations, LIST_FILE

VERBOSE = False


def run_pipeline(reel_url: str, cache: bool = False, verbose: bool = False) -> list[dict]:
    """Full pipeline: Reel URL → saved Google Maps locations. Returns list of added places."""

    # Step 1: Fetch metadata and CDN URL from Instagram
    print("\n[1/3] Fetching Reel info from Instagram...")
    cdn_url, metadata = get_reel_info(reel_url, verbose)
    print(f"      Duration: {metadata['duration']}s")
    if metadata["caption"]:
        print(f"      Caption: {metadata['caption'][:100]}")
    if metadata["tagged_location"]:
        loc = metadata["tagged_location"]
        print(f"      Tagged location: {loc['name']}, {loc['city']}")

    # Determine the source Gemini will receive: cached file path or live CDN URL
    if cache:
        cache_key = shortcode(reel_url)
        cached_path = f"reel_{cache_key}.mp4"
        if os.path.exists(cached_path):
            print(f"      Cache hit: {cached_path}")
        else:
            print(f"      Downloading to cache as reel_{cache_key}.mp4...")
        source = download_reel_cached(cdn_url, reel_url)
    else:
        source = cdn_url  # stream directly, no disk write

    # Load existing categories so Gemini can assign or extend them
    categories = []
    if os.path.exists(LIST_FILE):
        with open(LIST_FILE) as f:
            try:
                categories = json.load(f).get("categories", [])
            except json.JSONDecodeError:
                pass

    # Step 2: Analyze with Gemini
    print("\n[2/3] Analyzing with Gemini...")
    places = analyze_video(source, categories=categories)
    print(f"      Found {len(places)} location(s)")
    for p in places:
        label = p["name"]
        if p.get("city"):
            label += f", {p['city']}"
        print(f"      • {label} [{p.get('category', '?')}] — {p.get('context', '')}")

    if not places:
        print("      No locations found in video.")
        return []

    # Step 3: Look up on Google Maps and save
    print("\n[3/3] Looking up on Google Maps...")
    added = add_locations(places, reel_url=reel_url)

    return added


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <instagram_reel_url> [--cache]")
        sys.exit(1)

    url = sys.argv[1]
    if len(sys.argv > 2): VERBOSE = bool(sys.argv[2])
    use_cache = "--cache" in sys.argv

    results = run_pipeline(url, cache=use_cache, verbose=VERBOSE)

    print(f"\n{'='*50}")
    print(f"Done. Added {len(results)} new location(s) to my_locations.json")
    if results:
        print(json.dumps(results, indent=2))
