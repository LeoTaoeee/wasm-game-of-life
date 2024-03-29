import { Universe, Cell } from "wasm-game-of-life";
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

const universe = Universe.new();
const width = universe.width();
const height = universe.height();

const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

const ctx = canvas.getContext('2d');

//get the index of your cell in 1d memory
const getIndex = (row, column) => {
    return row * width + column;
};

//draw the grid
const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
};

//draw the cells
const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);

        ctx.fillStyle = cells[idx] === Cell.Dead
          ? DEAD_COLOR
          : ALIVE_COLOR;

        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.stroke();
  };

//var for if the game is paused
let animationId = null;

//loop where the game is rendered continuously
const renderLoop = () => {
  debugger;
  fps.render();
  universe.tick();

  drawGrid();
  drawCells();

  animationId = requestAnimationFrame(renderLoop);
};

//return true if game is paused
const isPaused = () => {
  return animationId === null;
};

//js code for the play/pause button
const playPauseButton = document.getElementById("play-pause");

//change button, continue game
const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
  };

//change button, stop game,
const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animationId);
    animationId = null;
};

//run the appropriate function when the button is clicked
playPauseButton.addEventListener("click", event => {
    if (isPaused()) {
      play();
    } else {
      pause();
    }
});

//js code for the reset button
const resetButton = document.getElementById("reset");
resetButton.textContent = "Reset";
resetButton.addEventListener("click", event => {
    universe.reset()
    drawCells();
});

//js code for the random button
const randomButton = document.getElementById("random");
randomButton.textContent = "Random";
randomButton.addEventListener("click", event => {
    universe.random()
    drawCells();
});

//allows individual cells to be toggled
canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    universe.toggle_cell(row, col);

    drawGrid();
    drawCells();
  });

//calculate fps
const fps = new class {
    constructor() {
      this.fps = document.getElementById("fps");
      this.frames = [];
      this.lastFrameTimeStamp = performance.now();
    }

    render() {
      // Convert the delta time since the last frame render into a measure
      // of frames per second.
      const now = performance.now();
      const delta = now - this.lastFrameTimeStamp;
      this.lastFrameTimeStamp = now;
      const fps = 1 / delta * 1000;

      // save only the latest 100 timings.
      this.frames.push(fps);
      if (this.frames.length > 100) {
        this.frames.shift();
      }

      // find the max, min, and mean of our 100 latest timings.
      let min = Infinity;
      let max = -Infinity;
      let sum = 0;
      for (let i = 0; i < this.frames.length; i++) {
        sum += this.frames[i];
        min = Math.min(this.frames[i], min);
        max = Math.max(this.frames[i], max);
      }
      let mean = sum / this.frames.length;

      // render the statistics.
      this.fps.textContent = `
  Frames per Second:
           latest = ${Math.round(fps)}
  avg of last 100 = ${Math.round(mean)}
  min of last 100 = ${Math.round(min)}
  max of last 100 = ${Math.round(max)}
  `.trim();
    }
};


//start the render loop
play();
