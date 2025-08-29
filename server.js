const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let bombIdCounter = 0;
let powerupIdCounter = 0;

let gameState = {
  gameStatus: 'waiting', // waiting, starting, in-progress, finished
  availableAvatars: ['B1', 'B2', 'B3', 'B4'],
  waitingPlayers: [],
  chatMessages: [],
  timers: {
    minPlayersTimer: { id: null, remaining: 20 },
    gameStartTimer: { id: null, remaining: 10 }
  },
  game: {
    board: null,
    players: [
      { id: 1, x: 1, y: 1, direction: 'down', lives: 3, active: false, avatar: 'B1', maxBombs: 1, bombRange: 1, speed: 1 },
      { id: 2, x: 29, y: 1, direction: 'down', lives: 3, active: false, avatar: 'B2', maxBombs: 1, bombRange: 1, speed: 1 },
      { id: 3, x: 1, y: 11, direction: 'down', lives: 3, active: false, avatar: 'B3', maxBombs: 1, bombRange: 1, speed: 1 },
      { id: 4, x: 29, y: 11, direction: 'down', lives: 3, active: false, avatar: 'B4', maxBombs: 1, bombRange: 1, speed: 1 }
    ],
    bombs: [],
    explosions: [],
    powerups: []
  }
};

let minPlayersTimer = null;
let gameStartTimer = null;

function generateBoard() {
  const boardLines = `
   wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
   wpppppppppppppppppppppppppppppw
   wpwpwpwpwpwpwpwpwpwpwpwpwpwpwpw
   wpppppppppppppppppppppppppppppw
   wpwpwpwpwpwpwpwpwpwpwpwpwpwpwpw
   wpppppppppppppppppppppppppppppw
   wpwpwpwpwpwpwpwpwpwpwpwpwpwpwpw
   wpppppppppppppppppppppppppppppw
   wpwpwpwpwpwpwpwpwpwpwpwpwpwpwpw
   wpppppppppppppppppppppppppppppw
   wpwpwpwpwpwpwpwpwpwpwpwpwpwpwpw
   wpppppppppppppppppppppppppppppw
   wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
  `.trim().split('\n').map(line => line.trim());

  const randomizeBoard = (board) => {
    const rows = board.length;
    const cols = board[0].length;
    const maxRetries = 10;
    
    const getprtectedCells = () => {
      const prtected = new Set();
      for (let r = 1; r <= 3; r++) for (let c = 1; c <= 3; c++) prtected.add(`${r},${c}`);
      for (let r = 1; r <= 3; r++) for (let c = cols-4; c <= cols-2; c++) prtected.add(`${r},${c}`);
      for (let r = rows-4; r <= rows-2; r++) for (let c = 1; c <= 3; c++) prtected.add(`${r},${c}`);
      for (let r = rows-4; r <= rows-2; r++) for (let c = cols-4; c <= cols-2; c++) prtected.add(`${r},${c}`);
      return prtected;
    };
    
    const isConnected = (testBoard) => {
      const visited = new Set();
      const queue = [];
      const startRow = 1, startCol = 1;
      if (testBoard[startRow][startCol] !== 'p') return false;
      queue.push([startRow, startCol]);
      visited.add(`${startRow},${startCol}`);
      const directions = [[0,1], [0,-1], [1,0], [-1,0]];
      while (queue.length > 0) {
        const [row, col] = queue.shift();
        for (const [dr, dc] of directions) {
          const newRow = row + dr, newCol = col + dc, key = `${newRow},${newCol}`;
          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && !visited.has(key) && testBoard[newRow][newCol] === 'p') {
            visited.add(key);
            queue.push([newRow, newCol]);
          }
        }
      }
      const spawnPoints = [[1, 1], [1, cols-2], [rows-2, 1], [rows-2, cols-2]];
      return spawnPoints.every(([r, c]) => testBoard[r][c] === 'p' && visited.has(`${r},${c}`));
    };
    
    const prtectedCells = getprtectedCells();
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const testBoard = board.map(row => row.split(''));
      for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
          const cellKey = `${row},${col}`;
          if (testBoard[row][col] === 'p' && !prtectedCells.has(cellKey)) {
            if (Math.random() < 0.65) testBoard[row][col] = 't';
          }
        }
      }
      if (isConnected(testBoard)) return testBoard.map(row => row.join(''));
    }
    
    const fallbackBoard = board.map(row => row.split(''));
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const cellKey = `${row},${col}`;
        if (fallbackBoard[row][col] === 'p' && !prtectedCells.has(cellKey)) {
          if (Math.random() < 0.3) fallbackBoard[row][col] = 't';
        }
      }
    }
    return fallbackBoard.map(row => row.join(''));
  };

  return randomizeBoard(boardLines);
}


