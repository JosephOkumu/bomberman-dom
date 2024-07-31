const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Handle static file serving
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Map file extensions to MIME types
  const ext = path.extname(pathname);
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
  };
  
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Serve files from the current directory
  const filePath = path.join(__dirname, pathname);
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

// Game state
let gameState = {
  players: [],
  waitingRoom: {
    players: [],
    timer: null,
    countdownTimer: null,
    autoStartTime: 20000, // 20 seconds
    countdownTime: 10000, // 10 seconds
    gameStartTime: null
  },
  game: {
    isActive: false,
    board: null,
    bombs: [],
    explosions: [],
    powerUps: [],
    gameTimer: null,
    gameDuration: 180000 // 3 minutes
  }
};

// Player management
class Player {
  constructor(id, nickname, avatar, ws) {
    this.id = id;
    this.nickname = nickname;
    this.avatar = avatar;
    this.ws = ws;
    this.x = 0;
    this.y = 0;
    this.direction = 'down';
    this.lives = 3;
    this.active = true;
    this.bombs = 1;
    this.maxBombs = 1;
    this.explosionRange = 1;
    this.speed = 1;
    this.isConnected = true;
  }
}

// Avatar assignments
const avatars = ['B1', 'B2', 'B3', 'B4'];
let nextAvatarIndex = 0;

// Generate game board
function generateGameBoard() {
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

  // Board randomization function with enhanced spawn protection and connectivity
  const randomizeBoard = (board) => {
    const rows = board.length;
    const cols = board[0].length;
    const maxRetries = 10;
    
    // Define enhanced 3x3 spawn protection zones
    const getProtectedCells = () => {
      const protected = new Set();
      
      // Top-left 3x3 (spawn at 1,1)
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          protected.add(`${r},${c}`);
        }
      }
      
      // Top-right 3x3 (spawn at 1,cols-2)
      for (let r = 1; r <= 3; r++) {
        for (let c = cols-4; c <= cols-2; c++) {
          protected.add(`${r},${c}`);
        }
      }
      
      // Bottom-left 3x3 (spawn at rows-2,1)
      for (let r = rows-4; r <= rows-2; r++) {
        for (let c = 1; c <= 3; c++) {
          protected.add(`${r},${c}`);
        }
      }
      
      // Bottom-right 3x3 (spawn at rows-2,cols-2)
      for (let r = rows-4; r <= rows-2; r++) {
        for (let c = cols-4; c <= cols-2; c++) {
          protected.add(`${r},${c}`);
        }
      }
      
      return protected;
    };
    
    // Flood fill to check connectivity
    const isConnected = (testBoard) => {
      const visited = new Set();
      const queue = [];
      
      // Start from top-left spawn point
      const startRow = 1, startCol = 1;
      if (testBoard[startRow][startCol] !== 'p') return false;
      
      queue.push([startRow, startCol]);
      visited.add(`${startRow},${startCol}`);
      
      const directions = [[0,1], [0,-1], [1,0], [-1,0]];
      
      while (queue.length > 0) {
        const [row, col] = queue.shift();
        
        for (const [dr, dc] of directions) {
          const newRow = row + dr;
          const newCol = col + dc;
          const key = `${newRow},${newCol}`;
          
          if (newRow >= 0 && newRow < rows && 
              newCol >= 0 && newCol < cols &&
              !visited.has(key) && 
              testBoard[newRow][newCol] === 'p') {
            visited.add(key);
            queue.push([newRow, newCol]);
          }
        }
      }
      
      // Check if all spawn points are reachable
      const spawnPoints = [
        [1, 1], [1, cols-2], [rows-2, 1], [rows-2, cols-2]
      ];
      
      return spawnPoints.every(([r, c]) => 
        testBoard[r][c] === 'p' && visited.has(`${r},${c}`)
      );
    };
    
    // Generate valid randomized board
    const protectedCells = getProtectedCells();
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const testBoard = board.map(row => row.split(''));
      
      // Place temporary walls with 65% probability
      for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
          const cellKey = `${row},${col}`;
          
          if (testBoard[row][col] === 'p' && !protectedCells.has(cellKey)) {
            if (Math.random() < 0.65) {
              testBoard[row][col] = 't';
            }
          }
        }
      }
      
      // Verify connectivity
      if (isConnected(testBoard)) {
        return testBoard.map(row => row.join(''));
      }
    }
    
    // Fallback: return board with minimal walls if connectivity fails
    const fallbackBoard = board.map(row => row.split(''));
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const cellKey = `${row},${col}`;
        if (fallbackBoard[row][col] === 'p' && !protectedCells.has(cellKey)) {
          if (Math.random() < 0.3) { // Reduced probability for fallback
            fallbackBoard[row][col] = 't';
          }
        }
      }
    }
    
    return fallbackBoard.map(row => row.join(''));
  };

  return randomizeBoard(boardLines);
}

