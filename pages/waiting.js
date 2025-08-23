import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  const { waitingPlayers, currentPlayerId } = state;

  const getAvatarPath = (avatar) => {
    switch (avatar) {
      case 'B1':
        return 'assets/B1/b1walkDown.png';
      case 'B2':
        return 'assets/B2/walkingdown.png';
      case 'B3':
        return 'assets/B3/down.png';
      case 'B4':
        return 'assets/B4/down.png';
      default:
        return '';
    }
  };

  const playerBadgesHTML = waitingPlayers.map(player => `
    <div class="player-badge ${player.id === currentPlayerId ? 'current-player' : ''}">
      <div class="player-avatar" style="background-image: url('${getAvatarPath(player.avatar)}'); background-size: 300% 100%; background-repeat: no-repeat; background-position: 0 0;"></div>
      <p class="player-name">${player.nickname}</p>
    </div>
  `).join('');

  const htmlString = `
    <section id="waiting-room-screen" class="screen">
        <div class="card">
            <h1>Waiting for Players</h1>
            <div id="player-badges-container" class="player-badges">
                ${playerBadgesHTML}
            </div>
            <p id="player-count" class="player-count">${waitingPlayers.length}/4 joined</p>
            <div class="timers">
                <div class="timer-display">
                    <p>Auto-start with 2+ players in:</p>
                    <strong id="min-players-timer">20s</strong>
                </div>
                <div class="timer-display">
                    <p>Game starts in:</p>
                    <strong id="game-start-timer">10s</strong>
                </div>
            </div>
            <button id="start-game-btn" onclick="start">Start Now</button>
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
      const path = "/game";
      window.history.pushState({}, "", path);
      return { type: "ROUTE_CHANGE", path };
    }
  }

  return domParser(htmlString, handlers);
}