import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  // Convert board string to 2D array
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

  // Generate board HTML
  const generateBoardHTML = () => {
    return boardLines.map((row, rowIndex) => 
      `<div class="board-row" data-row="${rowIndex}">
        ${row.split('').map((cell, colIndex) => 
          `<div class="board-cell ${cell === 'w' ? 'wall' : 'path'}" data-row="${rowIndex}" data-col="${colIndex}"></div>`
        ).join('')}
      </div>`
    ).join('');
  };

  const htmlString = `
    <section id="game-screen" class="screen">
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
    }
  };

  return domParser(htmlString, handlers);
}
