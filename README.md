CURRENT FUNCTIONALITY:
- Source image is set in code
- The code "chunks" the image into squares, measures the average brightness of each square, and then lays a "tile" from a spritesheet of the appropriate brightness at the position
- "Resolution" is set in the code as well
- There is a loop that lets the code execute one tile at a time, which is nice to look at, but I want that to happen as fast as possible—with no arbitrary slowdown. 

WHAT WORKS:
- It correctly assigns brightness

ISSUES:
- It's slow, and could be faster
- There's a "save" button, but it's not styled—I think I'd rather have the buttons be in the HTML, out of the canvas, so I can control it without overlaying any buttons

WANTED FEATURES:
- HTML input to set canvas resolution for different images (from 1000 x 1000 px all the way up to 1920 x 1080)
- Slider for setting "resolution" of output image (how many tiles wide it is), which should always "snap" to a point where the tiles are only whole-pixel-widths/heights, as the math sometimes makes them half as large, which results in tearing
- BIG SHIFT, would probably call for a different "tab", but this is one thing I need soon: Switching to a video mode, where it can process a .gif or video and either download, frame by frame, a mosaic video, or stitch the output together to make a complete gif/mp4 that can be downloaded

---

Core functionality:

1. Process still images from an input image, using a "spritesheet"/"tilesheet" I supply to make a photomosaic
2. Another tab where you can do this same process to a video. 
    - Dream feature: You can "keyframe" changes in resolution. For example, maybe a video starts at 10 x 10 tiles, but then gets split into higher detail over the course of 2 minutes, like gradually adding tiles until it's subdivided into 150 x 150 tiles.

QoL features:

- Extremely minimal interface, modern, off-black and off-white, with clean monospace text buttons, should feel like a Bloomberg terminal or something. Very sharp. 
- Maximum speed

Nice to have: 

- Should let users know if they've set it to a resolution that's too large (or just like, cap it at 200, 300 wide?)
- Should be able to stop or resume operations with buttons?


Data structure: 
- I have no idea

UI: 

- Image/video selector (or set in code if its too hard)
- Download image button (greyed out until complete)
- Stop/start button

Code organization:

- tile() function tiles a frame
- saveImage() function saves and titles an image appropriately
- Not sure what else, I'm struggling here. 