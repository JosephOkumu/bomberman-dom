const BoardGeometry = {
  cellWidth: 0,
  cellHeight: 0,
  boardRect: null,
  rows: 12,
  cols: 30,

  init({ rows = 12, cols = 30 }) {
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
  },
};
