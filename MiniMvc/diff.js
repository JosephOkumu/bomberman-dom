// It takes two nodes to be compared, an old and a new one.
export function diffOne(l, r) {
  // First we deal with text nodes. If their text content is not
  // identical, then let's replace the old one for the new one.
  // Otherwise it's a `noop`, which means we do nothing.
  const isText = l.text !== undefined;
  if (isText) {
    return l.text !== r.text ? { replace: r } : { noop: true };
  }

  // Next we start dealing with element nodes.
  // If the tag changed we should just replace the whole thing.
  if (l.tag !== r.tag) {
    return { replace: r };
  }

  // Now that replacement is out of the way we could only possibly
  // modify the element. So let's start by taking note of properties
  // that should be removed.
  // Any property that is not present in the new node should be removed.
  const remove = [];
  const lAttr = l.attr || {};
  const rAttr = r.attr || {};

  for (const prop in lAttr) {
    if (rAttr[prop] === undefined) {
      remove.push(prop);
    }
  }

  // And now let's check which ones should be set.
  // This includes new and modified properties.
  // So unless the property's value is the same in the old and
  // new nodes we will take note of it.
  const set = {};
  for (const prop in rAttr) {
    if (rAttr[prop] !== lAttr[prop]) {
      set[prop] = rAttr[prop];
    }
  }

  // Lastly we diff the list of children.
  const children = diffList(l.children || [], r.children || []);

  return { modify: { remove, set, children } };
}

export function diffList(ls, rs) {
  const length = Math.max(ls.length, rs.length);
  return Array.from({ length }).map((_, i) =>
    ls[i] === undefined
      ? { create: rs[i] }
      : rs[i] === undefined
        ? { remove: true }
        : diffOne(ls[i], rs[i]),
  );
}
