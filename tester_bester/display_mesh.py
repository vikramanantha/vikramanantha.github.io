#!/usr/bin/env python3
"""
Display a 3D mesh from a .off file.
Optimized for large mesh files (600MB+).
"""

import sys
import os
from pathlib import Path

def display_mesh(off_file_path):
    """
    Load and display a mesh from a .off file.
    
    Args:
        off_file_path: Path to the .off file
    """
    try:
        import trimesh
    except ImportError:
        print("Error: trimesh is not installed.")
        print("Install it with: pip install trimesh")
        sys.exit(1)
    
    # Check if file exists
    if not os.path.exists(off_file_path):
        print(f"Error: File not found: {off_file_path}")
        sys.exit(1)
    
    print(f"Loading mesh from: {off_file_path}")
    file_size_mb = os.path.getsize(off_file_path) / (1024 * 1024)
    print(f"File size: {file_size_mb:.2f} MB")
    
    # Load the mesh
    print("Reading mesh file...")
    try:
        mesh = trimesh.load(off_file_path, file_type='off')
    except Exception as e:
        print(f"Error loading mesh: {e}")
        sys.exit(1)
    
    if mesh is None:
        print("Error: Failed to load mesh. File may be corrupted or in wrong format.")
        sys.exit(1)
    
    # Print mesh information
    print(f"\nMesh loaded successfully!")
    print(f"Vertices: {len(mesh.vertices):,}")
    print(f"Faces: {len(mesh.faces):,}")
    print(f"Bounds: {mesh.bounds}")
    print(f"Volume: {mesh.volume:.6f}" if hasattr(mesh, 'volume') else "Volume: N/A")
    
    # For very large meshes, we might want to simplify or use a viewer that can handle it
    # trimesh.viewer can handle large meshes reasonably well
    print("\nOpening 3D viewer...")
    print("Controls:")
    print("  - Left click + drag: Rotate")
    print("  - Right click + drag: Pan")
    print("  - Scroll: Zoom")
    print("  - Close window to exit")
    
    try:
        # Show the mesh in an interactive viewer
        mesh.show()
    except Exception as e:
        print(f"Error displaying mesh: {e}")
        print("\nTrying alternative display method...")
        
        # Fallback: try using pyvista if available
        try:
            import pyvista as pv
            print("Using PyVista for display...")
            plotter = pv.Plotter()
            plotter.add_mesh(pv.wrap(mesh))
            plotter.show()
        except ImportError:
            print("PyVista not available. Install with: pip install pyvista")
            # Last resort: save as image
            print("\nSaving mesh preview as image...")
            try:
                scene = trimesh.Scene(mesh)
                png = scene.save_image(resolution=[1920, 1080])
                output_path = off_file_path.replace('.off', '_preview.png')
                with open(output_path, 'wb') as f:
                    f.write(png)
                print(f"Preview saved to: {output_path}")
            except Exception as e2:
                print(f"Could not save preview: {e2}")
                sys.exit(1)


if __name__ == "__main__":
    # Default file path
    default_path = "/Users/markivanantha/Downloads/00_mesh.off"
    
    # Use command line argument if provided, otherwise use default
    if len(sys.argv) > 1:
        mesh_file = sys.argv[1]
    else:
        mesh_file = default_path
    
    display_mesh(mesh_file)

