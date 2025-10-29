
// Do these need to be declared out here? 
let sourceImage;
let tilesetCollection = [];

// Input setup
let tilesetCount = 8;
let tilesetSize = 8;
let spriteHeight = 50;

// Nice settings: 40, 80
let tilesPerRow = 120; // Key setting
let tileSize;

let tileSizeSlider;
let accentChance = 1/8; // Key setting

// Progress tracking
let currentRow = 0;
let currentCol = 0;
let isComplete = false;

// Loading speed controls
let tilesPerFrame = 20;
let framerate = 60;

let selectedTileset = 2;

function preload() {
    sourceImage = loadImage('source-images/test-3.png');

    for (let i = 1; i < (tilesetCount + 1); i++) {
        tilesetCollection.push(loadImage('tiles/tileset_' + i + '.png'));
    }
}

function setup() {
    createCanvas(2000, 2000);
    background(255);

    frameRate(framerate);

    // Do these buttons need to be declared in setup? They can't be declared up top?
    let saveButton = createButton('Save Image');
    let runButton = createButton('Begin Tiling');

    saveButton.position(100, 15);
    runButton.position(200, 15);

    saveButton.mousePressed(saveProof);
    runButton.mousePressed(tile);
}

function saveProof() {
    let filename = `synova-proof-${year()}${month()}${day()}-${hour()}${minute()}`;
    saveCanvas(filename, 'png');
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
        let tileIndex = floor(map(avgBrightness, 0, 255, 0, tilesetSize - 0.01));
        let sx = tileIndex * spriteHeight;

        // if (Math.random() < accentChance) {
            image(tilesetCollection[floor(Math.random() * tilesetCount)], x, y, tileSize, tileSize, sx, 0, 50, 50);
        // } else {
        //     image(tilesetCollection[selectedTileset], x, y, tileSize, tileSize, sx, 0, 50, 50);
        // }

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
}