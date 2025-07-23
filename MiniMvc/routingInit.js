
import init from "./init.js";
import viewRoute from "./viewRoute.js";

export default function initWithRouting(root, initialState, update, createMainView) {
  // Enhanced state with routing
  const enhancedInitialState = {
    ...initialState,
    path: window.location.pathname || '/'
  };

  // Enhanced update function to handle routing
  function enhancedUpdate(state, msg) {
    if (msg.type === "ROUTE_CHANGE") {
      return { ...state, path: msg.path };
    }
    return update(state, msg);
  }

  // Enhanced view function that includes routing
  async function enhancedView(state) {
    const routedContent = await viewRoute(state);
    return createMainView(state, routedContent);
  }

  const app = init(root, enhancedInitialState, enhancedUpdate, enhancedView);

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (event) => {
    const newPath = window.location.pathname;
    app.enqueue({ type: "ROUTE_CHANGE", path: newPath });
  });
  
  return app;
}

