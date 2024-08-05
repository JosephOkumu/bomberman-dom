import domParser from "../MiniMvc/domParser.js";
import createKeyboardHandler from "../utils/movement.js";

export default (state) => {
  // Get current player and game state
  const currentPlayer = state.game?.players?.find(p => p.id === state.playerId) || state.game?.players?.[0];
  const allPlayers = state.game?.players || [];
  const gameBoard = state.game?.board;
  const bombs = state.game?.bombs || [];
  const explosions = state.game?.explosions || [];
  const powerUps = state.game?.powerUps || [];
  const chatMessages = state.chatMessages || [];
  
  // Use server-provided board or fallback
  if (!gameBoard) {
    // Fallback board if server hasn't provided one yet
    gameBoard = `
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
            `<div class="player-sprite player-${player.avatar.toLowerCase()}" data-direction="${player.direction}"></div>`
          ).join('');
          
          // Add bombs
          const bombAtPosition = bombs.find(bomb => bomb.x === colIndex && bomb.y === rowIndex);
          const bombSprite = bombAtPosition ? '<div class="bomb-sprite"></div>' : '';
          
          // Add explosions
          const explosionAtPosition = explosions.find(exp => exp.x === colIndex && exp.y === rowIndex);
          const explosionSprite = explosionAtPosition ? '<div class="explosion-sprite"></div>' : '';
          
          // Add power-ups
          const powerUpAtPosition = powerUps.find(powerUp => powerUp.x === colIndex && powerUp.y === rowIndex);
          const powerUpSprite = powerUpAtPosition ? `<div class="powerup-sprite powerup-${powerUpAtPosition.type}"></div>` : '';
          
          return `<div class="${cellClass}" data-row="${rowIndex}" data-col="${colIndex}">
            ${playerSprites}
            ${bombSprite}
            ${explosionSprite}
            ${powerUpSprite}
          </div>`;
        }).join('')}
      </div>`
    ).join('');
  };

  // Generate player HUD HTML
  const generatePlayerHUD = () => {
    return allPlayers.map(player => `
      <div class="player-hud ${!player.active ? 'dead' : ''}">
        <div class="player-hud-name">${player.nickname}</div>
        <div class="player-hud-stats">
          <span>❤️ ${player.lives}</span>
          <span>💣 ${player.maxBombs}</span>
          <span>🔥 ${player.explosionRange}</span>
        </div>
      </div>
    `).join('');
  };

  // Generate chat messages HTML
  const generateChatMessages = () => {
    return chatMessages.map(msg => `
      <p><strong>${msg.nickname}:</strong> ${msg.message}</p>
    `).join('');
  };

  // Calculate game timer
  const gameStartTime = state.gameStartTime || Date.now();
  const gameDuration = state.game?.gameDuration || 180000;
  const timeLeft = Math.max(0, Math.floor((gameStartTime + gameDuration - Date.now()) / 1000));
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const htmlString = `
    <section id="game-screen" class="screen" onkeydown="handleKeyDown" tabindex="0" onfocus="focusGame">
        <div class="game-layout">
            <div class="game-area">
                            <div id="game-overlay" class="game-overlay">
                <span id="game-timer-display">${timerDisplay}</span>
            </div>
                <div id="game-board" class="game-board">
                    ${generateBoardHTML()}
                </div>
                <canvas id="game-canvas" style="display: none;"></canvas>
            </div>
            <aside id="sidebar">
                <div class="sidebar-content">
                    <div id="hud-container" class="hud">
                        ${generatePlayerHUD()}
                    </div>
                    <div class="chat-panel">
                        <div id="chat-messages" class="chat-messages">
                            ${generateChatMessages()}
                        </div>
                        <form id="chat-form" class="chat-form" onsubmit="sendChat">
                            <input type="text" id="chat-input" placeholder="Type a message...">
                            <button type="submit">Send</button>
                        </form>
                    </div>
                    <button id="leave-game-btn" onclick="leaveGame">Leave Game</button>
                </div>
            </aside>
            <button id="sidebar-toggle-btn" class="sidebar-toggle" onclick="toggleSidebar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            </button>
        </div>
    </section>
  `;

  // Create the keyboard handler using the imported function
  const keyboardHandler = createKeyboardHandler(currentPlayer, allPlayers, state, gameBoard);

  const handlers = {
    toggleSidebar: (e) => {
      e.preventDefault();
      document.getElementById('sidebar').classList.toggle('open');
    },

    sendChat: (e) => {
      e.preventDefault();
      const message = e.target.closest('.chat-form').querySelector('#chat-input').value.trim();
      if (!message) return;
      
      if (window.wsClient && window.wsClient.isConnected) {
        window.wsClient.sendChatMessage(message);
      }
      
      // Clear input
      e.target.closest('.chat-form').querySelector('#chat-input').value = '';
    },

    leaveGame: (e) => {
      e.preventDefault();
      if (window.wsClient) {
        window.wsClient.disconnect();
      }
      const path = "/";
      window.history.pushState({}, "", path);
      return { type: "ROUTE_CHANGE", path };
    },

    focusGame: (e) => {
      // Auto-focus the game screen when it loads
      e.target.focus();
    },

    handleKeyDown: (e) => {
      // Handle bomb placement
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (window.wsClient && window.wsClient.isConnected) {
          window.wsClient.sendPlaceBomb();
        }
        return null;
      }
      
      return keyboardHandler(e);
    }
  };

  const result = domParser(htmlString, handlers);
  
  // Set up game timer updates if this is the first render
  if (!window.gameTimerInterval) {
    window.gameTimerInterval = setInterval(() => {
      // Force a re-render to update game timer
      if (window.app && window.app.enqueue) {
        window.app.enqueue({ type: "TIMER_UPDATE" });
      }
    }, 1000);
  }

  // Clean up waiting room timer if it exists
  if (window.waitingRoomTimerInterval) {
    clearInterval(window.waitingRoomTimerInterval);
    window.waitingRoomTimerInterval = null;
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