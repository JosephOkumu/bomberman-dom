import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  const htmlString = `
    <section id="waiting-room-screen" class="screen">
        <div class="card">
            <h1>Waiting for Players</h1>
            <div id="player-badges-container" class="player-badges">
                <!-- Player badges will be dynamically inserted here -->
            </div>
            <p id="player-count" class="player-count">1/4 joined</p>
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