function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function sanitize(str) {
  return str.replace(/[&<>"'\/]/g, function (s) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    }[s];
  });
}

function resetGameState() {
  gameState.gameStatus = 'waiting';
  gameState.game.board = null;
  gameState.game.players.forEach(p => {
    p.active = false;
    p.lives = 3;
    p.maxBombs = 1;
    p.bombRange = 1;
    p.speed = 1;
  });
  gameState.game.bombs = [];
  gameState.game.explosions = [];
  gameState.game.powerups = [];
  gameState.chatMessages = [];
  gameState.waitingPlayers = [];
  gameState.availableAvatars = ['B1', 'B2', 'B3', 'B4'];
}

function checkGameOver() {
  const activePlayers = gameState.game.players.filter(p => p.active && p.nickname);
  if (activePlayers.length <= 1) {
    gameState.gameStatus = 'finished';
    const winner = activePlayers.length === 1 ? activePlayers[0] : null;
    broadcast({ type: 'GAME_OVER', payload: { winner: winner ? winner.nickname : 'Draw' } });
  }
}

function explodeBomb(bombId) {
  const bombIndex = gameState.game.bombs.findIndex(b => b.id === bombId);
  if (bombIndex === -1) return;

  const bomb = gameState.game.bombs[bombIndex];
  const owner = gameState.game.players.find(p => p.id === bomb.ownerId);
  const range = owner ? owner.bombRange : 1;

  const explosion = { id: bomb.id, cells: new Set([`${bomb.y},${bomb.x}`]) };
  const board = gameState.game.board.map(row => row.split(''));

  gameState.game.bombs.splice(bombIndex, 1);

  const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

  for (const dir of directions) {
    for (let i = 1; i <= range; i++) {
      const x = bomb.x + dir.x * i;
      const y = bomb.y + dir.y * i;

      if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) break;

      const cell = board[y][x];

      if (cell === 'w') {
        break;
      }
      
      explosion.cells.add(`${y},${x}`);

      if (cell === 't') {
        board[y][x] = 'p';
        if (Math.random() < 0.3) {
          const powerupTypes = ['bomb', 'flame', 'speed'];
          const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
          gameState.game.powerups.push({ id: powerupIdCounter++, x, y, type });
        }
        break;
      }
    }
  }

  gameState.game.players.forEach(player => {
    if (player.active && explosion.cells.has(`${player.y},${player.x}`)) {
      player.lives--;
      if (player.lives <= 0) {
        player.active = false;
      }
    }
  });

  gameState.game.board = board.map(row => row.join(''));
  gameState.game.explosions.push(explosion);

  broadcast({ type: 'EXPLOSION', payload: { explosionId: explosion.id, cells: Array.from(explosion.cells) } });

  setTimeout(() => {
    gameState.game.explosions = gameState.game.explosions.filter(exp => exp.id !== explosion.id);
    broadcast({ type: 'UPDATE_STATE', state: gameState });
    checkGameOver();
  }, 500);
}

