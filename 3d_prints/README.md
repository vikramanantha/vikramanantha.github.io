# 3D Prints
Vikram Anantha
Sep 2026
A gallery of the 3D models I've designed and printed.

## Spec

 - The main page is a list of banners (like the photo portfolio), each showing only the name of a model
 - Clicking a banner opens that model in a 3D viewer I can drag around, with its purpose, description, and print date shown on the side
 - All the info lives in `model_data.json`

## Adding a model

1. Drop the model file into `models/` (`.stl`, `.3mf`, `.obj`, `.glb`, and `.gltf` all work)
2. Add an entry to `model_data.json`:

```json
{
    "path": "models/My Model.stl",
    "name": "My Model",
    "purpose": "What it's for",
    "description": "Longer description. HTML like <a href='...'>links</a>, <em>italics</em>, and <br> works.",
    "print_date": "Sep 2026",
    "name_origin": "Optional — where the name comes from. Hidden if left out.",
    "improvements": "Optional — what I'd change next time. Hidden if left out."
}
```

Models show up in the gallery in the same order as the JSON.

## Implementation notes

- Zero-build, client-side: `index.html` + `style.css` + `prints.js`, with three.js loaded from a CDN import map (same as 3D Modeler)
- Each model gets a URL hash (`3d_prints/#my-model`) generated from its name, so models are linkable and the browser back button returns to the gallery
- STL/3MF files are rotated from Z-up to Y-up, centered, and the camera is fit to the model's bounding box
- Only the loader for the model's file type is downloaded, when the model is opened
