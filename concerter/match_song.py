#!/usr/bin/env python3
"""Match a concert video clip to a song and a position within it.

Usage:
    python match_song.py <video_path> <reference_dir> [--top-k N]

<reference_dir> should contain one audio file per song (mp3/wav/flac/m4a/aac/ogg),
named after the song, e.g. reference_songs/Where the Streets Have No Name.mp3
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import librosa
import numpy as np

SR = 22050
HOP_LENGTH = 512
CACHE_DIRNAME = ".chroma_cache"
REF_EXTENSIONS = (".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg")


def extract_audio(video_path: Path, sr: int) -> Path:
    if shutil.which("ffmpeg") is None:
        sys.exit("ffmpeg not found on PATH — install it (e.g. `brew install ffmpeg`).")
    tmp_path = Path(tempfile.mkstemp(suffix=".wav")[1])
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(video_path), "-ac", "1", "-ar", str(sr), "-vn", str(tmp_path)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return tmp_path


def compute_chroma(y: np.ndarray, sr: int) -> np.ndarray:
    # harmonic component only: strips percussive crowd noise/impact transients
    harmonic, _ = librosa.effects.hpss(y)
    return librosa.feature.chroma_cens(y=harmonic, sr=sr, hop_length=HOP_LENGTH)


def cached_reference_chroma(path: Path, sr: int) -> np.ndarray:
    cache_dir = path.parent / CACHE_DIRNAME
    cache_dir.mkdir(exist_ok=True)
    cache_path = cache_dir / f"{path.stem}_{int(path.stat().st_mtime)}.npy"
    if cache_path.exists():
        return np.load(cache_path)
    y, _ = librosa.load(path, sr=sr, mono=True)
    chroma = compute_chroma(y, sr)
    np.save(cache_path, chroma)
    return chroma


def best_subsequence_match(query: np.ndarray, ref: np.ndarray):
    """Try every semitone transposition, return the cheapest subsequence alignment."""
    best = None
    for shift in range(12):
        shifted = np.roll(query, shift, axis=0)
        D, wp = librosa.sequence.dtw(X=shifted, Y=ref, subseq=True, metric="cosine")
        cost = D[-1, :].min() / max(len(wp), 1)
        if best is None or cost < best[0]:
            best = (cost, wp, shift)
    return best


def match_video(video_path: Path, reference_dir: Path, top_k: int):
    print(f"Extracting audio from {video_path.name}...")
    wav_path = extract_audio(video_path, SR)
    try:
        y, _ = librosa.load(wav_path, sr=SR, mono=True)
    finally:
        wav_path.unlink(missing_ok=True)

    query_chroma = compute_chroma(y, SR)

    ref_files = sorted(p for p in reference_dir.iterdir() if p.suffix.lower() in REF_EXTENSIONS)
    if not ref_files:
        sys.exit(f"No reference audio files found in {reference_dir}")

    results = []
    for ref_path in ref_files:
        print(f"Matching against {ref_path.stem}...")
        ref_chroma = cached_reference_chroma(ref_path, SR)
        cost, wp, shift = best_subsequence_match(query_chroma, ref_chroma)
        cols = wp[:, 1]
        start_sec = librosa.frames_to_time(cols.min(), sr=SR, hop_length=HOP_LENGTH)
        end_sec = librosa.frames_to_time(cols.max(), sr=SR, hop_length=HOP_LENGTH)
        results.append(
            {
                "song": ref_path.stem,
                "cost": cost,
                "start_sec": start_sec,
                "end_sec": end_sec,
                "shift": shift,
            }
        )

    results.sort(key=lambda r: r["cost"])
    return results[:top_k]


def fmt_time(seconds: float) -> str:
    return f"{int(seconds // 60):02d}:{int(seconds % 60):02d}"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", type=Path, help="concert video file to identify")
    parser.add_argument("reference_dir", type=Path, help="directory of reference song audio files")
    parser.add_argument("--top-k", type=int, default=3, help="number of candidate matches to show (default: 3)")
    args = parser.parse_args()

    if not args.video.is_file():
        sys.exit(f"video not found: {args.video}")
    if not args.reference_dir.is_dir():
        sys.exit(f"reference directory not found: {args.reference_dir}")

    results = match_video(args.video, args.reference_dir, args.top_k)

    print(f"\nTop {len(results)} matches for {args.video.name}:\n")
    for i, r in enumerate(results, 1):
        confidence = round(max(0.0, 1 - r["cost"]) * 100, 1)
        print(
            f"{i}. {r['song']}  "
            f"(confidence ~{confidence}%, cost {r['cost']:.3f}, shift {r['shift']} semitones)\n"
            f"   position in song: {fmt_time(r['start_sec'])}-{fmt_time(r['end_sec'])}"
        )


if __name__ == "__main__":
    main()
