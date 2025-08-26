import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";

const initialState = {
  path: '/',
  nickname: null,
  waitingPlayers: [],
  availableAvatars: [],
  game: {
    board: null,
    players: [],
    currentPlayer: null
  },
  currentPlayerId: null
};

const ws = new WebSocket('ws://localhost:8080');

function setupWebSocket() {
  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = event => {
    try {
      const { type, state, currentPlayerId } = JSON.parse(event.data);
      if (type === 'UPDATE_STATE') {
        app.enqueue({ type: 'STATE_UPDATE', state, currentPlayerId });
      }
    } catch (error) {
      console.error('Failed to process message:', error);
    }
  };

  ws.onerror = error => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed. Attempting to reconnect...');
    setTimeout(setupWebSocket, 3000); // Reconnect after 3 seconds
  };
}

setupWebSocket();

function update(state, msg) {
  switch (msg.type) {
    case "ROUTE_CHANGE":
      return { ...state, path: msg.path, nickname: msg.nickname || state.nickname };
    case "JOIN_AND_NAVIGATE":
      ws.send(JSON.stringify({ type: 'JOIN_AND_NAVIGATE', nickname: msg.nickname }));
      return { ...state, path: msg.path, nickname: msg.nickname };
    case "STATE_UPDATE":
      return { ...state, ...msg.state, currentPlayerId: msg.currentPlayerId };
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
