// Utility functions for enhanced routing capabilities

export function createRouteLink(path, text, enqueue) {
  return {
    tag: "a",
    attr: {
      href: path,
      onclick: (e) => {
        e.preventDefault();
        window.history.pushState({}, "", path);
        enqueue({ type: "ROUTE_CHANGE", path });
      }
    },
    children: [{ text }]
  };
}

export function redirect(path, state) {
  window.history.pushState({}, "", path);
  state.enqueue({ type: "ROUTE_CHANGE", path });
}

export function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

export function buildPath(route, params = {}) {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, value),
    route
  );
}
