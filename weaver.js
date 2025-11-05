let sourceImage;
let tileset;

// Tileset properties
let tilesetColumns = 8; // Fixed: brightness levels
let tilesetRows; // Dynamic: calculated from image height
let spriteSize = 50;

// Mosaic settings
let tilesPerRow = 70; // Key setting
let tileSize;

// let accentChance = 1 / 8; // Key setting (not currently used, but preserved)

// Progress tracking
let currentRow = 0;
let currentCol = 0;
let isComplete = false;

// Loading speed controls
let tilesPerFrame = 20;
let framerate = 60;

function preload() {
    sourceImage = loadImage('source-images/test-4.png');
    tileset = loadImage('tiles/tileset.png');
}

function setup() {
    createCanvas(1000, 1000);
    background(255);

    frameRate(framerate);

    // Calculate number of rows in tileset
    tilesetRows = tileset.height / spriteSize;
    console.log(`Tileset loaded: ${tilesetColumns} columns, ${tilesetRows} rows`);

    // Do these buttons need to be declared in setup? They can't be declared up top?
    let saveButton = createButton('Save Image');
    let runButton = createButton('Begin Tiling');

    saveButton.position(100, 15);
    runButton.position(200, 15);

    saveButton.mousePressed(saveProof);
    runButton.mousePressed(startTiling);
}

function saveProof() {
    let filename = `synova-proof-${year()}${month()}${day()}-${hour()}${minute()}`;
    saveCanvas(filename, 'png');
}

function startTiling() {
    // Reset progress
    currentRow = 0;
    currentCol = 0;
    isComplete = false;
    background(255);
}

// Tile doesn't loop—it only incrementally runs when the runButton is pressed—it should run until completed, or restart if hit while it's running. 
function tile() {
    tileSize = sourceImage.width / tilesPerRow;

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
    let settingsStamp = "Res: " + String(tilesPerRow); 
    textSize(18);
    text(settingsStamp, 910, 30);
}