// Set player starting positions
function setPlayerPositions() {
  const positions = [
    { x: 1, y: 1 },      // Top-left
    { x: 29, y: 1 },     // Top-right
    { x: 1, y: 11 },     // Bottom-left
    { x: 29, y: 11 }     // Bottom-right
  ];

  gameState.players.forEach((player, index) => {
    if (index < positions.length) {
      player.x = positions[index].x;
      player.y = positions[index].y;
    }
  });
}

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Broadcast to all clients except sender
function broadcastToOthers(sender, message) {
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Send to specific client
function sendToClient(client, message) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

// Update waiting room state
function updateWaitingRoom() {
  const waitingRoomState = {
    type: 'WAITING_ROOM_UPDATE',
    players: gameState.waitingRoom.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      isCurrentUser: false // Will be set on client side
    })),
    playerCount: gameState.waitingRoom.players.length,
    autoStartTime: gameState.waitingRoom.autoStartTime,
    countdownTime: gameState.waitingRoom.countdownTime,
    gameStartTime: gameState.waitingRoom.gameStartTime
  };

  broadcast(waitingRoomState);
}

// Start auto-start timer
function startAutoStartTimer() {
  if (gameState.waitingRoom.timer) {
    clearTimeout(gameState.waitingRoom.timer);
  }

  gameState.waitingRoom.timer = setTimeout(() => {
    if (gameState.waitingRoom.players.length >= 2 && !gameState.game.isActive) {
      startCountdown();
    }
  }, gameState.waitingRoom.autoStartTime);
}

// Start countdown
function startCountdown() {
  if (gameState.waitingRoom.countdownTimer) {
    clearTimeout(gameState.waitingRoom.countdownTimer);
  }

  gameState.waitingRoom.gameStartTime = Date.now() + gameState.waitingRoom.countdownTime;
  
  // Send countdown start message
  broadcast({
    type: 'COUNTDOWN_START',
    gameStartTime: gameState.waitingRoom.gameStartTime
  });

  gameState.waitingRoom.countdownTimer = setTimeout(() => {
    startGame();
  }, gameState.waitingRoom.countdownTime);
}

// Start the game
function startGame() {
  gameState.game.isActive = true;
  gameState.game.board = generateGameBoard();
  gameState.players = [...gameState.waitingRoom.players];
  setPlayerPositions();

  // Clear timers
  if (gameState.waitingRoom.timer) {
    clearTimeout(gameState.waitingRoom.timer);
    gameState.waitingRoom.timer = null;
  }
  if (gameState.waitingRoom.countdownTimer) {
    clearTimeout(gameState.waitingRoom.countdownTimer);
    gameState.waitingRoom.countdownTimer = null;
  }

  // Start game timer
  gameState.game.gameTimer = setTimeout(() => {
    endGame();
  }, gameState.game.gameDuration);

  // Send game start message
  broadcast({
    type: 'GAME_START',
    board: gameState.game.board,
    players: gameState.players,
    gameDuration: gameState.game.gameDuration
  });
}

// End the game
function endGame() {
  gameState.game.isActive = false;
  gameState.waitingRoom.players = [];
  gameState.players = [];
  gameState.game.board = null;
  gameState.game.bombs = [];
  gameState.game.explosions = [];
  gameState.game.powerUps = [];

  if (gameState.game.gameTimer) {
    clearTimeout(gameState.game.gameTimer);
    gameState.game.gameTimer = null;
  }

  broadcast({
    type: 'GAME_END',
    message: 'Game ended!'
  });
}

