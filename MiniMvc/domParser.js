import createElement from "./createElement.js";
import { eventName } from "./event.js";

export default (htmlString, handlers) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const rootElement = doc.body.firstChild; // Get the first element inside the body

  if (!rootElement) {
    return null; // Handle empty HTML string or no elements
  }

  function convertNode(node, handlers) {
    // Handle element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const attr = {};
      for (const attribute of node.attributes) {
        const name = attribute.name;
        let value = attribute.value;

        // Check if attribute is an event (onClick, onInput, etc)
        const event = eventName(name);
        // If it's an event, and handlers[value] is a function, replace string with function
        if (event && typeof handlers[value] === "function") {
          value = handlers[value];
        }

        attr[name] = value;
      }

      const children = Array.from(node.childNodes)
        .map((child) => convertNode(child, handlers))
        .filter((child) => child !== null);

      return createElement(tagName, { attr, children });
    }

    // Handle text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmedText = node.textContent.trim();
      return trimmedText ? { text: trimmedText } : null; // Return text content, or null if empty after trimming
    }

    // Ignore comment nodes and other node types for this VDOM structure
    return null;
  }

  return convertNode(rootElement, handlers);
};
