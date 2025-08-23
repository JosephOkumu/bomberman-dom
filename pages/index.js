import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  const htmlString = `
    <section id="nickname-screen" class="screen">
      <div class="card">
          <h1>Bomber Friends</h1>
          <p>Enter a nickname to join the game.</p>
          <div class="form-group">
              <label for="nickname-input">Enter your nickname</label>
              <input type="text" id="nickname-input" maxlength="12" placeholder="e.g. Player1">
              <p id="nickname-error" class="error-message"></p>
          </div>
          <button id="join-game-btn" onclick="joinGame">Join Game</button>
      </div>
    </section>
  `
  
  const handlers = {    
    joinGame: (e) => {
      e.preventDefault();
      const nickname = e.target.closest('.card').querySelector('#nickname-input').value.trim();
      
      if (!nickname || nickname.length > 12) {
        return null; // Validation failed, don't navigate
      }
      
      const path = "/waiting";
      window.history.pushState({}, "", path);
      return { type: "JOIN_AND_NAVIGATE", path, nickname };
    }
  }

  return domParser(htmlString, handlers);
}
