import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";

const initialState = {
  user: null,
  data: [],
  counter: 0,
  nickname: null,
  game: {
    board: null,
    players: [
      { id: 1, x: 1, y: 1, direction: 'down', lives: 3, active: true },
      { id: 2, x: 29, y: 1, direction: 'down', lives: 3, active: false },
      { id: 3, x: 1, y: 11, direction: 'down', lives: 3, active: false },
      { id: 4, x: 29, y: 11, direction: 'down', lives: 3, active: false }
    ],
    currentPlayer: 1
  }
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
      const newState = { 
        ...state, 
        path: msg.path,
        nickname: msg.nickname || state.nickname
      };
      
      return newState;
    case "INIT_GAME_BOARD":
      return {
        ...state,
        game: {
          ...state.game,
          board: msg.board
        }
      };
    case "MOVE_PLAYER":
      const updatedPlayers = state.game.players.map(player => 
        player.id === msg.playerId 
          ? { ...player, x: msg.x, y: msg.y, direction: msg.direction }
          : player
      );
      return {
        ...state,
        game: {
          ...state.game,
          players: updatedPlayers
        }
      };
    case "START_NEW_GAME":
      return {
        ...state,
        game: {
          ...state.game,
          board: null,
          players: [
            { id: 1, x: 1, y: 1, direction: 'down', lives: 3, active: true },
            { id: 2, x: 29, y: 1, direction: 'down', lives: 3, active: false },
            { id: 3, x: 1, y: 11, direction: 'down', lives: 3, active: false },
            { id: 4, x: 29, y: 11, direction: 'down', lives: 3, active: false }
          ]
        }
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
      children: [routedContent]
    }
  ];
}

// Initialize with routing
const app = initWithRouting(
  document.getElementById('app'),
  initialState,
  update,
  createMainView
);
