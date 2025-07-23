
import init from "./init.js";
import viewRoute from "./viewRoute.js";

export default function initWithRouting(root, initialState, update, createMainView) {
  const enhancedInitialState = {
    ...initialState,
    path: window.location.pathname || '/'
  };

  let isNavigating = false;
  let pendingNavigation = null;

  function enhancedUpdate(state, msg) {
    if (msg.type === "ROUTE_CHANGE") {
      // Prevent concurrent navigation
      if (isNavigating) {
        pendingNavigation = msg;
        return state;
      }
      
      isNavigating = true;
      
      // Schedule navigation on next frame
      requestAnimationFrame(() => {
        isNavigating = false;
        if (pendingNavigation) {
          const pending = pendingNavigation;
          pendingNavigation = null;
          app.enqueue(pending);
        }
      });
      
      return { ...state, path: msg.path };
    }
    return update(state, msg);
  }

  async function enhancedView(state) {
    try {
      const routedContent = await viewRoute(state);
      return createMainView(state, routedContent);
    } catch (error) {
      console.error('View error:', error);
      return createMainView(state, {
        tag: "div",
        attr: { class: "error" },
        children: [{ tag: "h1", children: [{ text: "Loading Error" }] }]
      });
    }
  }

  const app = init(root, enhancedInitialState, enhancedUpdate, enhancedView);

  // Throttled popstate handler
  let popstateTimeout = null;
  window.addEventListener('popstate', (event) => {
    if (popstateTimeout) {
      clearTimeout(popstateTimeout);
    }
    
    popstateTimeout = setTimeout(() => {
      const newPath = window.location.pathname;
      app.enqueue({ type: "ROUTE_CHANGE", path: newPath });
    }, 16); // ~60fps throttling
  });
  
  return app;
}

