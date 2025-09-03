import domParser from "../MiniMvc/domParser.js";
import { initMovement } from "../utils/smoothMovement.js";

const gamePage = () => {
  let isInitialRender = true;
  let cachedResult = null;
  let cleanupMovement = null;

  const generateCellHTML = (cell) => {
    let cellClass = 'board-cell ';
    if (cell.type === 'w') cellClass += 'wall';
    else if (cell.type === 't') cellClass += 'temp-wall';
    else cellClass += 'path';

    const playerSprites = cell.players.map(player => 
      `<div class="player-sprite player-${player.avatar}" data-direction="${player.direction || 'down'}"></div>`
    ).join('');

    const bombSprites = cell.bombs.map(bomb => 
      `<div class="bomb-sprite" data-bomb-id="${bomb.id}"></div>`
    ).join('');

    const explosionSprite = cell.hasExplosion ? 
      '<div class="explosion-sprite"></div>' : '';

    const powerupSprite = cell.powerup ? 
      `<div class="powerup-sprite ${cell.powerup.type}" data-powerup-id="${cell.powerup.id}"></div>` : '';
    
    return `<div class="${cellClass}" data-row="${cell.y}" data-col="${cell.x}">
      ${powerupSprite}
      ${explosionSprite}
      ${bombSprites}
      ${playerSprites}
    </div>`;
  };

  const updateCell = (cell) => {
    const cellElement = document.querySelector(`[data-row="${cell.y}"][data-col="${cell.x}"]`);
    if (cellElement) {
        cellElement.outerHTML = generateCellHTML(cell);
    }
  };

  return (state, dispatch, getState) => {
    console.log("Game page state:", state);
    const { gameStatus, winner } = state;
    
    const currentPlayer = state.game?.players?.find(p => p.id === state.currentPlayerId);
    const allPlayers = state.game?.players || [];
    
    console.log("Current player ID:", state.currentPlayerId);
    console.log("Current player object:", currentPlayer);
    console.log("All players:", allPlayers);
    const chatMessages = state.chatMessages || [];
    
    const gameBoard = state.game?.board;

    if (isInitialRender) {
      const generateBoardHTML = () => {
        if (!gameBoard) return '';
        return gameBoard.map(row => 
          `<div class="board-row" data-row="${row[0].y}">
            ${row.map(cell => generateCellHTML(cell)).join('')}
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

      const chatMessagesHTML = chatMessages.map((msg, index) => {
        const player = allPlayers.find(p => p.nickname === msg.nickname);
        const isCurrentPlayer = player && player.id === state.currentPlayerId;
        
        return `
          <div class="chat-message ${isCurrentPlayer ? 'own-message' : ''}" data-player="${player?.avatar || 'unknown'}">
            <div class="message-header">
              <span class="nickname ${player?.avatar ? `player-${player.avatar}` : ''}">${msg.nickname}</span>
              <span class="timestamp">${msg.timestamp}</span>
            </div>
            <div class="message-content">${msg.message}</div>
          </div>
        `;
      }).join('');

      const htmlString = `
        <section id="game-screen" class="screen" tabindex="0" onfocus="focusGame">
            ${generateGameOverHTML()}
            <div class="game-layout">
                <div class="game-area">
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
        focusGame: (e) => e.target.focus(),
        playAgain: (e) => { e.preventDefault(); return { type: 'RESET_GAME' }; },
        leaveGame: (e) => { e.preventDefault(); return { type: 'LEAVE_GAME' }; }
      };

      cachedResult = domParser(htmlString, handlers);
      isInitialRender = false;

      if (cleanupMovement) cleanupMovement();
      cleanupMovement = initMovement(dispatch, getState);

      setTimeout(() => {
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) gameScreen.focus();
      }, 100);

      return cachedResult; 
    }

    // On subsequent renders, only update dirty cells
    if (gameBoard) {
      gameBoard.forEach(row => {
        row.forEach(cell => {
          if (cell.isDirty) {
            updateCell(cell);
            // This is a bit of a hack, we are modifying state in the view.
            // A better approach would be for the update function to handle this.
            cell.isDirty = false;
          }
        });
      });
    }

    // Update HUD and other dynamic parts imperatively
    // This is not ideal but required by the optimization to avoid re-rendering the whole page
    const hudContainer = document.getElementById('hud-container');
    if (hudContainer) {
      const newHudHTML = allPlayers
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
      if (hudContainer.innerHTML !== newHudHTML) {
        hudContainer.innerHTML = newHudHTML;
      }
    }

    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) {
        const newChatMessagesHTML = chatMessages.map((msg, index) => {
            const player = allPlayers.find(p => p.nickname === msg.nickname);
            const isCurrentPlayer = player && player.id === state.currentPlayerId;
            return `
              <div class="chat-message ${isCurrentPlayer ? 'own-message' : ''}" data-player="${player?.avatar || 'unknown'}">
                <div class="message-header">
                  <span class="nickname ${player?.avatar ? `player-${player.avatar}` : ''}">${msg.nickname}</span>
                  <span class="timestamp">${msg.timestamp}</span>
                </div>
                <div class="message-content">${msg.message}</div>
              </div>
            `;
        }).join('');
        if (chatMessagesContainer.innerHTML !== newChatMessagesHTML) {
            chatMessagesContainer.innerHTML = newChatMessagesHTML;
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    return cachedResult; 
  };
};

export default gamePage();
