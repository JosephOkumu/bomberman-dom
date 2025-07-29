import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";
import { BoardGeometry } from "./game-logic/Board.js";

const initialState = {
  user: null,
  data: [],
  counter: 0,
  nickname: null,
};

function update(state, msg) {
  switch (msg.type) {
    case "USER_LOGIN":
      return { ...state, user: msg.user };
    case "LOAD_DATA":
      return { ...state, data: msg.data };
    case "INCREMENT":
      return { ...state, counter: state.counter + 1 };
    case "DECREMENT":
      return { ...state, counter: state.counter - 1 };
    case "ROUTE_CHANGE":
      return {
        ...state,
        path: msg.path,
        nickname: msg.nickname || state.nickname,
      };
    default:
      return state;
  }
}

// Main layout view that wraps routed content
function createMainView(state, routedContent) {
  return [
    {
      tag: "main",
      children: [routedContent],
    },
  ];
}

// Initialize with routing
const app = initWithRouting(
  document.getElementById("app"),
  initialState,
  update,
  createMainView,
);

// function monitorBoardCell(row = 0, col = 0, onRectUpdate) {
//   const selector = `[data-row="0"][data-col="0"]`;

//   const observer = new MutationObserver((_, obs) => {
//     const cell = document.querySelector(selector);
//     if (cell) {
//       obs.disconnect();

//       const resizeObs = new ResizeObserver(() => {
//         onRectUpdate(cell.getBoundingClientRect());
//       });

//       resizeObs.observe(cell);
//       window.addEventListener("resize", () => {
//         onRectUpdate(cell.getBoundingClientRect());
//       });

//       // Initial call
//       onRectUpdate(cell.getBoundingClientRect());
//     }
//   });

//   observer.observe(document.body, { childList: true, subtree: true });
// }

// monitorBoardCell(0, 0, (rect) => {
//   console.log(
//     "Live rect for cell 0,0:, we will use this to get the board size for collisins",
//     rect,
//   );
// });

BoardGeometry.init({
  rows: 12,
  cols: 30,
});
