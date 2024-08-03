import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  const waitingRoom = state.waitingRoom || { players: [], playerCount: 0 };
  const players = waitingRoom.players || [];
  const playerCount = waitingRoom.playerCount || 0;
  const gameStartTime = waitingRoom.gameStartTime;

  // Generate player badges HTML
  const playerBadgesHTML = players.map(player => `
    <div class="player-badge ${player.isCurrentUser ? 'current-user' : ''}">
      <div class="player-avatar player-${player.avatar.toLowerCase()}"></div>
      <div class="player-name">${player.nickname}</div>
    </div>
  `).join('') || '<p>No players joined yet...</p>';

  // Calculate timers
  const now = Date.now();
  const autoStartTimeLeft = Math.max(0, Math.floor((waitingRoom.autoStartTime - (now - (state.waitingRoomStartTime || now))) / 1000));
  const countdownTimeLeft = gameStartTime ? Math.max(0, Math.floor((gameStartTime - now) / 1000)) : 0;

  const htmlString = `
    <section id="waiting-room-screen" class="screen">
        <div class="card">
            <h1>Waiting for Players</h1>
            <div id="player-badges-container" class="player-badges">
                ${playerBadgesHTML}
            </div>
            <p id="player-count" class="player-count">${playerCount}/4 joined</p>
            <div class="timers">
                <div class="timer-display">
                    <p>Auto-start with 2+ players in:</p>
                    <strong id="min-players-timer">${autoStartTimeLeft}s</strong>
                </div>
                <div class="timer-display">
                    <p>Game starts in:</p>
                    <strong id="game-start-timer">${countdownTimeLeft}s</strong>
                </div>
            </div>
            <button id="start-game-btn" onclick="start" ${playerCount < 2 ? 'disabled' : ''}>Start Now</button>
        </div>
    </section>
  `

  const handlers = {
    goBack: (e) => {
      e.preventDefault();
      const path = "/";
      window.history.pushState({}, "", path);
      return { type: "ROUTE_CHANGE", path };
    },

    start: (e) => {
      e.preventDefault();
      if (window.wsClient && window.wsClient.isConnected) {
        window.wsClient.sendManualStart();
      }
      return null; // Don't navigate, let server handle it
    }
  }

  // Set up timer updates if this is the first render
  if (!window.waitingRoomTimerInterval) {
    window.waitingRoomTimerInterval = setInterval(() => {
      // Force a re-render to update timers
      if (window.app && window.app.enqueue) {
        window.app.enqueue({ type: "TIMER_UPDATE" });
      }
    }, 1000);
  }

  // Clean up game timer if it exists
  if (window.gameTimerInterval) {
    clearInterval(window.gameTimerInterval);
    window.gameTimerInterval = null;
  }

  return domParser(htmlString, handlers);
}