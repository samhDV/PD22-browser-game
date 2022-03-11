const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const grid = 20;
const maxX = canvas.width / grid;
const maxY = canvas.height / grid;

const colors: Record<string, string> = {
  I: "#34B233",
  O: "#A6ABB1",
  T: "#6E2CB5",
  S: "#C70099",
  Z: "#00B2A9",
  J: "#F2994A",
  L: "#131787",
};

type Matrix = Readonly<(0 | 1)[][]>;
type Playfield = (string | number)[][];

type Tetromino = Readonly<{
  name: string;
  matrix: Matrix;
  x: number;
  y: number;
}>;

const tetrominos: Record<string, Matrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

let playfield: Playfield = [];

// populate the empty state
for (let row = 0; row < maxY; row++) {
  playfield[row] = [];

  for (let col = 0; col < maxX; col++) {
    playfield[row][col] = 0;
  }
}

function draw(matrix: Matrix, x: number, y: number, color: string) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        // drawing 1 px smaller than the grid creates a grid effect
        ctx.fillStyle = color;
        ctx.fillRect((x + col) * grid, (y + row) * grid, grid - 1, grid - 1);
      }
    }
  }
}

function rotateMatrix(matrix: Matrix): Matrix {
  const N = matrix.length - 1;
  return matrix.map((row, x) => row.map((el, y) => matrix[N - y][x]));
}

function getNextTetromino(): Tetromino {
  const keys = Object.keys(tetrominos);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return {
    name: randomKey,
    matrix: tetrominos[randomKey],
    x: 0,
    y: 0,
  };
}

let tetromino = getNextTetromino();

document.addEventListener("keydown", function (e) {
  // left and right arrow keys (move)
  if (e.which === 37) {
    tetromino = goLeft(tetromino);
  }

  if (e.which === 39) {
    tetromino = goRight(tetromino);
  }

  // up arrow key (rotate)
  if (e.which === 38) {
    tetromino = rotate(tetromino);
  }

  // down arrow key (drop)
  if (e.which === 40) {
    tetromino = goDown(tetromino);
  }

  // d for 'drop in place'
  if (e.which === 68) {
    tetromino = placeTetromino(tetromino);
  }

  // space
  if (e.which === 32) {
    paused = !paused;
  }
});

function goDown(tetromino: Tetromino): Tetromino {
  const newState = { ...tetromino, y: tetromino.y + 1 };
  return isValid(newState) ? newState : tetromino;
}

function canGoDown(tetromino: Tetromino): boolean {
  const newState = { ...tetromino, y: tetromino.y + 1 };
  return isValid(newState);
}

function goLeft(tetromino: Tetromino): Tetromino {
  const newState = { ...tetromino, x: tetromino.x - 1 };
  return isValid(newState) ? newState : tetromino;
}

function goRight(tetromino: Tetromino): Tetromino {
  const newState = { ...tetromino, x: tetromino.x + 1 };
  return isValid(newState) ? newState : tetromino;
}

function goUp(tetromino: Tetromino): Tetromino {
  const newState = { ...tetromino, y: tetromino.y - 1 };
  return isValid(newState) ? newState : tetromino;
}

function rotate(tetromino: Tetromino): Tetromino {
  const newState = { ...tetromino, matrix: rotateMatrix(tetromino.matrix) };
  return isValid(newState) ? newState : tetromino;
}

function placeTetromino(tetromino: Tetromino) {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        playfield[tetromino.y + row][tetromino.x + col] = tetromino.name;
      }
    }
  }
  verifyPlayfield(playfield);
  return getNextTetromino();
}

function verifyPlayfield(playfield: Playfield): void {
  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every((cell) => !!cell)) {
      // drop every row above this one
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          const val = r > 0 ? playfield[r - 1][c] : 0;
          playfield[r][c] = val;
        }
      }
    } else {
      row--;
    }
  }
}

let counter = 0;
let paused = false;

function loop() {
  if (paused) {
    return;
  }
  counter++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw playfield
  for (let row = 0; row < maxY; row++) {
    for (let col = 0; col < maxX; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        ctx.fillStyle = colors[name];
      } else {
        ctx.fillStyle = "white";
      }
      ctx.fillRect(col * grid, row * grid, grid - 1, grid - 1);
    }
  }

  if (counter === 30) {
    counter = 0;
    if (!canGoDown(tetromino)) {
      tetromino = placeTetromino(tetromino);
    } else {
      tetromino = goDown(tetromino);
    }
  }

  draw(tetromino.matrix, tetromino.x, tetromino.y, colors[tetromino.name]);
}

setInterval(loop, 10);

function isValid(tetromino: Tetromino) {
  return isValidMove(tetromino.matrix, tetromino.x, tetromino.y);
}

function isValidMove(matrix: Matrix, cellCol: number, cellRow: number) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // outside the game bounds
        (cellCol + col < 0 ||
          cellRow + row < 0 ||
          cellCol + col >= maxX ||
          cellRow + row >= maxY ||
          playfield[cellRow + row][cellCol + col])
      ) {
        return false;
      }
    }
  }

  return true;
}
