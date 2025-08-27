import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";

const initialState = {
  path: '/',
  nickname: null,
  winner: null,
  waitingPlayers: [],
  availableAvatars: [],
  chatMessages: [],
  timers: {
    minPlayersTimer: { remaining: 20 },
    gameStartTimer: { remaining: 10 }
  },
  game: {
    board: null,
    players: [],
    bombs: [],
    explosions: [],
    currentPlayer: null
  },
  currentPlayerId: null
};

const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = event => {
  const { type, state, currentPlayerId, messages, payload, playerId } = JSON.parse(event.data);
  if (type === 'UPDATE_STATE') {
    app.enqueue({ type: 'STATE_UPDATE', state });
  } else if (type === 'SET_PLAYER_ID') {
    app.enqueue({ type: 'SET_PLAYER_ID', playerId });
  } else if (type === 'GAME_START') {
    app.enqueue({ type: 'GAME_STARTED', state, currentPlayerId });
  } else if (type === 'NEW_CHAT_MESSAGE') {
    app.enqueue({ type: 'CHAT_MESSAGES_UPDATED', messages });
  } else if (type === 'EXPLOSION') {
    app.enqueue({ type: 'SHOW_EXPLOSION', payload });
  } else if (type === 'GAME_OVER') {
    app.enqueue({ type: 'SHOW_GAME_OVER', payload });
  }
};

function update(state, msg) {
  switch (msg.type) {
    case "ROUTE_CHANGE":
      return { ...state, path: msg.path, nickname: msg.nickname || state.nickname };
    case "JOIN_AND_NAVIGATE":
      ws.send(JSON.stringify({ type: 'JOIN_AND_NAVIGATE', nickname: msg.nickname }));
      return { ...state, path: msg.path, nickname: msg.nickname };
    case "STATE_UPDATE":
      return { ...state, ...msg.state };
    case "SET_PLAYER_ID":
      return { ...state, currentPlayerId: msg.playerId };
    case "GAME_STARTED":
      return { ...state, ...msg.state, path: '/game', currentPlayerId: msg.currentPlayerId || state.currentPlayerId };
    case 'CHAT_MESSAGE':
      ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', message: msg.message }));
      return state;
    case 'CHAT_MESSAGES_UPDATED':
      return { ...state, chatMessages: msg.messages };
    case 'MOVE_PLAYER':
      ws.send(JSON.stringify({ type: 'PLAYER_MOVE', payload: { playerId: msg.playerId, x: msg.x, y: msg.y, direction: msg.direction } }));
      return state;
    
    case 'PLACE_BOMB':
      ws.send(JSON.stringify({ type: 'PLAYER_PLACE_BOMB', payload: msg.payload }));
      return state;
    case 'SHOW_EXPLOSION':
      setTimeout(() => {
        app.enqueue({ type: 'CLEAR_EXPLOSION', payload: { explosionId: msg.payload.explosionId } });
      }, 500);
      return { ...state, game: { ...state.game, explosions: [...state.game.explosions, msg.payload] } };
    case 'CLEAR_EXPLOSION':
      return { ...state, game: { ...state.game, explosions: state.game.explosions.filter(exp => exp.explosionId !== msg.payload.explosionId) } };
    case 'SHOW_GAME_OVER':
      return { ...state, gameStatus: 'finished', winner: msg.payload.winner };
    case 'RESET_GAME':
      ws.send(JSON.stringify({ type: 'RESET_GAME' }));
      return { ...state, path: '/' };
    case 'LEAVE_GAME':
      ws.send(JSON.stringify({ type: 'LEAVE_GAME' }));
      return { ...state, path: '/' };
    case 'LEAVE_WAITING_ROOM':
      ws.send(JSON.stringify({ type: 'LEAVE_WAITING_ROOM' }));
      return { ...state, path: '/' };
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
