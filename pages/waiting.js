import { avatars } from '../utils/avatarConfig.js';
import domParser from "../MiniMvc/domParser.js";

function animateAvatars(waitingPlayers) {
  waitingPlayers.forEach(player => {
    const avatarDiv = document.getElementById(`player-avatar-${player.id}`);
    if (!avatarDiv) return;

    let frame = 0;
    setInterval(() => {
      frame = (frame + 1) % 3;
      avatarDiv.style.backgroundPosition = `-${frame * 100}% 0`;
    }, 150);
  });
}

export default (state) => {
  const { waitingPlayers, currentPlayerId } = state;

  const getAvatarPath = (avatarName) => {
    const avatar = avatars.find(a => a.name === avatarName);
    return avatar ? avatar.sprites.walkDown : '';
  };

  const playerBadgesHTML = waitingPlayers.map(player => `
    <div class="player-badge ${player.id === currentPlayerId ? 'current-user' : ''}">
      <div id="player-avatar-${player.id}" class="player-avatar" style="background-image: url('${getAvatarPath(player.avatar)}'); background-size: 300%; background-repeat: no-repeat; background-position: 0 0;"></div>
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
`;

  // Call animateAvatars after the DOM is updated
  setTimeout(() => animateAvatars(waitingPlayers), 0);

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