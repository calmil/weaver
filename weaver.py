#!/usr/bin/env python3
"""
WEAVER - Photomosaic Processor
Converts images and videos into photomosaics using a tileset.

Requirements:
    pip install pillow numpy moviepy tqdm

Usage:
    # Process a single image
    python weaver.py image input.jpg --resolution 50 --output result.png
    
    # Process a video (outputs frame sequence)
    python weaver.py video input.mp4 --resolution 30 --fps 24 --output frames/
    
    # Process a GIF
    python weaver.py video input.gif --resolution 30 --output output.gif
"""

import argparse
import sys
from pathlib import Path
from typing import List, Tuple
import numpy as np
from PIL import Image
from tqdm import tqdm
import multiprocessing as mp
from functools import partial

# Try to import video support (optional)
try:
    # Try newer moviepy API first (v2.0+)
    try:
        from moviepy import VideoFileClip, ImageSequenceClip
    except ImportError:
        # Fall back to older API (v1.x)
        from moviepy.editor import VideoFileClip, ImageSequenceClip
    VIDEO_SUPPORT = True
except ImportError:
    VIDEO_SUPPORT = False
    print("Warning: moviepy not installed. Video processing disabled.")
    print("Install with: pip install moviepy imageio imageio-ffmpeg")


# ============================================================================
# CONFIGURATION
# ============================================================================

class Config:
    """Processing configuration constants"""
    TILESET_COLUMNS = 8  # 8 brightness levels (0-7, dark to bright)
    SPRITE_SIZE = 50     # Each tile in tileset is 50x50px
    LUMINANCE_R = 0.299  # ITU-R BT.601 standard
    LUMINANCE_G = 0.587
    LUMINANCE_B = 0.114


# ============================================================================
# TILESET MANAGEMENT
# ============================================================================

class Tileset:
    """Manages loading and accessing tiles from spritesheet"""
    
    def __init__(self, tileset_path: str):
        """Load tileset spritesheet"""
        self.image = Image.open(tileset_path).convert('RGB')
        self.width, self.height = self.image.size
        
        # Calculate grid dimensions
        self.sprite_size = Config.SPRITE_SIZE
        self.columns = Config.TILESET_COLUMNS
        self.rows = self.height // self.sprite_size
        
        # Pre-extract all tiles for faster access
        self.tiles = self._extract_all_tiles()
        
        print(f"✓ Loaded tileset: {self.columns}×{self.rows} tiles ({self.width}×{self.height}px)")
    
    def _extract_all_tiles(self) -> List[List[Image.Image]]:
        """Extract all tiles into a 2D array [row][column]"""
        tiles = []
        for row in range(self.rows):
            row_tiles = []
            for col in range(self.columns):
                x = col * self.sprite_size
                y = row * self.sprite_size
                tile = self.image.crop((x, y, x + self.sprite_size, y + self.sprite_size))
                row_tiles.append(tile)
            tiles.append(row_tiles)
        return tiles
    
    def get_tile(self, brightness: float) -> Image.Image:
        """
        Get a random tile for the given brightness (0-255)
        Returns a PIL Image of the tile
        """
        # Map brightness to column (0-7)
        column = int(np.clip(brightness / 255.0 * self.columns, 0, self.columns - 1))
        
        # Select random row for variation
        row = np.random.randint(0, self.rows)
        
        return self.tiles[row][column]


# ============================================================================
# BRIGHTNESS CALCULATION
# ============================================================================

def calculate_brightness(image_array: np.ndarray) -> float:
    """
    Calculate average brightness using luminance formula
    Args:
        image_array: numpy array of shape (height, width, 3) with RGB values
    Returns:
        Average brightness (0-255)
    """
    # Vectorized luminance calculation (much faster than loops)
    luminance = (
        Config.LUMINANCE_R * image_array[:, :, 0] +
        Config.LUMINANCE_G * image_array[:, :, 1] +
        Config.LUMINANCE_B * image_array[:, :, 2]
    )
    return float(np.mean(luminance))


# ============================================================================
# IMAGE PROCESSING
# ============================================================================

