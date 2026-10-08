#!/usr/bin/env python3
"""Download a single SoundCloud track, but only if the artist made it free to download.

If the track isn't marked downloadable by its owner, this stops and reports that —
it never follows a purchase link or attempts any kind of paid download.

Usage:
    python download_track.py <soundcloud_track_url> [--out DIR]
"""
import argparse
import re
import sys
from pathlib import Path

import requests

API = "https://api-v2.soundcloud.com"
CONTENT_TYPE_EXT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/flac": "flac",
    "audio/aiff": "aiff",
    "audio/ogg": "ogg",
}


def get_client_id() -> str:
    home = requests.get("https://soundcloud.com", timeout=15).text
    script_urls = re.findall(r'src="(https://a-v2\.sndcdn\.com/assets/[^"]+\.js)"', home)
    for url in reversed(script_urls):  # client_id tends to live in one of the later bundles
        js = requests.get(url, timeout=15).text
        match = re.search(r'client_id\s*:\s*"([a-zA-Z0-9]+)"', js)
        if match:
            return match.group(1)
    sys.exit("couldn't find a client_id in SoundCloud's web player bundles — their site layout may have changed")


def resolve_track(url: str, client_id: str) -> dict:
    resp = requests.get(f"{API}/resolve", params={"url": url, "client_id": client_id}, timeout=15)
    if not resp.ok:
        sys.exit(f"SoundCloud API error resolving track ({resp.status_code}): {resp.text[:300]}")
    data = resp.json()
    if data.get("kind") != "track":
        sys.exit(f"that URL doesn't resolve to a single track (got: {data.get('kind')})")
    return data


def download_if_free(track: dict, client_id: str, out_dir: Path) -> None:
    title = track["title"]
    artist = track["user"]["username"]

    if not track.get("downloadable"):
        msg = f'"{title}" by {artist} is not free to download — stopping, no download attempted.'
        purchase = track.get("purchase_url")
        if purchase:
            msg += f" (It links to a paid page: {purchase}, which this script will not follow.)"
        sys.exit(msg)

    resp = requests.get(f"{API}/tracks/{track['id']}/download", params={"client_id": client_id}, timeout=15)
    if not resp.ok:
        sys.exit(f"SoundCloud API error fetching download link ({resp.status_code}): {resp.text[:300]}")
    file_url = resp.json()["redirectUri"]

    out_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r'[^\w\-. ]', "_", f"{artist} - {title}")

    with requests.get(file_url, stream=True, timeout=30) as file_resp:
        file_resp.raise_for_status()
        ext = CONTENT_TYPE_EXT.get(file_resp.headers.get("content-type", "").split(";")[0], "mp3")
        dest = out_dir / f"{safe_name}.{ext}"
        with open(dest, "wb") as f:
            for chunk in file_resp.iter_content(chunk_size=8192):
                f.write(chunk)

    print(f"Free download confirmed. Saved to {dest}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("track_url", help="URL of the SoundCloud track page")
    parser.add_argument("--out", type=Path, default=Path("downloads"), help="output directory (default: ./downloads)")
    args = parser.parse_args()

    client_id = get_client_id()
    track = resolve_track(args.track_url, client_id)
    download_if_free(track, client_id, args.out)


if __name__ == "__main__":
    main()
