import { setProperty } from "./properties.js";
import { setListener, eventName } from "./event.js";

export function apply(el, enqueue, childrenDiff) {
  const children = Array.from(el.childNodes);
  childrenDiff.forEach((diff, i) => {
    const action = Object.keys(diff)[0];
    switch (action) {
      case "remove":
        children[i].remove();
        break;
      case "modify":
        modify(children[i], enqueue, diff.modify);
        break;
      case "create": {
        const child = create(enqueue, diff.create);
        el.appendChild(child);
        break;
      }
      case "replace": {
        const child = create(enqueue, diff.replace);
        children[i].replaceWith(child);
        break;
      }
      case "noop":
        break;
    }
  });
}

function modify(el, enqueue, diff) {
  for (const prop of diff.remove) {
    const event = eventName(prop);
    if (event === null) {
      el.removeAttribute(prop);
    } else {
      el._ui.listeners[event] = undefined;
      el.removeEventListener(event, listener);
    }
  }

  for (const prop in diff.set) {
    const value = diff.set[prop];
    const event = eventName(prop);
    event !== null
      ? setListener(el, event, value)
      : setProperty(prop, value, el);
  }

  apply(el, enqueue, diff.children);
}

export function create(enqueue, vnode) {
  if (vnode.text !== undefined) {
    const el = document.createTextNode(vnode.text);
    return el;
  }

  const el = document.createElement(vnode.tag);
  el._ui = { listeners: {}, enqueue };

  for (const prop in vnode.attr) {
    const event = eventName(prop);
    const value = vnode.attr[prop];
    event !== null
      ? setListener(el, event, value)
      : setProperty(prop, value, el);
  }

  if (vnode.children !== undefined) {
    for (const childVNode of vnode.children) {
      const child = create(enqueue, childVNode);
      el.appendChild(child);
    }
  }

  return el;
}
