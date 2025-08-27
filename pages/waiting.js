import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  console.log('Waiting room state:', state);
  const { waitingPlayers, currentPlayerId, gameStatus, timers } = state;

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
      <img src="${getAvatarPath(player.avatar)}" class="player-avatar" alt="${player.avatar}">
      <p class="player-name">${player.nickname}</p>
    </div>
  `).join('');

  const minPlayersTimerVisible = gameStatus === 'waiting' && waitingPlayers.length >= 2;
  const gameStartTimerVisible = gameStatus === 'starting';

  const htmlString = `
    <section id="waiting-room-screen" class="screen">
        <div class="card">
            <h1>Waiting for Players</h1>
            <div id="player-badges-container" class="player-badges">
                ${playerBadgesHTML}
            </div>
            <p id="player-count" class="player-count">${waitingPlayers.length}/4 joined</p>
            <div class="timers">
                <div class="timer-display" style="display: ${minPlayersTimerVisible ? 'block' : 'none'};">
                    <p>Auto-start with 2+ players in:</p>
                    <strong id="min-players-timer">${timers.minPlayersTimer.remaining}s</strong>
                </div>
                <div class="timer-display" style="display: ${gameStartTimerVisible ? 'block' : 'none'};">
                    <p>Game starts in:</p>
                    <strong id="game-start-timer">${timers.gameStartTimer.remaining}s</strong>
                </div>
            </div>
            <button id="leave-btn" onclick="goBack">Leave</button>
        </div>
      </section>
  `

  const handlers = {
    goBack: (e) => {
      e.preventDefault();
      return { type: "LEAVE_WAITING_ROOM" };
    }
  }

  return domParser(htmlString, handlers);
}