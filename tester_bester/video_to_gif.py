from pathlib import Path
from moviepy import VideoFileClip

# ================= Configuration =================
INPUT_VIDEO_PATH = "/Users/markivanantha/Documents/Screenshots/b2.mov"
# =================================================
def convert_to_gif(input_path: str, fps: int = 10, scale: float = 0.5):
    video_file = Path(input_path)
    output_file = video_file.with_suffix(".gif")

    clip = VideoFileClip(str(video_file))
    if scale != 1.0:
        clip = clip.resized(scale)  # Note: 'resized' in v2 (was 'resize' in v1)
    
    clip.write_gif(str(output_file), fps=fps)
    clip.close()

if __name__ == "__main__":
    convert_to_gif(INPUT_VIDEO_PATH)