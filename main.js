import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";
import { BoardGeometry } from "./game-logic/Board.js";

const initialState = {
  user: null,
  data: [],
  counter: 0,
  nickname: null,
  players: [
    { id: 1, x: 1, y: 1, direction: "down", lives: 3, active: true },
    { id: 2, x: 29, y: 1, direction: "down", lives: 3, active: false },
    { id: 3, x: 1, y: 11, direction: "down", lives: 3, active: false },
    { id: 4, x: 29, y: 11, direction: "down", lives: 3, active: false },
  ],
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

BoardGeometry.init({
  rows: 12,
  cols: 30,
});

// new function to place players
//
// pass a call back function that uses state to place the players into the board
function placePlayers(players) {
  const layer = document.getElementById("players-layer");
  if (!layer) return;

  layer.innerHTML = ""; // Clear previous

  for (const player of players) {
    const avatar = document.createElement("div");
    avatar.className = "player-avatar";
    avatar.dataset.id = player.id;

    const pos = BoardGeometry.getPixelPositionFromGrid(player.row, player.col);
    if (!pos) continue;

    avatar.style.transform = `translate(${pos.left + pos.width / 2}px, ${pos.top + pos.height / 2}px)`;
    layer.appendChild(avatar);
  }
}

const playersAtPosition = allPlayers.filter((p) => p.active);
const playerSprites = playersAtPosition
  .map(
    (player) =>
      `<div class="player-sprite player-${player.id}" data-direction="${player.direction}"></div>`,
  )
  .join("");

return `<div class="${cellClass}" data-row="${rowIndex}" data-col="${colIndex}">
                ${playerSprites}
              </div>`;