function startGameCountdown() {
  clearInterval(minPlayersTimer);
  minPlayersTimer = null;
  gameState.timers.minPlayersTimer.remaining = 20;

  if (gameState.gameStatus === 'starting') return;

  gameState.gameStatus = 'starting';
  let countdown = 10;
  gameState.timers.gameStartTimer.remaining = countdown;
  broadcast({ type: 'UPDATE_STATE', state: gameState });

  gameStartTimer = setInterval(() => {
    countdown--;
    gameState.timers.gameStartTimer.remaining = countdown;
    broadcast({ type: 'UPDATE_STATE', state: gameState });

    if (countdown === 0) {
      clearInterval(gameStartTimer);
      gameStartTimer = null;
      gameState.gameStatus = 'in-progress';
      gameState.game.board = generateBoard();

      // Fix: Properly map waiting players to game players
      gameState.waitingPlayers.forEach((waitingPlayer, index) => {
        if (index < gameState.game.players.length) {
          const gamePlayer = gameState.game.players[index];
          gamePlayer.id = waitingPlayer.id; // Use the waiting player's unique ID
          gamePlayer.nickname = waitingPlayer.nickname;
          gamePlayer.active = true;
          gamePlayer.avatar = waitingPlayer.avatar; // Make sure avatar is set
          
          const spawnPositions = [[1, 1], [29, 1], [1, 11], [29, 11]];
          if (spawnPositions[index]) {
            gamePlayer.x = spawnPositions[index][0];
            gamePlayer.y = spawnPositions[index][1];
          }
        }
      });

      // Send each client their specific player data
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          const playerData = gameState.game.players.find(p => p.id === client.clientId);
          client.send(JSON.stringify({
            type: 'GAME_START',
            state: gameState,
            currentPlayerId: client.clientId
          }));
        }
      });
      
      console.log('Game started with players:', gameState.game.players);
    }
  }, 1000);
}

function checkGameStart() {
  const playerCount = gameState.waitingPlayers.length;

  if (playerCount >= 4) {
    startGameCountdown();
  } else if (playerCount >= 2) {
    if (!minPlayersTimer && gameState.gameStatus === 'waiting') {
      let countdown = 20;
      gameState.timers.minPlayersTimer.remaining = countdown;
      broadcast({ type: 'UPDATE_STATE', state: gameState });

      minPlayersTimer = setInterval(() => {
        countdown--;
        gameState.timers.minPlayersTimer.remaining = countdown;
        broadcast({ type: 'UPDATE_STATE', state: gameState });
        if (countdown === 0) {
          clearInterval(minPlayersTimer);
          minPlayersTimer = null;
          startGameCountdown();
        }
      }, 1000);
    }
  } else {
    clearInterval(minPlayersTimer);
    minPlayersTimer = null;
    clearInterval(gameStartTimer);
    gameStartTimer = null;
    gameState.gameStatus = 'waiting';
    gameState.timers.minPlayersTimer.remaining = 20;
    gameState.timers.gameStartTimer.remaining = 10;
    broadcast({ type: 'UPDATE_STATE', state: gameState });
  }
}

