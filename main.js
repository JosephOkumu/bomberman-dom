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
    board: [],
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
  const { type, state, currentPlayerId, messages, payload, playerId, dirtyCells } = JSON.parse(event.data);
  if (type === 'UPDATE_STATE') {
    app.enqueue({ type: 'STATE_UPDATE', state, dirtyCells });
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
      const { state: serverState, dirtyCells } = msg;
      const newState = { ...state, ...serverState };

      if (Array.isArray(newState.game.board) && typeof newState.game.board[0] === 'string') {
        // Initial board setup from string array
        const boardData = newState.game.board.map((row, y) => row.split('').map((cell, x) => ({
          type: cell, x, y, players: [], bombs: [], hasExplosion: false, powerup: null, isDirty: true
        })));
        newState.game.board = boardData;
      } else if (state.game.board) {
        // Create a new board based on the old one, resetting dirty flags
        newState.game.board = state.game.board.map(row => row.map(cell => ({ ...cell, isDirty: false })));
      }

      // Clear dynamic entities before re-placing them
      if (Array.isArray(newState.game.board)) {
        newState.game.board.forEach(row => row.forEach(cell => {
          cell.players = [];
          cell.bombs = [];
          cell.powerup = null;
        }));
      }

      // Place players, bombs, and powerups from the new state
      newState.game.players.forEach(player => {
        if (player.active && newState.game.board[player.y] && newState.game.board[player.y][player.x]) {
          newState.game.board[player.y][player.x].players.push(player);
        }
      });
      newState.game.bombs.forEach(bomb => {
        if (newState.game.board[bomb.y] && newState.game.board[bomb.y][bomb.x]) {
          newState.game.board[bomb.y][bomb.x].bombs.push(bomb);
        }
      });
      newState.game.powerups.forEach(powerup => {
        if (newState.game.board[powerup.y] && newState.game.board[powerup.y][powerup.x]) {
          newState.game.board[powerup.y][powerup.x].powerup = powerup;
        }
      });

      // Use server-provided dirtyCells to mark specific cells for re-render
      if (dirtyCells) {
        dirtyCells.forEach(dc => {
          if (newState.game.board[dc.y] && newState.game.board[dc.y][dc.x]) {
            newState.game.board[dc.y][dc.x].isDirty = true;
          }
        });
      }

      return newState;
    case "SET_PLAYER_ID":
      return { ...state, currentPlayerId: msg.playerId };
    case "GAME_STARTED":
        const boardData = msg.state.game.board.map((row, y) => row.split('').map((cell, x) => ({
            type: cell,
            x,
            y,
            players: [],
            bombs: [],
            hasExplosion: false,
            powerup: null,
            isDirty: true
        })));

        msg.state.game.players.forEach(player => {
            if (player.active) {
                boardData[player.y][player.x].players.push(player);
            }
        });

        return { ...state, ...msg.state, game: { ...msg.state.game, board: boardData }, path: '/game', currentPlayerId: msg.currentPlayerId || state.currentPlayerId };
    case 'CHAT_MESSAGE':
      ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', message: msg.message }));
      return state;
    case 'CHAT_MESSAGES_UPDATED':
      return { ...state, chatMessages: msg.messages };
    case 'PLAYER_MOVE':
        ws.send(JSON.stringify({ type: 'PLAYER_MOVE', payload: msg.payload }));
        return state;
    case 'PLAYER_PLACE_BOMB':
      ws.send(JSON.stringify({ type: 'PLAYER_PLACE_BOMB', payload: msg.payload }));
      return state;
    case 'SHOW_EXPLOSION':
        const newBoard = [...state.game.board];
        msg.payload.cells.forEach(cellString => {
            const [y, x] = cellString.split(',').map(Number);
            if(newBoard[y] && newBoard[y][x]) {
                newBoard[y][x].hasExplosion = true;
                newBoard[y][x].isDirty = true;
            }
        });
        setTimeout(() => {
            app.enqueue({ type: 'CLEAR_EXPLOSION', payload: { explosionId: msg.payload.explosionId, cells: msg.payload.cells } });
        }, 500);
        return { ...state, game: { ...state.game, board: newBoard, explosions: [...state.game.explosions, msg.payload] } };
    case 'CLEAR_EXPLOSION':
        const boardAfterExplosion = [...state.game.board];
        msg.payload.cells.forEach(cellString => {
            const [y, x] = cellString.split(',').map(Number);
            if(boardAfterExplosion[y] && boardAfterExplosion[y][x]) {
                boardAfterExplosion[y][x].hasExplosion = false;
                boardAfterExplosion[y][x].isDirty = true;
            }
        });
        return { ...state, game: { ...state.game, board: boardAfterExplosion, explosions: state.game.explosions.filter(exp => exp.explosionId !== msg.payload.explosionId) } };
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