def process_image(
    input_path: str,
    tileset: Tileset,
    tiles_per_row: int,
    output_path: str = None
) -> Image.Image:
    """
    Process a single image into a photomosaic
    
    Args:
        input_path: Path to source image
        tileset: Loaded Tileset object
        tiles_per_row: Number of tiles across the width
        output_path: Optional path to save result
    
    Returns:
        Processed PIL Image
    """
    print(f"\n{'='*60}")
    print(f"Processing: {input_path}")
    print(f"{'='*60}")
    
    # Load source image
    source = Image.open(input_path).convert('RGB')
    source_width, source_height = source.size
    print(f"Source: {source_width}×{source_height}px")
    
    # Calculate tile layout
    tile_size = source_width // tiles_per_row
    tiles_wide = source_width // tile_size
    tiles_high = source_height // tile_size
    
    output_width = tiles_wide * tile_size
    output_height = tiles_high * tile_size
    
    print(f"Grid: {tiles_wide}×{tiles_high} tiles @ {tile_size}×{tile_size}px")
    print(f"Output: {output_width}×{output_height}px")
    print(f"Total tiles: {tiles_wide * tiles_high:,}")
    
    # Create output canvas
    output = Image.new('RGB', (output_width, output_height), color='white')
    
    # Convert source to numpy for faster brightness calculation
    source_array = np.array(source)
    
    # Process each tile with progress bar
    total_tiles = tiles_wide * tiles_high
    with tqdm(total=total_tiles, desc="Processing tiles", unit="tiles") as pbar:
        for row in range(tiles_high):
            for col in range(tiles_wide):
                # Extract region
                x = col * tile_size
                y = row * tile_size
                region = source_array[y:y+tile_size, x:x+tile_size]
                
                # Calculate brightness
                brightness = calculate_brightness(region)
                
                # Get appropriate tile and resize to target size
                tile = tileset.get_tile(brightness)
                if tile.size != (tile_size, tile_size):
                    tile = tile.resize((tile_size, tile_size), Image.LANCZOS)
                
                # Paste tile onto output
                output.paste(tile, (x, y))
                
                pbar.update(1)
    
    # Save if output path provided
    if output_path:
        output.save(output_path)
        print(f"✓ Saved: {output_path}")
    
    return output


# ============================================================================
# VIDEO PROCESSING
# ============================================================================

def process_frame(
    frame_data: Tuple[int, np.ndarray, Tileset, int]
) -> Tuple[int, np.ndarray]:
    """
    Process a single video frame (used for parallel processing)
    
    Args:
        frame_data: Tuple of (frame_index, frame_array, tileset, tiles_per_row)
    
    Returns:
        Tuple of (frame_index, processed_frame_array)
    """
    frame_idx, frame_array, tileset, tiles_per_row = frame_data
    
    height, width = frame_array.shape[:2]
    
    # Calculate tile layout
    tile_size = width // tiles_per_row
    tiles_wide = width // tile_size
    tiles_high = height // tile_size
    
    output_width = tiles_wide * tile_size
    output_height = tiles_high * tile_size
    
    # Create output array
    output = np.full((output_height, output_width, 3), 255, dtype=np.uint8)
    
    # Process each tile
    for row in range(tiles_high):
        for col in range(tiles_wide):
            x = col * tile_size
            y = row * tile_size
            region = frame_array[y:y+tile_size, x:x+tile_size]
            
            brightness = calculate_brightness(region)
            
            tile = tileset.get_tile(brightness)
            if tile.size != (tile_size, tile_size):
                tile = tile.resize((tile_size, tile_size), Image.LANCZOS)
            
            tile_array = np.array(tile)
            output[y:y+tile_size, x:x+tile_size] = tile_array
    
    return (frame_idx, output)


