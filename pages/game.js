import domParser from "../MiniMvc/domParser.js";
import createKeyboardHandler from "../utils/movement.js";

export default (state) => {
  console.log("Game page state:", state);
  const { gameStatus, winner } = state;
  
  // Fix: Use currentPlayerId from state to find the correct player
  const currentPlayer = state.game?.players?.find(p => p.id === state.currentPlayerId);
  const allPlayers = state.game?.players || [];
  
  console.log("Current player ID:", state.currentPlayerId);
  console.log("Current player object:", currentPlayer);
  console.log("All players:", allPlayers);
  const chatMessages = state.chatMessages || [];
  const bombs = state.game?.bombs || [];
  const explosions = state.game?.explosions || [];
  const powerups = state.game?.powerups || [];

  // Create a single set of all explosion cells for efficient lookup
  const explosionCells = new Set();
  explosions.forEach(exp => {
    exp.cells.forEach(cell => explosionCells.add(cell));
  });
  
  const gameBoard = state.game?.board;

  const generateBoardHTML = () => {
    return gameBoard.map((row, rowIndex) => 
      `<div class="board-row" data-row="${rowIndex}">
        ${row.split('').map((cell, colIndex) => {
          let cellClass = 'board-cell ';
          if (cell === 'w') cellClass += 'wall';
          else if (cell === 't') cellClass += 'temp-wall';
          else cellClass += 'path';
          
          // Get all entities at this position
          const playersAtPosition = allPlayers.filter(p => 
            p.active && p.x === colIndex && p.y === rowIndex
          );
          const bombsAtPosition = bombs.filter(b => 
            b.x === colIndex && b.y === rowIndex
          );
          const powerupsAtPosition = powerups.filter(p => 
            p.x === colIndex && p.y === rowIndex
          );
          const isExplosionCell = explosionCells.has(`${rowIndex},${colIndex}`);

          // Generate sprites
          const playerSprites = playersAtPosition.map(player => 
            `<div class="player-sprite player-${player.avatar}" data-direction="${player.direction || 'down'}"></div>`
          ).join('');

          const bombSprites = bombsAtPosition.map(bomb => 
            `<div class="bomb-sprite" data-bomb-id="${bomb.id}"></div>`
          ).join('');

          const explosionSprite = isExplosionCell ? 
            '<div class="explosion-sprite"></div>' : '';

          const powerupSprites = powerupsAtPosition.map(powerup => 
            `<div class="powerup-sprite ${powerup.type}" data-powerup-id="${powerup.id}"></div>`
          ).join('');
          
          return `<div class="${cellClass}" data-row="${rowIndex}" data-col="${colIndex}">
            ${powerupSprites}
            ${explosionSprite}
            ${bombSprites}
            ${playerSprites}
          </div>`;
        }).join('')}
      </div>`
    ).join('');
  };

  const generateHudHTML = () => {
    return allPlayers
      .filter(player => player.nickname)
      .map(player => `
        <div class="player-hud ${!player.active ? 'dead' : ''}">
          <div class="player-avatar-hud player-${player.avatar}"></div>
          <div class="player-info">
            <span class="nickname">${player.nickname}</span>
            <span class="lives">Lives: ${player.lives}</span>
          </div>
        </div>
      `).join('');
  };

  const generateGameOverHTML = () => {
    if (gameStatus !== 'finished') return '';
    const message = winner === 'Draw' ? 'It\'s a Draw!' : `${winner} Wins!`;
    return `
      <div class="game-over-overlay">
        <div class="game-over-card">
          <h1>Game Over</h1>
          <p>${message}</p>
          <button onclick="playAgain">Play Again</button>
        </div>
      </div>
    `;
  };

  const chatMessagesHTML = chatMessages.map(msg => `
    <div class="chat-message">
      <span class="timestamp">${msg.timestamp}</span>
      <span class="nickname">${msg.nickname}:</span>
      <span class="message">${msg.message}</span>
    </div>
  `).join('');

  const htmlString = `
    <section id="game-screen" class="screen" onkeydown="handleKeyDown" tabindex="0" onfocus="focusGame">
        ${generateGameOverHTML()}
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
                        ${generateHudHTML()}
                    </div>
                    <div class="chat-panel">
                        <div id="chat-messages" class="chat-messages">${chatMessagesHTML}</div>
                        <form id="chat-form" class="chat-form" onsubmit="sendChat">
                            <input type="text" id="chat-input" placeholder="Type a message...">
                            <button type="submit">Send</button>
                        </form>
                    </div>
                    <button id="leave-game-btn" onclick="leaveGame">Leave Game</button>
                </div>
            </aside>
            <button id="sidebar-toggle-btn" class="sidebar-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"></path></svg>
            </button>
        </div>
    </section>
  `;

  const keyboardHandler = createKeyboardHandler(currentPlayer, allPlayers, state, gameBoard);

  const handlers = {
    toggleSidebar: (e) => {
      e.preventDefault();
      document.getElementById('sidebar').classList.toggle('open');
    },

    sendChat: (e) => {
      e.preventDefault();
      const input = e.target.closest('.chat-form').querySelector('#chat-input');
      const message = input.value.trim();
      if (!message) return;
      
      input.value = '';
      return { type: 'CHAT_MESSAGE', message };
    },

    focusGame: (e) => {
      e.target.focus();
    },

    handleKeyDown: (e) => {
      return keyboardHandler(e);
    },

    playAgain: (e) => {
      e.preventDefault();
      return { type: 'RESET_GAME' };
    },

    leaveGame: (e) => {
      e.preventDefault();
      return { type: 'LEAVE_GAME' };
    }
  };

  const result = domParser(htmlString, handlers);
  
  setTimeout(() => {
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen && gameStatus !== 'finished') {
        gameScreen.focus();
    }
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }, 100);
  
  return result;
}