// Handle player movement
function handlePlayerMove(playerId, x, y, direction) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.active) return;

  // Validate movement (basic collision detection)
  if (x >= 0 && x < 31 && y >= 0 && y < 13) {
    const cell = gameState.game.board[y][x];
    if (cell === 'p') {
      // Check if another player is at this position
      const playerAtPosition = gameState.players.find(p => 
        p.active && p.id !== playerId && p.x === x && p.y === y
      );

      if (!playerAtPosition) {
        player.x = x;
        player.y = y;
        player.direction = direction;

        // Broadcast movement to all clients
        broadcast({
          type: 'PLAYER_MOVE',
          playerId: playerId,
          x: x,
          y: y,
          direction: direction
        });
      }
    }
  }
}

// Handle bomb placement
function handleBombPlace(playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || !player.active) return;

  // Check if player can place a bomb
  const activeBombs = gameState.game.bombs.filter(bomb => bomb.playerId === playerId);
  if (activeBombs.length >= player.maxBombs) return;

  // Check if there's already a bomb at this position
  const bombAtPosition = gameState.game.bombs.find(bomb => 
    bomb.x === player.x && bomb.y === player.y
  );
  if (bombAtPosition) return;

  // Place bomb
  const bomb = {
    id: Date.now() + Math.random(),
    playerId: playerId,
    x: player.x,
    y: player.y,
    range: player.explosionRange,
    placedAt: Date.now()
  };

  gameState.game.bombs.push(bomb);

  // Broadcast bomb placement
  broadcast({
    type: 'BOMB_PLACED',
    bomb: bomb
  });

  // Explode bomb after 3 seconds
  setTimeout(() => {
    explodeBomb(bomb.id);
  }, 3000);
}

// Handle bomb explosion
function explodeBomb(bombId) {
  const bomb = gameState.game.bombs.find(b => b.id === bombId);
  if (!bomb) return;

  // Remove bomb
  gameState.game.bombs = gameState.game.bombs.filter(b => b.id !== bombId);

  // Create explosion
  const explosion = {
    id: Date.now() + Math.random(),
    x: bomb.x,
    y: bomb.y,
    range: bomb.range,
    createdAt: Date.now()
  };

  gameState.game.explosions.push(explosion);

  // Check for player hits
  const affectedPlayers = gameState.players.filter(player => {
    const distance = Math.abs(player.x - bomb.x) + Math.abs(player.y - bomb.y);
    return distance <= bomb.range && player.active;
  });

  affectedPlayers.forEach(player => {
    player.lives--;
    if (player.lives <= 0) {
      player.active = false;
    }
  });

  // Check for block destruction
  const directions = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
  const destroyedBlocks = [];

  directions.forEach(([dx, dy]) => {
    for (let i = 0; i <= bomb.range; i++) {
      const x = bomb.x + dx * i;
      const y = bomb.y + dy * i;

      if (x < 0 || x >= 31 || y < 0 || y >= 13) break;

      const cell = gameState.game.board[y][x];
      if (cell === 'w') break; // Solid wall, stop explosion
      if (cell === 't') {
        // Destroy temporary wall
        const newBoard = gameState.game.board.map(row => row.split(''));
        newBoard[y][x] = 'p';
        gameState.game.board = newBoard.map(row => row.join(''));

        destroyedBlocks.push({ x, y });

        // Randomly spawn power-up (30% chance)
        if (Math.random() < 0.3) {
          const powerUpTypes = ['bomb', 'flame', 'speed'];
          const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          
          const powerUp = {
            id: Date.now() + Math.random(),
            x: x,
            y: y,
            type: powerUpType
          };

          gameState.game.powerUps.push(powerUp);
        }
        break;
      }
    }
  });

  // Broadcast explosion
  broadcast({
    type: 'BOMB_EXPLODED',
    explosion: explosion,
    affectedPlayers: affectedPlayers.map(p => ({ id: p.id, lives: p.lives, active: p.active })),
    destroyedBlocks: destroyedBlocks,
    newPowerUps: gameState.game.powerUps.filter(p => 
      destroyedBlocks.some(block => block.x === p.x && block.y === p.y)
    )
  });

  // Remove explosion after 1 second
  setTimeout(() => {
    gameState.game.explosions = gameState.game.explosions.filter(e => e.id !== explosion.id);
    broadcast({
      type: 'EXPLOSION_CLEARED',
      explosionId: explosion.id
    });
  }, 1000);

  // Check for game end
  const activePlayers = gameState.players.filter(p => p.active);
  if (activePlayers.length <= 1) {
    setTimeout(() => {
      endGame();
    }, 2000);
  }
}

