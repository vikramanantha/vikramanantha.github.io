"""
Adds a semi-transparent rounded-rectangle caption bar to every photo in a
folder and saves the results into an "insta" subfolder.
"""

import os
from PIL import Image, ImageDraw, ImageFont

# ---- Config (change these as needed) ---------------------------------
SOURCE_FOLDER = "/Users/markivanantha/Downloads/sf sunset grizzly/aligned"
OUTPUT_SUBFOLDER_NAME = "insta"

CAPTION_TEXT = "(Drag the dots left and right)"
FONT_PATH = "/Users/markivanantha/Downloads/Lexend,Lexend_Deca/Lexend_Deca/static/LexendDeca-Regular.ttf"

RECT_CORNER_RADIUS = 150
RECT_FILL_COLOR = (0, 0, 0)      # black
RECT_FILL_ALPHA = 0.30           # 30%
RECT_TEXT_PADDING = 100           # buffer around the text on all sides
RECT_BOTTOM_MARGIN = 50          # buffer from the bottom of the image

TEXT_COLOR = (255, 255, 255, 255)
FONT_SIZE = 400

VALID_EXTENSIONS = (".png", ".jpg", ".jpeg")
# ------------------------------------------------------------------------


def add_caption_bar(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size

    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    text_bbox = draw.textbbox((0, 0), CAPTION_TEXT, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    rect_width = text_width + 2 * RECT_TEXT_PADDING
    rect_height = text_height + 2 * RECT_TEXT_PADDING
    rect_left = (width - rect_width) / 2
    rect_right = rect_left + rect_width
    rect_bottom = height - RECT_BOTTOM_MARGIN
    rect_top = rect_bottom - rect_height

    fill_color = RECT_FILL_COLOR + (int(255 * RECT_FILL_ALPHA),)
    draw.rounded_rectangle(
        [(rect_left, rect_top), (rect_right, rect_bottom)],
        radius=RECT_CORNER_RADIUS,
        fill=fill_color,
    )

    text_x = rect_left + (rect_width - text_width) / 2 - text_bbox[0]
    text_y = rect_top + (rect_height - text_height) / 2 - text_bbox[1]

    draw.text((text_x, text_y), CAPTION_TEXT, font=font, fill=TEXT_COLOR)

    return Image.alpha_composite(image, overlay)


def process_folder(source_folder: str, output_subfolder_name: str) -> None:
    output_folder = os.path.join(source_folder, output_subfolder_name)
    os.makedirs(output_folder, exist_ok=True)

    for filename in sorted(os.listdir(source_folder)):
        if not filename.lower().endswith(VALID_EXTENSIONS):
            continue

        source_path = os.path.join(source_folder, filename)
        with Image.open(source_path) as image:
            result = add_caption_bar(image)

            if filename.lower().endswith((".jpg", ".jpeg")):
                result = result.convert("RGB")

            output_path = os.path.join(output_folder, filename)
            result.save(output_path)
            print(f"Saved {output_path}")


if __name__ == "__main__":
    process_folder(SOURCE_FOLDER, OUTPUT_SUBFOLDER_NAME)
