// let tileset;

// // Tileset properties
// let tilesetColumns = 8;
// let tilesetRows;
// let spriteSize = 50;

// // Mosaic settings
// let tilesPerRow = 60;
// let tileSize;

// // Batch processing
// let frameIndex = 0;
// let maxFrames = 100; // Adjust based on how many frames you have
// let currentFrame;
// let isProcessing = false;

// function preload() {
//     tileset = loadImage('tiles/tileset.png');
// }

// function setup() {
//     createCanvas(640, 480);
//     background(255);
    
//     // Calculate tileset rows
//     tilesetRows = tileset.height / spriteSize;
//     console.log(`Tileset loaded: ${tilesetColumns} columns, ${tilesetRows} rows`);
    
//     // Start processing first frame
//     // loadNextFrame();
// }

// function loadNextFrame() {
//     if (frameIndex >= maxFrames) {
//         console.log("All frames processed!");
//         noLoop();
//         return;
//     }
    
//     // Format frame number with leading zeros (frame00, frame01, etc.)
//     let frameNum = nf(frameIndex, 2);
//     let framePath = `video-demo/frames/frame${frameNum}.png`;
    
//     console.log(`Loading frame ${frameIndex}: ${framePath}`);
    
//     loadImage(
//         framePath,
//         (img) => {
//             currentFrame = img;
//             isProcessing = true;
//             processFrame();
//         },
//         () => {
//             // If loading fails, we've reached the end
//             console.log(`No more frames found. Processed ${frameIndex} frames.`);
//             noLoop();
//         }
//     );
// }

// function processFrame() {
//     background(255);
//     tileSize = currentFrame.width / tilesPerRow;
    
//     // Process entire frame at once
//     for (let row = 0; row < tilesPerRow; row++) {
//         for (let col = 0; col < tilesPerRow; col++) {
//             let x = col * tileSize;
//             let y = row * tileSize;
            
//             let tileChunk = currentFrame.get(x, y, tileSize, tileSize);
//             tileChunk.loadPixels();
            
//             let totalBrightness = 0;
//             let pixelCount = tileChunk.pixels.length / 4;
            
//             for (let j = 0; j < tileChunk.pixels.length; j += 4) {
//                 let r = tileChunk.pixels[j];
//                 let g = tileChunk.pixels[j + 1];
//                 let b = tileChunk.pixels[j + 2];
                
//                 let bright = 0.299 * r + 0.587 * g + 0.114 * b;
//                 totalBrightness += bright;
//             }
            
//             let avgBrightness = totalBrightness / pixelCount;
//             let columnIndex = floor(map(avgBrightness, 0, 255, 0, tilesetColumns - 0.01));
//             let rowIndex = floor(Math.random() * tilesetRows);
            
//             let sx = columnIndex * spriteSize;
//             let sy = rowIndex * spriteSize;
            
//             image(tileset, x, y, tileSize, tileSize, sx, sy, spriteSize, spriteSize);
//         }
//     }
    
//     // Save the processed frame
//     let frameNum = nf(frameIndex, 2);
//     let filename = `mosaic-frame${frameNum}`;
//     saveCanvas(filename, 'png');
    
//     console.log(`Saved ${filename}.png`);
    
//     // Move to next frame
//     frameIndex++;
//     isProcessing = false;
    
//     // Small delay before loading next frame
//     setTimeout(loadNextFrame, 100);
// }

// function draw() {
//     // Display progress
//     if (isProcessing) {
//         fill(0);
//         noStroke();
//         textSize(18);
//         textAlign(LEFT);
//         text(`Processing frame ${frameIndex}...`, 10, 30);
//     }
// }