# WEAVER - Photomosaic Processor

Convert images and videos into photomosaics using a custom tileset. Weaver analyzes the brightness of regions in your source media and replaces them with matching tiles from a spritesheet.

## Requirements

- Python 3.7+
- Required dependencies:
  ```bash
  pip install pillow numpy tqdm
  ```

- Optional (for video processing):
  ```bash
  pip install moviepy imageio imageio-ffmpeg
  ```

## Tileset Setup

Weaver requires a tileset spritesheet at `tiles/tileset.png` (or specify a custom path with `--tileset`).

**Tileset format:**
- Grid of 50×50px tiles
- 8 columns representing brightness levels (0=darkest, 7=brightest)
- Multiple rows for variation at each brightness level
- Example: An 8×10 grid provides 80 tiles (10 variations per brightness level)

## Usage

### Process an Image

```bash
python weaver.py image input.jpg --resolution 50 --output result.png
```

### Process a Video to GIF

```bash
python weaver.py video input.mp4 --resolution 30 --fps 24 --output output.gif
```

### Process a Video to Frame Sequence

```bash
python weaver.py video input.mp4 --resolution 30 --fps 24 --output frames/
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `mode` | Processing mode: `image` or `video` | (required) |
| `input` | Input file path | (required) |
| `--tileset` | Path to tileset spritesheet | `tiles/tileset.png` |
| `--resolution` | Number of tiles across the width | `50` |
| `--output` | Output path (file for image/GIF, directory for frames) | None (display only) |
| `--fps` | Target framerate for video output | `24` |
| `--workers` | Number of parallel workers for video processing | CPU count |

## Examples

**High-resolution image:**
```bash
python weaver.py image photo.jpg --resolution 100 --output mosaic.png
```

**Quick video preview:**
```bash
python weaver.py video clip.mp4 --resolution 20 --fps 12 --output preview.gif
```

**Full-quality video processing:**
```bash
python weaver.py video movie.mp4 --resolution 60 --fps 30 --output output_frames/
```

## How It Works

1. Source media is divided into a grid based on `--resolution`
2. Each region's brightness is calculated using ITU-R BT.601 luminance formula
3. A tile matching that brightness level is randomly selected from the tileset
4. Tiles are resized and assembled into the final mosaic

## Performance Notes

- Image processing is single-threaded and relatively fast
- Video processing uses multiprocessing for parallel frame processing
- Higher resolution = more tiles = longer processing time
- Memory usage scales with resolution and video length

## Troubleshooting

**"Error: Tileset not found"**
- Ensure `tiles/tileset.png` exists or specify a custom path with `--tileset`

**"Video processing requires moviepy"**
- Install video dependencies: `pip install moviepy imageio imageio-ffmpeg`

**Output looks too dark/bright**
- Adjust your tileset to ensure even distribution across brightness levels
- Verify tiles in columns 0-7 range from dark to bright