#!/usr/bin/env python3
"""
Script to update models.json with image names for a given model ID.

Usage:
    python update_models_json.py <model_id> [--name "Display Name"] [--glb-file model.glb]
    
Examples:
    python update_models_json.py grove
    python update_models_json.py grove --name "Grove Park"
"""

import os
import sys
import json
import argparse
import glob

# Get the directory where this script is located (images/3d/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_JSON_PATH = os.path.join(SCRIPT_DIR, "models.json")


def get_image_files(model_id: str) -> list:
    """
    Get list of image files for a given model ID.
    Looks for images in the <model_id>/ subdirectory.
    """
    image_folder = os.path.join(SCRIPT_DIR, model_id)
    
    if not os.path.isdir(image_folder):
        print(f"Warning: Image folder not found: {image_folder}")
        return []
    
    # Supported image extensions
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
    
    image_files = []
    for f in sorted(os.listdir(image_folder)):
        if os.path.splitext(f.lower())[1] in image_extensions:
            # Store as relative path: model_id/filename
            image_files.append(f"{model_id}/{f}")
    
    return image_files


def load_models_json() -> dict:
    """Load models.json, creating it if it doesn't exist."""
    if os.path.exists(MODELS_JSON_PATH):
        try:
            with open(MODELS_JSON_PATH, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            print(f"Warning: Invalid JSON in models.json, creating backup and starting fresh: {e}")
            # Backup the corrupted file
            backup_path = MODELS_JSON_PATH + ".backup"
            os.rename(MODELS_JSON_PATH, backup_path)
            print(f"Backed up to: {backup_path}")
    
    return {"models": []}


def save_models_json(data: dict):
    """Save models.json with nice formatting."""
    with open(MODELS_JSON_PATH, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Saved: {MODELS_JSON_PATH}")


def id_to_display_name(model_id: str) -> str:
    """Convert model_id to a display name (e.g., 'town_track' -> 'Town Track')."""
    return model_id.replace('_', ' ').replace('-', ' ').title()


def update_model(model_id: str, name: str = None, glb_file: str = None) -> bool:
    """
    Add or update a model entry in models.json.
    
    Args:
        model_id: The unique identifier for the model
        name: Display name (auto-generated from id if not provided)
        glb_file: GLB filename (defaults to <model_id>.glb)
    
    Returns:
        True if successful, False otherwise
    """
    # Load existing data
    data = load_models_json()
    
    # Clean up any invalid entries (like incomplete ones)
    data["models"] = [m for m in data["models"] if isinstance(m, dict) and "id" in m and m["id"]]
    
    # Get image files
    photos = get_image_files(model_id)
    
    # Generate defaults
    if name is None:
        name = id_to_display_name(model_id)
    if glb_file is None:
        glb_file = f"{model_id}.glb"
    
    # Check if GLB file exists
    glb_path = os.path.join(SCRIPT_DIR, glb_file)
    if not os.path.exists(glb_path):
        print(f"Warning: GLB file not found: {glb_path}")
    
    # Create the model entry
    new_entry = {
        "id": model_id,
        "name": name,
        "file": glb_file,
        "photos": photos
    }
    
    # Check if model already exists
    existing_index = None
    for i, model in enumerate(data["models"]):
        if model.get("id") == model_id:
            existing_index = i
            break
    
    if existing_index is not None:
        # Update existing entry
        data["models"][existing_index] = new_entry
        print(f"Updated existing model: {model_id}")
    else:
        # Add new entry
        data["models"].append(new_entry)
        print(f"Added new model: {model_id}")
    
    # Save
    save_models_json(data)
    
    print(f"  Name: {name}")
    print(f"  File: {glb_file}")
    print(f"  Photos: {len(photos)} images")
    
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Update models.json with image names for a given model ID"
    )
    parser.add_argument(
        "model_id",
        help="The model ID (should match the folder name containing images)"
    )
    parser.add_argument(
        "--name",
        default=None,
        help="Display name for the model (auto-generated from ID if not provided)"
    )
    parser.add_argument(
        "--glb-file",
        default=None,
        help="GLB filename (defaults to <model_id>.glb)"
    )
    
    args = parser.parse_args()
    
    success = update_model(
        model_id=args.model_id,
        name=args.name,
        glb_file=args.glb_file
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()