// Handle power-up collection
function handlePowerUpCollection(playerId, powerUpId) {
  const player = gameState.players.find(p => p.id === playerId);
  const powerUp = gameState.game.powerUps.find(p => p.id === powerUpId);

  if (!player || !player.active || !powerUp) return;

  // Check if player is at power-up position
  if (player.x === powerUp.x && player.y === powerUp.y) {
    // Apply power-up effect
    switch (powerUp.type) {
      case 'bomb':
        player.maxBombs++;
        break;
      case 'flame':
        player.explosionRange++;
        break;
      case 'speed':
        player.speed = Math.min(player.speed + 0.2, 2.0);
        break;
    }

    // Remove power-up
    gameState.game.powerUps = gameState.game.powerUps.filter(p => p.id !== powerUpId);

    // Broadcast power-up collection
    broadcast({
      type: 'POWERUP_COLLECTED',
      playerId: playerId,
      powerUpId: powerUpId,
      powerUpType: powerUp.type,
      playerStats: {
        maxBombs: player.maxBombs,
        explosionRange: player.explosionRange,
        speed: player.speed
      }
    });
  }
}

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const parameters = url.parse(req.url, true);
  const nickname = parameters.query.nickname;

  if (!nickname) {
    sendToClient(ws, { type: 'ERROR', message: 'Nickname required' });
    ws.close();
    return;
  }

  // Check if nickname is already taken
  const existingPlayer = gameState.waitingRoom.players.find(p => p.nickname === nickname);
  if (existingPlayer) {
    sendToClient(ws, { type: 'ERROR', message: 'Nickname already taken' });
    ws.close();
    return;
  }

  // Create new player
  const playerId = Date.now() + Math.random();
  const avatar = avatars[nextAvatarIndex % avatars.length];
  nextAvatarIndex++;

  const player = new Player(playerId, nickname, avatar, ws);
  gameState.waitingRoom.players.push(player);

  // Send welcome message
  sendToClient(ws, {
    type: 'WELCOME',
    playerId: playerId,
    nickname: nickname,
    avatar: avatar
  });

  // Update waiting room for all clients
  updateWaitingRoom();

  // Start auto-start timer if this is the first player
  if (gameState.waitingRoom.players.length === 1) {
    startAutoStartTimer();
  }

  // Check if we should start countdown immediately (4 players)
  if (gameState.waitingRoom.players.length === 4) {
    if (gameState.waitingRoom.timer) {
      clearTimeout(gameState.waitingRoom.timer);
      gameState.waitingRoom.timer = null;
    }
    startCountdown();
  }

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'PLAYER_MOVE':
          handlePlayerMove(data.playerId, data.x, data.y, data.direction);
          break;
        
        case 'PLACE_BOMB':
          handleBombPlace(data.playerId);
          break;
        
        case 'COLLECT_POWERUP':
          handlePowerUpCollection(data.playerId, data.powerUpId);
          break;
        
        case 'CHAT_MESSAGE':
          // Broadcast chat message to all clients
          broadcast({
            type: 'CHAT_MESSAGE',
            playerId: data.playerId,
            nickname: data.nickname,
            message: data.message,
            timestamp: Date.now()
          });
          break;
        
        case 'MANUAL_START':
          if (gameState.waitingRoom.players.length >= 2 && !gameState.game.isActive) {
            startCountdown();
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    // Remove player from waiting room
    gameState.waitingRoom.players = gameState.waitingRoom.players.filter(p => p.id !== playerId);
    
    // Remove player from active game
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    
    // Update waiting room
    updateWaitingRoom();
    
    // Check if game should end (not enough players)
    if (gameState.game.isActive && gameState.players.filter(p => p.active).length < 2) {
      endGame();
    }
    
    // Reset auto-start timer if no players left
    if (gameState.waitingRoom.players.length === 0) {
      if (gameState.waitingRoom.timer) {
        clearTimeout(gameState.waitingRoom.timer);
        gameState.waitingRoom.timer = null;
      }
      if (gameState.waitingRoom.countdownTimer) {
        clearTimeout(gameState.waitingRoom.countdownTimer);
        gameState.waitingRoom.countdownTimer = null;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Bomberman server running on port ${PORT}`);
});
