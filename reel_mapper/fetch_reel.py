"""
Fetch Instagram Reel metadata and optionally download the video.

Setup:
    pip install instagrapi requests

Env vars:
    SESSION_ID — your Instagram sessionid cookie
    (DevTools → Application → Cookies → instagram.com → sessionid)

Standalone usage:
    python fetch_reel.py <reel_url>
"""

import os
import re
import sys
import requests
from instagrapi import Client

VERBOSE = True


def get_reel_info(url: str, verbose=False) -> tuple[str, dict]:
    """Login to Instagram and fetch Reel CDN video URL + metadata. No download."""
    session_id = os.environ.get("SESSION_ID")
    if not session_id:
        raise EnvironmentError("SESSION_ID environment variable not set")

    cl = Client()
    cl.login_by_sessionid(session_id)
    if verbose: print("(logged in)")

    media_pk = cl.media_pk_from_url(url)
    media = cl.media_info(media_pk)

    metadata = {
        "pk": str(media.pk),
        "caption": media.caption_text or "",
        "duration": media.video_duration,
        "taken_at": media.taken_at.isoformat() if media.taken_at else "",
        "tagged_location": {
            "name": media.location.name,
            "city": media.location.city,
            "address": media.location.address,
            "lat": media.location.lat,
            "lng": media.location.lng,
        } if media.location else None,
    }
    if verbose: print(f"(video URL: {media.video_url})")
    return str(media.video_url), metadata


def shortcode(url: str) -> str:
    """Extract Instagram shortcode from URL. e.g. .../p/DXHf5LXhEpF/ → DXHf5LXhEpF"""
    match = re.search(r'/(?:p|reel|tv)/([A-Za-z0-9_-]+)', url)
    if not match:
        raise ValueError(f"Could not extract shortcode from URL: {url}")
    return match.group(1)


def download_reel_cached(cdn_url: str, reel_url: str, output_dir: str = ".") -> str:
    """Download Reel to a shortcode-named file. Returns path. Skips download if already cached."""
    cache_key = shortcode(reel_url)
    path = os.path.join(output_dir, f"reel_{cache_key}.mp4")

    if os.path.exists(path):
        print(f"Cache hit — using {path}")
        return path

    print(f"Downloading to {path}...")
    resp = requests.get(cdn_url, stream=True)
    resp.raise_for_status()
    with open(path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=65536):
            f.write(chunk)

    return path


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <instagram_reel_url>")
        sys.exit(1)

    cdn_url, metadata = get_reel_info(sys.argv[1], verbose=VERBOSE)

    print(f"\n--- Reel Info ---")
    print(f"ID:       {metadata['pk']}")
    print(f"Duration: {metadata['duration']}s")
    print(f"Taken at: {metadata['taken_at']}")
    print(f"Caption:  {metadata['caption'][:120] or '(none)'}")
    print(f"Shortcode: {shortcode(sys.argv[1])}")

    if metadata["tagged_location"]:
        loc = metadata["tagged_location"]
        print(f"\n--- Location Tag ---")
        print(f"Name:    {loc['name']}")
        print(f"City:    {loc['city']}")
        print(f"Lat/Lng: {loc['lat']}, {loc['lng']}")
    else:
        print("\n--- Location Tag --- (none)")

    if input("\nDownload video? (y/n): ").strip().lower() == "y":
        path = download_reel_cached(cdn_url, sys.argv[1])
        print(f"Saved to {path}")
