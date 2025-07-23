import { setProperty } from "./properties.js";
import { setListener, eventName } from "./event.js";

const documentFragment = document.createDocumentFragment();

export function apply(el, enqueue, childrenDiff) {
  const children = Array.from(el.childNodes);
  const operations = [];
  
  // Collect all operations first
  childrenDiff.forEach((diff, i) => {
    const action = Object.keys(diff)[0];
    operations.push({ action, diff, index: i, element: children[i] });
  });
  
  // Batch DOM operations
  requestAnimationFrame(() => {
    operations.forEach(({ action, diff, index, element }) => {
      switch (action) {
        case "remove":
          if (element) element.remove();
          break;
        case "modify":
          if (element) modify(element, enqueue, diff.modify);
          break;
        case "create": {
          const child = create(enqueue, diff.create);
          el.appendChild(child);
          break;
        }
        case "replace": {
          if (element) {
            const child = create(enqueue, diff.replace);
            element.replaceWith(child);
          }
          break;
        }
        case "noop":
          break;
      }
    });
  });
}

function modify(el, enqueue, diff) {
  // Batch property updates
  const propertyUpdates = [];
  const eventUpdates = [];
  
  for (const prop of diff.remove) {
    const event = eventName(prop);
    if (event === null) {
      propertyUpdates.push(() => el.removeAttribute(prop));
    } else {
      eventUpdates.push(() => {
        if (el._ui && el._ui.listeners) {
          el._ui.listeners[event] = undefined;
          el.removeEventListener(event, listener);
        }
      });
    }
  }

  for (const prop in diff.set) {
    const value = diff.set[prop];
    const event = eventName(prop);
    if (event !== null) {
      eventUpdates.push(() => setListener(el, event, value));
    } else {
      propertyUpdates.push(() => setProperty(prop, value, el));
    }
  }
  
  // Apply updates in batches
  propertyUpdates.forEach(update => update());
  eventUpdates.forEach(update => update());

  apply(el, enqueue, diff.children);
}

export function create(enqueue, vnode) {
  if (vnode.text !== undefined) {
    return document.createTextNode(vnode.text);
  }

  const el = document.createElement(vnode.tag);
  el._ui = { listeners: {}, enqueue };

  // Batch attribute setting
  if (vnode.attr) {
    for (const prop in vnode.attr) {
      const event = eventName(prop);
      const value = vnode.attr[prop];
      if (event !== null) {
        setListener(el, event, value);
      } else {
        setProperty(prop, value, el);
      }
    }
  }

  // Create children efficiently
  if (vnode.children && vnode.children.length > 0) {
    const fragment = document.createDocumentFragment();
    for (const childVNode of vnode.children) {
      const child = create(enqueue, childVNode);
      fragment.appendChild(child);
    }
    el.appendChild(fragment);
  }

  return el;
}

function listener(event) {
  const el = event.currentTarget;
  const handler = el._ui.listeners[event.type];
  const enqueue = el._ui.enqueue;
  const msg = handler(event);
  if (msg !== undefined) {
    enqueue(msg);
  }
}
