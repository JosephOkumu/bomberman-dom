import domParser from "../MiniMvc/domParser.js";

export default (state) => {
  const htmlString = `
    <section id="nickname-screen" class="screen">
        <div class="card">
            <h1>Bomber Friends</h1>
            <p>Enter a nickname to join the game.</p>
            <div class="form-group">
                <label for="nickname-input">Enter your nickname</label>
                <input type="text" id="nickname-input" maxlength="12" placeholder="e.g. player1" oninput="validateNickname">
                <p id="nickname-error" class="error-message"></p>
            </div>
            <button onclick="joinGame" id="join-game-btn" disabled>Join Game</button>
        </div>
    </section>
  `
  
  const handlers = {
    validateNickname: (e) => {
      const nickname = e.target.value.trim();
      const button = e.target.closest('.card').querySelector('#join-game-btn');
      const errorElement = e.target.closest('.card').querySelector('#nickname-error');
      
      if (nickname.length === 0) {
        button.disabled = true;
        errorElement.textContent = '';
      } else if (nickname.length > 12) {
        button.disabled = true;
        errorElement.textContent = 'Nickname must be 12 characters or less';
      } else {
        button.disabled = false;
        errorElement.textContent = '';
      }
      
      return null; // No state change needed
    },
    
    joinGame: (e) => {
      e.preventDefault();
      const nickname = e.target.closest('.card').querySelector('#nickname-input').value.trim();
      
      if (!nickname || nickname.length > 12) {
        return null; // Validation failed, don't navigate
      }
      
      const path = "/waiting";
      window.history.pushState({}, "", path);
      return { type: "ROUTE_CHANGE", path, nickname };
    }
  }

  return domParser(htmlString, handlers);
}
