let sourceImage;
let tilesetCollection = [];
// let accentCollection = [];

// Input setup
let tilesets = 10;
let tilesetSize = 8;
let spriteHeight = 50;

let initTileSize = 25;

let tileSizeSlider;
let accentChance = 0.0;

// Progress tracking
let currentRow = 0;
let currentCol = 0;
let totalRows, totalCols;
let isComplete = false;

// Loading speed controls
let tilesPerFrame = 10;
let framerate = 240;

let selectedTileset = 2;

function preload() {
    sourceImage = loadImage('test-2.png');

    for (let i = 1; i < (tilesets + 1); i++) {
        tilesetCollection.push(loadImage('tiles/tileset_' + i + '.png'));
    }
}

function setup() {
    createCanvas(1000, 1000);
    background(255);

    frameRate(framerate);

    // UI Elements
    tileSizeSlider = createSlider(5, 250, initTileSize, 25);
    tileSizeSlider.position(10,20);
}

function draw() {
function saveProof() {
  let d = new Date();
  let yy = String(d.getFullYear()).slice(2);
  let mm = String(d.getMonth() + 1).padStart(2, '0');
  let dd = String(d.getDate()).padStart(2, '0');
  let hh = String(d.getHours()).padStart(2, '0');
  let min = String(d.getMinutes()).padStart(2, '0');
  let ss = String(d.getSeconds()).padStart(2, '0');
  // Format: /proofs/YYMMDD-HHMMSS.png
  let filename = `proofs_${yy}${mm}${dd}-${hh}${min}${ss}`;
  saveCanvas(filename, 'png');
}

    let tileSize = tileSizeSlider.value();

    totalCols = sourceImage.width / tileSize;
    totalRows = sourceImage.height / tileSize;

    if (isComplete) {
        noLoop();
        saveProof();
        return;
    }

    for (let i = 0; i < tilesPerFrame; i++) {
        if (currentRow >= totalRows) {
            isComplete = true;
            console.log("Rendering complete");
            break;
        }

        let x = currentCol * tileSize;
        let y = currentRow * tileSize;

        if (Math.random() < accentChance) {
            // Accent tile code
        } else {
            let tileChunk = sourceImage.get(x, y, tileSize, tileSize);
            tileChunk.loadPixels();

            let totalBrightness = 0;
            let pixelCount = tileChunk.pixels.length / 4;

            for (let j = 0; j < tileChunk.pixels.length; j += 4) {
                let r = tileChunk.pixels[j];
                let g = tileChunk.pixels[j + 1];
                let b = tileChunk.pixels[j + 2];

                let bright = 0.299 * r + 0.587 * g + 0.114 * b;
                totalBrightness += bright;
            }

            let avgBrightness = totalBrightness / pixelCount;
            let tileIndex = floor(map(avgBrightness, 0, 255, 0, tilesetSize - 0.01));
            let sx = tileIndex * spriteHeight;

            if (Math.random() < accentChance) {
                image(tilesetCollection[6], x, y, tileSize, tileSize, sx, 0, 50, 50);
            } else {
                image(tilesetCollection[selectedTileset], x, y, tileSize, tileSize, sx, 0, 50, 50);
            }
        }

        // Move to next tile
        currentCol++;
        if (currentCol >= totalCols) {
            currentCol = 0;
            currentRow++;
        }
    }
}

// need to figure out how to make filenames dated like (YYMMDD-001, -002, and so on)
// let filename = toString(Date.now()); 
// saveCanvas('/output/test', 'png');