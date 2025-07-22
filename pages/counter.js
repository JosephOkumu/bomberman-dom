import domParser from "../MiniMvc/domParser.js";
import { createRouteLink } from "../MiniMvc/routeUtils.js";

export default (state) => {
    let a = createRouteLink("/", "Home", state.enqueue)
    const htmlstring = `
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
        decrement: () => ({ type: "DECREMENT" }),
        home: (e) => {
            e.preventDefault();
            let path = "/"
            window.history.pushState({}, "", path);
            return { type: "ROUTE_CHANGE", path };
        }

    };
    return domParser(htmlstring, handlers);
}