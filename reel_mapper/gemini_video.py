"""
Analyze a video with Gemini to extract location mentions.

Setup:
    pip install google-genai

Env vars:
    GEMINI_API_KEY — your Gemini API key

Standalone usage:
    python gemini_video.py <video_path>
"""

import json
import os
import sys
import time
from io import BytesIO

import requests
from google import genai


def _build_prompt(categories: list[str]) -> str:
    cat_list = "\n".join(f"- {c}" for c in categories) if categories else "(none yet)"
    return f"""
Watch this video carefully and extract every specific place or location mentioned.
Look for place names in text overlays, spoken narration, on-screen captions, and graphics.

Return ONLY a JSON array. No explanation, no markdown fences, just raw JSON.

Each item must have:
- "name": the place name as shown/said (e.g. "Blue Bottle Coffee", "Dolores Park")
- "address": street address or cross-street if mentioned, otherwise null
- "neighborhood": neighborhood or area (e.g. "Castro", "SOMA"), otherwise null
- "city": city if determinable, otherwise null
- "context": one short phrase describing why it was featured (e.g. "best matcha", "sunset spot")
- "category": assign one of the existing categories below. If this place is meaningfully different from all of them, suggest a new short category name (2-4 words, lowercase).

Existing categories:
{cat_list}

If the video implies a city for all locations (e.g. "Top spots in SF"), apply that city to each item.
If no specific named places are mentioned, return an empty array: []
"""


def analyze_video(source: str, categories: list[str] | None = None) -> list[dict]:
    """
    Upload video to Gemini, extract location mentions, return list of place dicts.
    source can be a local file path or an https:// CDN URL (streamed directly, no disk write).
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY environment variable not set")

    client = genai.Client(api_key=api_key)

    if source.startswith("http"):
        print("Streaming video directly to Gemini (no disk write)...")
        resp = requests.get(source, stream=True)
        resp.raise_for_status()
        buf = BytesIO()
        for chunk in resp.iter_content(chunk_size=65536):
            buf.write(chunk)
        buf.seek(0)
        video_file = client.files.upload(
            file=buf,
            config={"mime_type": "video/mp4", "display_name": "reel.mp4"},
        )
    else:
        print(f"Uploading {source}...")
        video_file = client.files.upload(file=source)

    print(f"Uploaded. URI: {video_file.uri}")

    print("Waiting for processing...")
    while video_file.state.name == "PROCESSING":
        time.sleep(5)
        video_file = client.files.get(name=video_file.name)

    if video_file.state.name == "FAILED":
        raise RuntimeError(f"Video processing failed: {video_file.error.message}")

    print("Analyzing with Gemini...")
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=[video_file, _build_prompt(categories or [])],
    )

    client.files.delete(name=video_file.name)

    raw = response.text.strip()
    # Strip markdown fences if the model adds them despite instructions
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    places = json.loads(raw)
    return places


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <video_path>")
        sys.exit(1)

    places = analyze_video(sys.argv[1])
    print(f"\n--- Extracted {len(places)} location(s) ---")
    print(json.dumps(places, indent=2))
