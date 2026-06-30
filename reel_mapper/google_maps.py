"""
Look up places via Google Maps API and save results to a JSON file.

Setup:
    pip install requests

Env vars:
    GOOGLE_MAPS_API_KEY — your Google Maps API key

Standalone usage:
    python google_maps.py "Blue Bottle Coffee, San Francisco"
"""

import json
import os
import sys
import requests

LIST_FILE = "my_locations.json"
_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "AIzaSyDgL4cX9Aceg00TjLXAGEvUIcTz2hs9fTs")


def lookup_place(place: dict | str) -> dict | None:
    """
    Look up a place on Google Maps. Returns enriched dict or None if not found.
    place can be a string name or a dict with keys: name, city, address, neighborhood, context.
    """
    if isinstance(place, str):
        query = place
        context = ""
    else:
        parts = [place.get("name", "")]
        if place.get("address"):
            parts.append(place["address"])
        if place.get("neighborhood"):
            parts.append(place["neighborhood"])
        if place.get("city"):
            parts.append(place["city"])
        query = ", ".join(p for p in parts if p)
        context = place.get("context", "")

    find_res = requests.get(
        "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
        params={
            "input": query,
            "inputtype": "textquery",
            "fields": "place_id,geometry,name",
            "key": _API_KEY,
        },
    ).json()

    if not find_res.get("candidates"):
        print(f"  Not found: '{query}'")
        return None

    candidate = find_res["candidates"][0]
    place_id = candidate["place_id"]

    details_res = requests.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        params={"place_id": place_id, "fields": "url", "key": _API_KEY},
    ).json()

    map_url = details_res.get("result", {}).get(
        "url", f"https://www.google.com/maps/place/?q=place_id:{place_id}"
    )

    return {
        "name": candidate["name"],
        "lat": candidate["geometry"]["location"]["lat"],
        "lng": candidate["geometry"]["location"]["lng"],
        "map_url": map_url,
        "context": context,
        "place_id": place_id,
    }


def add_locations(places: list[dict | str], reel_url: str | None = None, list_file: str = LIST_FILE) -> list[dict]:
    """Look up a list of places, append new ones to list_file, return enriched results."""
    categories = []
    existing = []
    existing_ids = set()
    if os.path.exists(list_file):
        with open(list_file, "r") as f:
            try:
                data = json.load(f)
                categories = data.get("categories", [])
                existing = data.get("places", [])
                existing_ids = {e["place_id"] for e in existing if "place_id" in e}
            except json.JSONDecodeError:
                pass

    added = []
    for place in places:
        name = place if isinstance(place, str) else place.get("name", "")
        print(f"Looking up: {name}")
        result = lookup_place(place)
        if not result:
            continue
        if result["place_id"] in existing_ids:
            print(f"  Already saved: {result['name']}")
            continue

        category = place.get("category") if isinstance(place, dict) else None
        if category and category not in categories:
            categories.append(category)
            print(f"  New category: {category}")
        result["category"] = category
        if reel_url:
            result["reel_url"] = reel_url

        existing.append(result)
        existing_ids.add(result["place_id"])
        added.append(result)
        print(f"  Added: {result['name']} — {result['map_url']}")

    with open(list_file, "w") as f:
        json.dump({"categories": categories, "places": existing}, f, indent=2)

    return added


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} \"Place Name, City\"")
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    result = lookup_place(query)
    if result:
        print(json.dumps(result, indent=2))
