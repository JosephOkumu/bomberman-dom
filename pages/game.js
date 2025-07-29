import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  // Get current player and game state
  const currentPlayer = state.game?.players?.find(p => p.id === state.game?.currentPlayer) || state.game?.players?.[0];
  const allPlayers = state.game?.players || [];
  
  // Use existing board or create new one
  let gameBoard;
  if (state.game?.board) {
    gameBoard = state.game.board;
  } else {
    // Convert board string to 2D array - this should only happen once!
    const boardLines = state.board || `
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
    const getprtectedCells = () => {
      const prtected = new Set();
      
      // Top-left 3x3 (spawn at 1,1)
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) {
          prtected.add(`${r},${c}`);
        }
      }
      
      // Top-right 3x3 (spawn at 1,cols-2)
      for (let r = 1; r <= 3; r++) {
        for (let c = cols-4; c <= cols-2; c++) {
          prtected.add(`${r},${c}`);
        }
      }
      
      // Bottom-left 3x3 (spawn at rows-2,1)
      for (let r = rows-4; r <= rows-2; r++) {
        for (let c = 1; c <= 3; c++) {
          prtected.add(`${r},${c}`);
        }
      }
      
      // Bottom-right 3x3 (spawn at rows-2,cols-2)
      for (let r = rows-4; r <= rows-2; r++) {
        for (let c = cols-4; c <= cols-2; c++) {
          prtected.add(`${r},${c}`);
        }
      }
      
      return prtected;
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
    const prtectedCells = getprtectedCells();
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const testBoard = board.map(row => row.split(''));
      
      // Place temporary walls with 65% probability
      for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
          const cellKey = `${row},${col}`;
          
          if (testBoard[row][col] === 'p' && !prtectedCells.has(cellKey)) {
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
        if (fallbackBoard[row][col] === 'p' && !prtectedCells.has(cellKey)) {
          if (Math.random() < 0.3) { // Reduced probability for fallback
            fallbackBoard[row][col] = 't';
          }
        }
      }
    }
    
    return fallbackBoard.map(row => row.join(''));
  };

    // Apply randomization to board - this should only happen once!
    gameBoard = randomizeBoard(boardLines);
  }

  // Generate board HTML
  const generateBoardHTML = () => {
    return gameBoard.map((row, rowIndex) => 
      `<div class="board-row" data-row="${rowIndex}">
        ${row.split('').map((cell, colIndex) => {
          let cellClass = 'board-cell ';
          if (cell === 'w') cellClass += 'wall';
          else if (cell === 't') cellClass += 'temp-wall';
          else cellClass += 'path';
          
          // Add player sprites at their positions
          const playersAtPosition = allPlayers.filter(p => p.active && p.x === colIndex && p.y === rowIndex);
          const playerSprites = playersAtPosition.map(player => 
            `<div class="player-sprite player-${player.id}" data-direction="${player.direction}"></div>`
          ).join('');
          
          return `<div class="${cellClass}" data-row="${rowIndex}" data-col="${colIndex}">
            ${playerSprites}
          </div>`;
        }).join('')}
      </div>`
    ).join('');
  };

  const htmlString = `
    <section id="game-screen" class="screen" onkeydown="handleKeyDown" tabindex="0" onfocus="focusGame">
        <div class="game-layout">
            <div class="game-area">
                <div id="game-overlay" class="game-overlay">
                    <span id="game-timer-display">3:00</span>
                </div>
                <div id="game-board" class="game-board">
                    ${generateBoardHTML()}
                </div>
                <canvas id="game-canvas" style="display: none;"></canvas>
            </div>
            <aside id="sidebar">
                <div class="sidebar-content">
                    <div id="hud-container" class="hud">
                        <!-- Player HUDs will be dynamically inserted here -->
                    </div>
                    <div class="chat-panel">
                        <div id="chat-messages" class="chat-messages"></div>
                        <form id="chat-form" class="chat-form">
                            <input type="text" id="chat-input" placeholder="Type a message...">
                            <button type="submit">Send</button>
                        </form>
                    </div>
                    <button id="leave-game-btn">Leave Game</button>
                </div>
            </aside>
            <button id="sidebar-toggle-btn" class="sidebar-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            </button>
        </div>
    </section>
  `;

  const handlers = {
    toggleSidebar: (e) => {
      e.preventDefault();
      document.getElementById('sidebar').classList.toggle('open');
    },

    sendChat: (e) => {
      e.preventDefault();
      const message = e.target.closest('.chat-form').querySelector('#chat-input').value.trim();
      if (!message) return;
      // TODO: Send chat message to server
    },

    focusGame: (e) => {
      // Auto-focus the game screen when it loads
      e.target.focus();
    },

    handleKeyDown: (e) => {
      // Don't handle keys if typing in input fields
      if (e.target.tagName === 'INPUT') return;
      
      if (!currentPlayer || !currentPlayer.active) return;
      
      let newX = currentPlayer.x;
      let newY = currentPlayer.y;
      let direction = currentPlayer.direction;
      
      // Handle movement keys
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          newY = currentPlayer.y - 1;
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          newY = currentPlayer.y + 1;
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          newX = currentPlayer.x - 1;
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          newX = currentPlayer.x + 1;
          direction = 'right';
          break;
        default:
          return; // Don't prevent default for other keys
      }
      
      e.preventDefault();
      
      // Validate movement bounds and collision
      if (newY >= 0 && newY < gameBoard.length && 
          newX >= 0 && newX < gameBoard[0].length) {
        const targetCell = gameBoard[newY][newX];
        
        // Check if target cell is walkable (path only)
        if (targetCell === 'p') {
          // Check if another player is already at this position
          const playerAtPosition = allPlayers.find(p => 
            p.active && p.id !== currentPlayer.id && p.x === newX && p.y === newY
          );
          
          if (!playerAtPosition) {
            return {
              type: "MOVE_PLAYER",
              playerId: currentPlayer.id,
              x: newX,
              y: newY,
              direction: direction
            };
          }
        }
      }
      
      // If movement is blocked, just update direction
      if (direction !== currentPlayer.direction) {
        return {
          type: "MOVE_PLAYER",
          playerId: currentPlayer.id,
          x: currentPlayer.x,
          y: currentPlayer.y,
          direction: direction
        };
      }
    }
  };

  const result = domParser(htmlString, handlers);
  
  // If we just generated a new board, store it in state immediately
  if (!state.game?.board && gameBoard) {
    // Store the board in state synchronously using the enqueue function
    setTimeout(() => {
      const gameScreen = document.getElementById('game-screen');
      if (gameScreen && gameScreen._ui && gameScreen._ui.enqueue) {
        gameScreen._ui.enqueue({ type: "INIT_GAME_BOARD", board: gameBoard });
      }
    }, 0);
  }
  
  // Auto-focus the game screen after it renders
  setTimeout(() => {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
      gameScreen.focus();
    }
  }, 100);
  
  return result;
}
