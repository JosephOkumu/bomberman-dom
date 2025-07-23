# MiniMvc Routing System Documentation

## Overview

The MiniMvc routing system provides file-based routing with automatic route discovery, parameterized routes, and seamless navigation. It extends the core MiniMvc framework with client-side routing capabilities while maintaining the same unidirectional data flow architecture.

### Key Components

- **FileRouter**: Discovers and manages routes from the file system
- **routingInit**: Enhanced initialization with routing support
- **viewRoute**: Route resolution and component loading
- **routeUtils**: Navigation utilities and helpers

## Setup Instructions

### Basic Routing Setup

Replace the standard `init()` function with `initWithRouting()` to enable routing:

```javascript
import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";

const initialState = {
  counter: 0,
  user: null
};

function update(state, msg) {
  switch (msg.type) {
    case "INCREMENT":
      return { ...state, counter: state.counter + 1 };
    case "DECREMENT":
      return { ...state, counter: state.counter - 1 };
    default:
      return state;
  }
}

// Main layout wrapper for routed content
function createMainView(state, routedContent) {
  return [
    {
      tag: "nav",
      children: [
        createRouteLink("/", "Home", state.enqueue),
        createRouteLink("/about", "About", state.enqueue),
        createRouteLink("/counter", "Counter", state.enqueue)
      ]
    },
    {
      tag: "main",
      children: [routedContent]
    }
  ];
}

// Initialize with routing
const app = initWithRouting(
  document.getElementById('app'),
  initialState,
  update,
  createMainView
);
```

### Enhanced State Structure

The routing system automatically enhances your state with:

```javascript
{
  ...yourInitialState,
  path: "/current/path",    // Current route path
  params: { id: "123" },    // Route parameters
  enqueue: function         // Message dispatch function
}
```

## Route Definition

### File-Based Route Discovery

Routes are automatically discovered from the `pages/` directory structure:

```
pages/
├── index.js          → /
├── about.js          → /about
├── contact.js        → /contact
├── user.js           → /user/:id
├── posts.js          → /posts/:slug
└── nested/
    └── page.js       → /nested/page
```

### File Naming Conventions

1. **Index Routes**: `index.js` maps to the root path `/`
2. **Static Routes**: `about.js` maps to `/about`
3. **Parameterized Routes**: `user.js` automatically becomes `/user/:id`
4. **Bracket Notation**: `[id].js` maps to `/:id`
5. **Nested Routes**: Directory structure creates nested paths

### Creating Page Components

Each route file should export a default function that returns virtual DOM:

```javascript
// pages/counter.js
import domParser from "../MiniMvc/domParser.js";
import { createRouteLink } from "../MiniMvc/routeUtils.js";

export default (state) => {
  const htmlString = `
    <div>
      <h1>Counter</h1>
      <p>Current count: ${state.counter}</p>
      <button onclick="increment">Increment</button>
      <button onclick="decrement">Decrement</button>
      <a href="/" onclick="home">Home</a>
    </div>
  `;
  
  const handlers = {
    increment: () => ({ type: "INCREMENT" }),
    decrement: () => ({ type: "DECREMENT" })
    home: (e) => {
            e.preventDefault();
            let path = "/"
            window.history.pushState({}, "", path);
            return { type: "ROUTE_CHANGE", path };
        }
  };
  
  return domParser(htmlString, handlers);
};
```

## Navigation

### Creating Navigation Links

Use `createRouteLink()` to create navigation links that work with the routing system:

```javascript
import { createRouteLink } from "../MiniMvc/routeUtils.js";

// In your view function
const navLink = createRouteLink("/about", "About Page", state.enqueue);

// Or in a template
{
  tag: "nav",
  children: [
    createRouteLink("/", "Home", state.enqueue),
    createRouteLink("/counter", "Counter", state.enqueue)
  ]
}
```

### Programmatic Navigation

Use the `redirect()` function for programmatic navigation:

```javascript
import { redirect } from "../MiniMvc/routeUtils.js";

// In an event handler
const handlers = {
  goHome: () => {
    redirect("/", state);
    return null; // No state update needed
  }
};
```

### Manual Route Changes

Handle route changes manually in event handlers:

```javascript
const handlers = {
  navigateHome: (e) => {
    e.preventDefault();
    window.history.pushState({}, "", "/");
    return { type: "ROUTE_CHANGE", path: "/" };
  }
};
```

## Route Parameters

### Accessing Parameters

Route parameters are automatically extracted and available in `state.params`:

