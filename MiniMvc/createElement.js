export default (tag, { attr = {}, children = [] } = {}) => {
  return {
    tag,
    attr,
    children,
  };
};
