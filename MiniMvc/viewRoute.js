import FileRouter from "./fileRouter.js";

const router = new FileRouter('../pages');
const componentCache = new Map();
const routeCache = new Map();

export default async (state) => {
  const currentPath = state.path || window.location.pathname || '/';
  
  try {
    // Check component cache first
    const cacheKey = currentPath;
    if (componentCache.has(cacheKey)) {
      const cachedComponent = componentCache.get(cacheKey);
      const enhancedState = { ...state, params: state.params || {}, path: currentPath };
      return cachedComponent(enhancedState);
    }

    // Use cached routes if available
    let routes = routeCache.get('discovered');
    if (!routes) {
      routes = await router.discoverRoutes();
      routeCache.set('discovered', routes);
    }

    let component = null;
    let params = {};

    // Try exact route match first
    component = await router.loadPage(currentPath);
    
    // If no exact match, try pattern matching
    if (!component) {
      for (const route of routes) {
        const matchedParams = router.matchRoute(currentPath, route);
        if (matchedParams !== null) {
          component = await router.loadPage(route);
          params = matchedParams;
          break;
        }
      }
    }

    if (component) {
      // Cache the component for future use
      componentCache.set(cacheKey, component);
      
      const enhancedState = { ...state, params, path: currentPath };
      return component(enhancedState);
    }

    // 404 fallback - cache this too
    const fallback404 = () => ({ 
      tag: "div", 
      attr: { class: "error-404" },
      children: [
        { tag: "h1", children: [{ text: "404 - Page Not Found" }] },
        { tag: "p", children: [{ text: `The page "${currentPath}" could not be found.` }] },
        {
          tag: "a",
          attr: { 
            href: "/",
            onclick: (e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/");
              if (state.enqueue) {
                state.enqueue({ type: "ROUTE_CHANGE", path: "/" });
              }
            }
          },
          children: [{ text: "Go Home" }]
        }
      ]
    });
    
    componentCache.set(cacheKey, fallback404);
    return fallback404(state);
    
  } catch (error) {
    console.error('Routing error:', error);
    return { 
      tag: "div",
      attr: { class: "error" },
      children: [
        { tag: "h1", children: [{ text: "Error" }] },
        { tag: "p", children: [{ text: "Error loading page: " + error.message }] }
      ]
    };
  }
};