```javascript
// For route /user/:id with URL /user/123
export default (state) => {
  const userId = state.params.id; // "123"
  
  return {
    tag: "div",
    children: [
      { tag: "h1", children: [{ text: `User Profile: ${userId}` }] }
    ]
  };
};
```

### Building Parameterized URLs

Use `buildPath()` to construct URLs with parameters:

```javascript
import { buildPath } from "../MiniMvc/routeUtils.js";

const userUrl = buildPath("/user/:id", { id: "123" }); // "/user/123"
const postUrl = buildPath("/posts/:slug", { slug: "hello-world" }); // "/posts/hello-world"
```

## Code Examples

### Complete Routing Example

```javascript
// main.js
import initWithRouting from "./MiniMvc/routingInit.js";
import { createRouteLink } from "./MiniMvc/routeUtils.js";

const initialState = {
  user: null,
  posts: [],
  counter: 0
};

function update(state, msg) {
  switch (msg.type) {
    case "USER_LOGIN":
      return { ...state, user: msg.user };
    case "LOAD_POSTS":
      return { ...state, posts: msg.posts };
    case "INCREMENT":
      return { ...state, counter: state.counter + 1 };
    default:
      return state;
  }
}

function createMainView(state, routedContent) {
  return [
    {
      tag: "header",
      children: [
        {
          tag: "nav",
          children: [
            createRouteLink("/", "Home", state.enqueue),
            createRouteLink("/about", "About", state.enqueue),
            createRouteLink("/user/123", "Profile", state.enqueue),
            createRouteLink("/counter", "Counter", state.enqueue)
          ]
        }
      ]
    },
    {
      tag: "main",
      children: [routedContent]
    }
  ];
}

const app = initWithRouting(
  document.getElementById('app'),
  initialState,
  update,
  createMainView
);
```

### Page Component with Parameters

```javascript
// pages/user.js
import domParser from "../MiniMvc/domParser.js";
import { createRouteLink, redirect } from "../MiniMvc/routeUtils.js";

export default (state) => {
  const userId = state.params.id;
  
  const htmlString = `
    <div>
      <h1>User Profile</h1>
      <p>User ID: ${userId}</p>
      <button onclick="loadUser">Load User Data</button>
      <button onclick="goBack">Go Back</button>
    </div>
  `;
  
  const handlers = {
    loadUser: () => ({ 
      type: "LOAD_USER", 
      userId: userId 
    }),
    goBack: () => {
      redirect("/", state);
      return null;
    }
  };
  
  return domParser(htmlString, handlers);
};
```

### Query Parameters

```javascript
import { getQueryParams } from "../MiniMvc/routeUtils.js";

export default (state) => {
  const queryParams = getQueryParams();
  const searchTerm = queryParams.get('q') || '';
  
  return {
    tag: "div",
    children: [
      { tag: "h1", children: [{ text: "Search Results" }] },
      { tag: "p", children: [{ text: `Searching for: ${searchTerm}` }] }
    ]
  };
};
```

## Error Handling

### 404 Fallback

The routing system automatically handles 404 errors when no route matches:

```javascript
// Automatic 404 response
{
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
          state.enqueue({ type: "ROUTE_CHANGE", path: "/" });
        }
      },
      children: [{ text: "Go Home" }]
    }
  ]
}
```

### Custom Error Handling

Handle routing errors in your page components:

```javascript
export default (state) => {
  try {
    // Your component logic
    return normalView(state);
  } catch (error) {
    console.error('Page error:', error);
    return {
      tag: "div",
      attr: { class: "error" },
      children: [
        { tag: "h1", children: [{ text: "Something went wrong" }] },
        { tag: "p", children: [{ text: error.message }] }
      ]
    };
  }
};
```

## Browser History Integration

The routing system automatically handles:

- **Browser back/forward buttons** via `popstate` events
- **URL updates** when navigating programmatically
- **Initial route** loading from current URL

## Best Practices

1. **Use `createRouteLink()`** for all internal navigation
2. **Handle route parameters** defensively with fallbacks
3. **Keep page components pure** - no side effects in render functions
4. **Use the `redirect()` utility** for programmatic navigation
5. **Structure your `pages/` directory** to match your desired URL structure
6. **Handle loading states** when route parameters change

## Route Lifecycle

```
URL Change
    ↓
Route Discovery (FileRouter.discoverRoutes())
    ↓
Route Matching (FileRouter.matchRoute())
    ↓
Component Loading (FileRouter.loadPage())
    ↓
State Enhancement (add params, path)
    ↓
Component Render
    ↓
Virtual DOM Update
```

This routing system provides a powerful yet simple way to add client-side routing to your MiniMvc applications while maintaining the framework's core principles of simplicity and functional programming.