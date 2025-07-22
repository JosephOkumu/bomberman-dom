import FileRouter from "./fileRouter.js";

const router = new FileRouter('../pages');

export default async (state) => {
  // Get current path from state or window location
  const currentPath = state.path || window.location.pathname || '/';
  console.log('ViewRoute: Processing path:', currentPath);
  
  try {
    // First try to load the exact route
    let component = await router.loadPage(currentPath);
    let params = {};
    console.log('ViewRoute: Direct load result:', component ? 'success' : 'failed');

    // If exact route doesn't exist, try pattern matching
    if (!component) {
      console.log('ViewRoute: Trying pattern matching...');
      const routes = await router.discoverRoutes();
      console.log('ViewRoute: Available routes:', routes);
      
      for (const route of routes) {
        const matchedParams = router.matchRoute(currentPath, route);
        if (matchedParams !== null) {
          console.log('ViewRoute: Matched route:', route, 'with params:', matchedParams);
          component = await router.loadPage(route);
          params = matchedParams;
          break;
        }
      }
    }

    if (component) {
      const enhancedState = { ...state, params, path: currentPath };
      const result = component(enhancedState);
      console.log('ViewRoute: Component rendered successfully');
      return result;
    }

    console.log('ViewRoute: No component found, showing 404');
    // 404 fallback
    return { 
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
    };
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
