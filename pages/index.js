export default function HomePage(state) {
  return {
    tag: "div",
    children: [
      { tag: "h1", children: [{ text: "HOME PAGE" }] },
      { tag: "p", children: [{ text: `Current path: ${state.path}` }] },
      { tag: "p", children: [{ text: "This is the home page." }] }
    ]
  };
}