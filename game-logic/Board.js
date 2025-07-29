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
};
