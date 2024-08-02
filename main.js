import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";
import WebSocketClient from "./utils/websocket.js";

// Global WebSocket client instance
window.wsClient = new WebSocketClient();

const initialState = {
  user: null,
  data: [],
  counter: 0,
  nickname: null,
  playerId: null,
  avatar: null,
  waitingRoom: {
    players: [],
    playerCount: 0,
    autoStartTime: 20000,
    countdownTime: 10000,
    gameStartTime: null
  },
  game: {
    board: null,
    players: [],
    bombs: [],
    explosions: [],
    powerUps: [],
    isActive: false,
    gameDuration: 180000
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
      
      // Connect to WebSocket when entering waiting room
      if (msg.path === "/waiting" && msg.nickname && !window.wsClient.isConnected) {
        window.wsClient.connect(msg.nickname);
      }
      
      return newState;
    case "WELCOME":
      return {
        ...state,
        playerId: msg.playerId,
        avatar: msg.avatar
      };
    case "WAITING_ROOM_UPDATE":
      return {
        ...state,
        waitingRoom: {
          ...state.waitingRoom,
          players: msg.players.map(p => ({
            ...p,
            isCurrentUser: p.nickname === state.nickname
          })),
          playerCount: msg.playerCount,
          autoStartTime: msg.autoStartTime,
          countdownTime: msg.countdownTime,
          gameStartTime: msg.gameStartTime
        }
      };
    case "COUNTDOWN_START":
      return {
        ...state,
        waitingRoom: {
          ...state.waitingRoom,
          gameStartTime: msg.gameStartTime
        }
      };
    case "GAME_START":
      return {
        ...state,
        game: {
          ...state.game,
          board: msg.board,
          players: msg.players,
          isActive: true,
          gameDuration: msg.gameDuration
        },
        gameStartTime: Date.now()
      };
    case "PLAYER_MOVE":
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
    case "BOMB_PLACED":
      return {
        ...state,
        game: {
          ...state.game,
          bombs: [...state.game.bombs, msg.bomb]
        }
      };
    case "BOMB_EXPLODED":
      const playersAfterExplosion = state.game.players.map(player => {
        const affected = msg.affectedPlayers.find(p => p.id === player.id);
        return affected ? { ...player, lives: affected.lives, active: affected.active } : player;
      });
      
      return {
        ...state,
        game: {
          ...state.game,
          players: playersAfterExplosion,
          explosions: [...state.game.explosions, msg.explosion],
          powerUps: [...state.game.powerUps, ...msg.newPowerUps]
        }
      };
    case "EXPLOSION_CLEARED":
      return {
        ...state,
        game: {
          ...state.game,
          explosions: state.game.explosions.filter(e => e.id !== msg.explosionId)
        }
      };
    case "POWERUP_COLLECTED":
      const playersAfterPowerUp = state.game.players.map(player => 
        player.id === msg.playerId 
          ? { 
              ...player, 
              maxBombs: msg.playerStats.maxBombs,
              explosionRange: msg.playerStats.explosionRange,
              speed: msg.playerStats.speed
            }
          : player
      );
      
      return {
        ...state,
        game: {
          ...state.game,
          players: playersAfterPowerUp,
          powerUps: state.game.powerUps.filter(p => p.id !== msg.powerUpId)
        }
      };
    case "CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...(state.chatMessages || []), {
          playerId: msg.playerId,
          nickname: msg.nickname,
          message: msg.message,
          timestamp: msg.timestamp
        }]
      };
    case "GAME_END":
      return {
        ...state,
        game: {
          ...state.game,
          isActive: false,
          board: null,
          players: [],
          bombs: [],
          explosions: [],
          powerUps: []
        }
      };
    case "TIMER_UPDATE":
      // Just return the same state to trigger a re-render
      return { ...state };
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

// Make app instance globally available for timer updates
window.app = app;

// Set up WebSocket message handlers
window.wsClient.onMessage('WELCOME', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('WAITING_ROOM_UPDATE', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('COUNTDOWN_START', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('GAME_START', (data) => {
  app.enqueue(data);
  // Navigate to game page
  window.history.pushState({}, "", "/game");
  app.enqueue({ type: "ROUTE_CHANGE", path: "/game" });
});

window.wsClient.onMessage('PLAYER_MOVE', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('BOMB_PLACED', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('BOMB_EXPLODED', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('EXPLOSION_CLEARED', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('POWERUP_COLLECTED', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('CHAT_MESSAGE', (data) => {
  app.enqueue(data);
});

window.wsClient.onMessage('GAME_END', (data) => {
  app.enqueue(data);
  // Navigate back to home
  setTimeout(() => {
    window.history.pushState({}, "", "/");
    app.enqueue({ type: "ROUTE_CHANGE", path: "/" });
  }, 3000);
});

window.wsClient.onMessage('ERROR', (data) => {
  console.error('Server error:', data.message);
  alert('Error: ' + data.message);
});
