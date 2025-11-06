
// Mosaic settings 
let sourceImage = 'test-11.png';
let tilesPerRow = 20; // Key setting

let tileSize;

// Progress tracking
let currentRow = 0;
let currentCol = 0;
let isComplete = false;

// Loading speed controls
let tilesPerFrame = 20;
let framerate = 60;

// Tileset properties
let spriteSize = 50;
let tilesetColumns = 8;
let tilesetRows;

let tileset;
let sourceImagePath;

function preload() {
    sourceImagePath = loadImage('source-images/' + sourceImage);
    tileset = loadImage('tiles/tileset.png');
}

function setup() {
    createCanvas(1000, 1000);
    background(255);

    frameRate(framerate);

    tilesetRows = tileset.height / spriteSize;
    console.log(`Tileset loaded: ${tilesetColumns} columns, ${tilesetRows} rows`);
    tileSize = sourceImagePath.width / tilesPerRow;

    let saveButton = createButton('Save Image');

    saveButton.position(40, 15);

    saveButton.mousePressed(saveProof);
}

function saveProof() {
    let filename = `synova-proof-${year()}${month()}${day()}-${hour()}${minute()}`;
    saveCanvas(filename, 'png');
}

function startTiling() {
    currentRow = 0;
    currentCol = 0;
    isComplete = false;
    background(255);
}

function timeStamp() {
    textSize(16);
    fill(215);

    let settingsCode = (
        "Weaver v.02" + "\n" +
        "Res: " + String(tilesPerRow) + "\n" +
        "Tilesize: " + String(1000 / tilesPerRow)
    );

    text(settingsCode, 840, 30);
}

function tile() {
    if (isComplete) {
        noLoop();
        return;
    }

    for (let i = 0; i < tilesPerFrame; i++) {
        if (currentRow >= tilesPerRow) {
            isComplete = true;
            console.log("Rendering complete");
            break;
        }

        let x = currentCol * tileSize;
        let y = currentRow * tileSize;

        let tileChunk = sourceImagePath.get(x, y, tileSize, tileSize);
        tileChunk.loadPixels();

        let totalBrightness = 0;
        let pixelCount = tileChunk.pixels.length / 4;

        // Calculate brightness of chunk
        for (let j = 0; j < tileChunk.pixels.length; j += 4) {
            let r = tileChunk.pixels[j];
            let g = tileChunk.pixels[j + 1];
            let b = tileChunk.pixels[j + 2];

            let bright = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += bright;
        }

        let avgBrightness = totalBrightness / pixelCount;

        // Map brightness to column (0-7 for columns 1-8)
        let columnIndex = floor(map(avgBrightness, 0, 255, 0, tilesetColumns - 0.01));

        // Randomly select a row variation
        let rowIndex = floor(Math.random() * tilesetRows);

        // Calculate source position in tileset
        let sx = columnIndex * spriteSize;
        let sy = rowIndex * spriteSize;

        // Draw the tile
        image(tileset, x, y, tileSize, tileSize, sx, sy, spriteSize, spriteSize);

        // Move to next tile
        currentCol++;
        if (currentCol >= tilesPerRow) {
            currentCol = 0;
            currentRow++;
        }
    }
}

function draw() {
    tile();
    timeStamp();
}