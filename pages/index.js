import domParser from "../MiniMvc/domParser";

export default (state) => {
  const htmlString = `
    <section id="nickname-screen" class="screen">
        <div class="card">
            <h1>Bomber Friends</h1>
            <p>Enter a nickname to join the game.</p>
            <div class="form-group">
                <label for="nickname-input">Enter your nickname</label>
                <input type="text" id="nickname-input" maxlength="12" placeholder="e.g. PixelPioneer">
                <p id="nickname-error" class="error-message"></p>
            </div>
            <button onclick="waiting" id="join-game-btn" disabled>Join Game</button>
        </div>
    </section>
  `
  const handlers = {
    waiting: (e) => {
      e.preventDefault();
      let path = "/waiting";
      window.history.pushState({}, "", path);
      return { type: "ROUTE_CHANGE", path };
    }

  }

  return domParser(htmlString, handlers);
}
