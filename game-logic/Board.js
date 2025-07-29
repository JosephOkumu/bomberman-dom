// this is a global board object with co-oridnates of the first cells in the game board
// we also get the size of the whold board base on the returned pixes and multply them with rows and columns
const BoardGeometry = {
  cellWidth: 0,
  cellHeight: 0,
  boardRect: null,
  rows: 12,
  cols: 30,

  // init function gets all the values and sets them up
  init({ rows = 12, cols = 30 }) {
    const updateGeometry = () => {
      const cell = document.querySelector('[data-row="0"][data-col="0"');
      if (!cell) return;

      const cellRect = cell.getBoundingClientRect();
      this.cellWidth = cellRect.width;
      this.cellHeight = cellRect.height;

      const boardRect = {
        left: cellRect.left,
        top: cellRect.top,
        width: this.cellWidth * this.cols,
        height: this.cellHeight * this.rows,
        right: cellRect.left + this.cellWidth * this.cols,
        bottom: cellRect.top + this.cellHeight * this.rows,
      };

      this.boardRect = boardRect;
    };

    // this checks if the board is mounted on the page, then gets the co-ordinates
    // we also check again if the page is resized
    const waitForCell = () => {
      const cell = document.querySelector('[data-row="0"][data-col="0"]');
      if (cell) {
        updateGeometry();
        window.addEventListener("resize", () =>
          requestAnimationFrame(updateGeometry),
        );
        return true;
      }
      return false;
    };

    if (!waitForCell()) {
      const obs = new MutationObserver(() => {
        if (waitForCell()) obs.disconnect();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  },

  // we get row and column base and the x and y passed of a value(coudl be your player on the board)
  getGridCoordsFromPixels(x, y) {
    if (!this.boardRect || !this.cellWidth || !this.cellHeight) return null;

    const col = Math.floor((x - this.boardRect.left) / this.cellWidth);
    const row = Math.floor((y - this.boardRect.top) / this.cellHeight);

    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;

    return { row, col };
  },

  // additional functin to get pixel based on the row and column of the game board
  getPixelPositionFromGrid(row, col) {
    if (!this.boardRect || !this.cellWidth || !this.cellHeight) return null;
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;

    const left = this.boardRect.left + col * this.cellWidth;
    const top = this.boardRect.top + row * this.cellHeight;

    return {
      left,
      top,
      right: left + this.cellWidth,
      bottom: top + this.cellHeight,
      width: this.cellWidth,
      height: this.cellHeight,
    };
  },
};

export { BoardGeometry };
