"""
Blends a sequence of numerically-named images (1.png, 2.png, ...) together
into one composite, using Laplacian pyramid blending at each seam. Each
image gets an evenly-spaced band across the composite.
"""

import os

import cv2
import numpy as np

# ---- Config (change these as needed) ---------------------------------
IMAGE_FOLDER = "/Users/markivanantha/Downloads/sf sunset grizzly/aligned"
IMAGE_COUNT = 2               # images are named 1.png .. IMAGE_COUNT.png
IMAGE_EXTENSION = ".png"

OUTPUT_FOLDER = "/Users/markivanantha/Downloads/sf sunset grizzly/aligned_2"
OUTPUT_FILENAME_TEMPLATE = "blend_{levels}levels.png"  # {levels} -> NUM_PYRAMID_LEVELS

NUM_PYRAMID_LEVELS = 10

# Direction the images' bands are arranged in (before REVERSE_ORDER is applied):
#   "vertical"   -> image 1 on the left, image IMAGE_COUNT on the right
#   "horizontal" -> image 1 on the top, image IMAGE_COUNT on the bottom
BLEND_DIRECTION = "vertical"

# If True, flips the arrangement above (e.g. "vertical" becomes image 1 on
# the right, image IMAGE_COUNT on the left).
REVERSE_ORDER = True
# ------------------------------------------------------------------------


def ordered_image_paths(folder: str, count: int, extension: str) -> list[str]:
    return [os.path.join(folder, f"{i}{extension}") for i in range(1, count + 1)]


def build_mask(direction: str, size: tuple[int, int], split_position: float) -> np.ndarray:
    width, height = size

    if direction == "vertical":
        mask = np.zeros((height, width), dtype=np.float32)
        mask[:, : int(width * split_position)] = 1.0
        return mask

    if direction == "horizontal":
        mask = np.zeros((height, width), dtype=np.float32)
        mask[: int(height * split_position), :] = 1.0
        return mask

    raise ValueError(f"Unknown BLEND_DIRECTION: {direction!r}")


def gaussian_pyramid(image: np.ndarray, levels: int) -> list[np.ndarray]:
    pyramid = [image]
    for _ in range(levels):
        image = cv2.pyrDown(image)
        pyramid.append(image)
    return pyramid


def laplacian_pyramid(gaussian_pyr: list[np.ndarray]) -> list[np.ndarray]:
    pyramid = []
    for i in range(len(gaussian_pyr) - 1):
        size = (gaussian_pyr[i].shape[1], gaussian_pyr[i].shape[0])
        expanded = cv2.pyrUp(gaussian_pyr[i + 1], dstsize=size)
        pyramid.append(gaussian_pyr[i].astype(np.float32) - expanded.astype(np.float32))
    pyramid.append(gaussian_pyr[-1].astype(np.float32))
    return pyramid


def blend_pyramids(
    laplacian_a: list[np.ndarray],
    laplacian_b: list[np.ndarray],
    mask_pyr: list[np.ndarray],
) -> list[np.ndarray]:
    blended = []
    for level_a, level_b, mask_level in zip(laplacian_a, laplacian_b, mask_pyr):
        mask_3ch = mask_level[..., np.newaxis]
        blended.append(level_a * mask_3ch + level_b * (1.0 - mask_3ch))
    return blended


def reconstruct(laplacian_pyr: list[np.ndarray]) -> np.ndarray:
    image = laplacian_pyr[-1]
    for level in reversed(laplacian_pyr[:-1]):
        size = (level.shape[1], level.shape[0])
        image = cv2.pyrUp(image, dstsize=size)
        image = image + level
    return image


def laplacian_blend(image_a: np.ndarray, image_b: np.ndarray, mask: np.ndarray) -> np.ndarray:
    gaussian_a = gaussian_pyramid(image_a.astype(np.float32), NUM_PYRAMID_LEVELS)
    gaussian_b = gaussian_pyramid(image_b.astype(np.float32), NUM_PYRAMID_LEVELS)
    mask_pyr = gaussian_pyramid(mask, NUM_PYRAMID_LEVELS)

    laplacian_a = laplacian_pyramid(gaussian_a)
    laplacian_b = laplacian_pyramid(gaussian_b)

    blended_pyr = blend_pyramids(laplacian_a, laplacian_b, mask_pyr)
    result = reconstruct(blended_pyr)

    return np.clip(result, 0, 255).astype(np.uint8)


def blend_sequence(images: list[np.ndarray], direction: str) -> np.ndarray:
    height, width = images[0].shape[:2]
    count = len(images)

    canvas = images[0]
    for i in range(1, count):
        split_position = i / count
        mask = build_mask(direction, (width, height), split_position)
        canvas = laplacian_blend(canvas, images[i], mask)

    return canvas


def main() -> None:
    paths = ordered_image_paths(IMAGE_FOLDER, IMAGE_COUNT, IMAGE_EXTENSION)

    images = []
    for path in paths:
        image = cv2.imread(path, cv2.IMREAD_COLOR)
        if image is None:
            raise FileNotFoundError(path)
        images.append(image)

    reference_height, reference_width = images[0].shape[:2]
    for i, image in enumerate(images):
        if image.shape[:2] != (reference_height, reference_width):
            images[i] = cv2.resize(image, (reference_width, reference_height))

    if REVERSE_ORDER:
        images = images[::-1]

    result = blend_sequence(images, BLEND_DIRECTION)

    output_filename = OUTPUT_FILENAME_TEMPLATE.format(levels=NUM_PYRAMID_LEVELS)
    output_path = os.path.join(OUTPUT_FOLDER, output_filename)

    cv2.imwrite(output_path, result)
    print(f"Saved {output_path}")


if __name__ == "__main__":
    main()
