"""
Shrinks every image in a folder by a given factor in each dimension and
saves the results into a subfolder.
"""

import os

import cv2

# ---- Config (change these as needed) ---------------------------------
SOURCE_FOLDER = "/Users/markivanantha/Downloads/sf sunset grizzly/aligned/insta"
OUTPUT_SUBFOLDER_NAME = "shrunk"

SCALE_FACTOR = 0.25   # 0.5 = half size in each dimension (2x smaller)

VALID_EXTENSIONS = (".png", ".jpg", ".jpeg")
# ------------------------------------------------------------------------


def shrink_image(image, scale_factor: float):
    height, width = image.shape[:2]
    new_size = (round(width * scale_factor), round(height * scale_factor))
    return cv2.resize(image, new_size, interpolation=cv2.INTER_AREA)


def process_folder(source_folder: str, output_subfolder_name: str) -> None:
    output_folder = os.path.join(source_folder, output_subfolder_name)
    os.makedirs(output_folder, exist_ok=True)

    for filename in sorted(os.listdir(source_folder)):
        if not filename.lower().endswith(VALID_EXTENSIONS):
            continue

        source_path = os.path.join(source_folder, filename)
        image = cv2.imread(source_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            continue

        shrunk = shrink_image(image, SCALE_FACTOR)

        output_path = os.path.join(output_folder, filename)
        cv2.imwrite(output_path, shrunk)
        print(f"Saved {output_path}")


if __name__ == "__main__":
    process_folder(SOURCE_FOLDER, OUTPUT_SUBFOLDER_NAME)