wss.on('connection', ws => {
  console.log('Client connected');
  // Generate a more unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  ws.clientId = clientId; // Store on the websocket object
  
  ws.on('message', message => {
    const msg = JSON.parse(message);

    switch (msg.type) {
      case 'JOIN_AND_NAVIGATE':
        if (gameState.availableAvatars.length > 0 && gameState.waitingPlayers.length < 4) {
          const newPlayer = {
            id: clientId, // Use the unique client ID
            nickname: msg.nickname,
            avatar: gameState.availableAvatars[0]
          };
          gameState.waitingPlayers.push(newPlayer);
          gameState.availableAvatars.shift();

          // Send the player their own ID
          ws.send(JSON.stringify({
            type: 'SET_PLAYER_ID',
            playerId: clientId
          }));
          
          broadcast({ type: 'UPDATE_STATE', state: gameState });
          checkGameStart();
        }
        break;
      case 'CHAT_MESSAGE':
        const player = gameState.waitingPlayers.find(p => p.id === clientId);
        if (player) {
          const chatMessage = {
            nickname: player.nickname,
            message: sanitize(msg.message),
            timestamp: new Date().toLocaleTimeString()
          };
          gameState.chatMessages.push(chatMessage);
          broadcast({ type: 'NEW_CHAT_MESSAGE', messages: gameState.chatMessages });
        }
        break;
      
      case 'PLAYER_MOVE':
        const { playerId, x, y, direction } = msg.payload;
        
        // Verify the client is trying to move their own player
        if (playerId !== clientId) {
          console.log(`Client ${clientId} tried to move player ${playerId} - rejected`);
          return;
        }
        
        const gamePlayer = gameState.game.players.find(p => p.id === playerId);
        const board = gameState.game.board;

        if (gamePlayer && board && gamePlayer.active) {
          if (y >= 0 && y < board.length && x >= 0 && x < board[0].length && board[y][x] === 'p') {
            gamePlayer.x = x;
            gamePlayer.y = y;
            gamePlayer.direction = direction;

            // Handle powerup collection
            const powerupIndex = gameState.game.powerups.findIndex(p => p.x === x && p.y === y);
            if (powerupIndex !== -1) {
              const powerup = gameState.game.powerups[powerupIndex];
              if (powerup.type === 'bomb') gamePlayer.maxBombs++;
              if (powerup.type === 'flame') gamePlayer.bombRange++;
              if (powerup.type === 'speed') gamePlayer.speed++;
              gameState.game.powerups.splice(powerupIndex, 1);
            }

            broadcast({ type: 'UPDATE_STATE', state: gameState });
          }
        }
        break;
      case 'PLAYER_PLACE_BOMB':
        const placingPlayer = gameState.game.players.find(p => p.id === msg.payload.playerId);
        const activeBombs = gameState.game.bombs.filter(b => b.ownerId === placingPlayer.id).length;

        if (placingPlayer && placingPlayer.active && activeBombs < placingPlayer.maxBombs) {
          const newBomb = {
            id: bombIdCounter++,
            ownerId: placingPlayer.id,
            x: placingPlayer.x,
            y: placingPlayer.y,
          };
          gameState.game.bombs.push(newBomb);
          setTimeout(() => explodeBomb(newBomb.id), 3000);
          broadcast({ type: 'UPDATE_STATE', state: gameState });
        }
        break;
      case 'RESET_GAME':
        resetGameState();
        broadcast({ type: 'UPDATE_STATE', state: gameState });
        break;
      case 'LEAVE_GAME':
        resetGameState();
        broadcast({ type: 'UPDATE_STATE', state: gameState });
        break;
      case 'LEAVE_WAITING_ROOM':
        const disconnectedPlayer = gameState.waitingPlayers.find(player => player.id === clientId);
        if (disconnectedPlayer) {
          gameState.availableAvatars.push(disconnectedPlayer.avatar);
          gameState.waitingPlayers = gameState.waitingPlayers.filter(player => player.id !== disconnectedPlayer.id);

          broadcast({ type: 'UPDATE_STATE', state: gameState });
          checkGameStart();
        }
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');

    if (gameState.gameStatus === 'in-progress') {
      const disconnectedPlayer = gameState.game.players.find(player => player.id === clientId);
      if (disconnectedPlayer) {
        disconnectedPlayer.active = false;
        broadcast({ type: 'UPDATE_STATE', state: gameState });
        checkGameOver();
      }
    } else {
      const disconnectedPlayer = gameState.waitingPlayers.find(player => player.id === clientId);
      if (disconnectedPlayer) {
        gameState.availableAvatars.push(disconnectedPlayer.avatar);
        gameState.waitingPlayers = gameState.waitingPlayers.filter(player => player.id !== disconnectedPlayer.id);

        broadcast({ type: 'UPDATE_STATE', state: gameState });
        checkGameStart();
      }
    }
  });
});

console.log('WebSocket server started on port 8080');