def process_video(
    input_path: str,
    tileset: Tileset,
    tiles_per_row: int,
    target_fps: int = 24,
    output_path: str = None,
    max_workers: int = None
) -> List[np.ndarray]:
    """
    Process a video into photomosaic frames
    
    Args:
        input_path: Path to source video
        tileset: Loaded Tileset object
        tiles_per_row: Number of tiles across the width
        target_fps: Target framerate for output
        output_path: Optional output path (directory for frames, or .gif file)
        max_workers: Number of parallel workers (default: CPU count)
    
    Returns:
        List of processed frames as numpy arrays
    """
    if not VIDEO_SUPPORT:
        raise RuntimeError("Video processing requires moviepy. Install with: pip install moviepy")
    
    print(f"\n{'='*60}")
    print(f"Processing Video: {input_path}")
    print(f"{'='*60}")
    
    # Load video
    clip = VideoFileClip(input_path)
    duration = clip.duration
    original_fps = clip.fps
    width, height = clip.size
    
    print(f"Source: {width}×{height}px @ {original_fps:.2f}fps")
    print(f"Duration: {duration:.2f}s")
    
    # Extract frames at target framerate
    total_frames = int(duration * target_fps)
    print(f"Extracting {total_frames} frames @ {target_fps}fps...")
    
    frame_times = np.linspace(0, duration, total_frames, endpoint=False)
    frames = [clip.get_frame(t) for t in tqdm(frame_times, desc="Extracting frames")]
    
    clip.close()
    
    # Process frames in parallel
    print(f"\nProcessing frames with {max_workers or mp.cpu_count()} workers...")
    
    frame_data = [(i, frame, tileset, tiles_per_row) for i, frame in enumerate(frames)]
    
    with mp.Pool(max_workers) as pool:
        results = list(tqdm(
            pool.imap(process_frame, frame_data),
            total=len(frame_data),
            desc="Processing frames"
        ))
    
    # Sort by frame index (parallel processing may complete out of order)
    results.sort(key=lambda x: x[0])
    processed_frames = [frame for _, frame in results]
    
    # Save output
    if output_path:
        output_path = Path(output_path)
        
        if output_path.suffix.lower() == '.gif':
            # Save as GIF
            print(f"\nCreating GIF at {target_fps}fps...")
            images = [Image.fromarray(frame) for frame in processed_frames]
            images[0].save(
                output_path,
                save_all=True,
                append_images=images[1:],
                duration=int(1000/target_fps),
                loop=0
            )
            print(f"✓ Saved GIF: {output_path}")
        
        else:
            # Save as frame sequence
            output_path.mkdir(parents=True, exist_ok=True)
            print(f"\nSaving {len(processed_frames)} frames...")
            
            for i, frame in enumerate(tqdm(processed_frames, desc="Saving frames")):
                frame_path = output_path / f"frame_{i:05d}.png"
                Image.fromarray(frame).save(frame_path)
            
            print(f"✓ Saved frames to: {output_path}/")
    
    return processed_frames


# ============================================================================
# COMMAND LINE INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Weaver - Photomosaic Processor',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process an image
  python weaver.py image input.jpg --resolution 50 --output result.png
  
  # Process a video to GIF
  python weaver.py video input.mp4 --resolution 30 --fps 24 --output output.gif
  
  # Process video to frame sequence
  python weaver.py video input.mp4 --resolution 30 --fps 24 --output frames/
        """
    )
    
    parser.add_argument(
        'mode',
        choices=['image', 'video'],
        help='Processing mode'
    )
    
    parser.add_argument(
        'input',
        help='Input file path'
    )
    
    parser.add_argument(
        '--tileset',
        default='tiles/tileset.png',
        help='Path to tileset spritesheet (default: tiles/tileset.png)'
    )
    
    parser.add_argument(
        '--resolution',
        type=int,
        default=50,
        help='Tiles per row (default: 50)'
    )
    
    parser.add_argument(
        '--output',
        help='Output path (for video: directory or .gif file)'
    )
    
    parser.add_argument(
        '--fps',
        type=int,
        default=24,
        help='Target framerate for video (default: 24)'
    )
    
    parser.add_argument(
        '--workers',
        type=int,
        default=None,
        help='Number of parallel workers for video (default: CPU count)'
    )
    
    args = parser.parse_args()
    
    # Validate input file exists
    if not Path(args.input).exists():
        print(f"Error: Input file not found: {args.input}")
        sys.exit(1)
    
    # Validate tileset exists
    if not Path(args.tileset).exists():
        print(f"Error: Tileset not found: {args.tileset}")
        print("Make sure 'tiles/tileset.png' exists in the same directory")
        sys.exit(1)
    
    # Load tileset
    tileset = Tileset(args.tileset)
    
    # Process based on mode
    if args.mode == 'image':
        process_image(
            args.input,
            tileset,
            args.resolution,
            args.output
        )
    
    elif args.mode == 'video':
        if not VIDEO_SUPPORT:
            print("Error: Video processing requires moviepy")
            print("Install with: pip install moviepy")
            sys.exit(1)
        
        process_video(
            args.input,
            tileset,
            args.resolution,
            args.fps,
            args.output,
            args.workers
        )
    
    print(f"\n{'='*60}")
    print("✓ Processing complete!")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()