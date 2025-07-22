export default function AboutPage(state) {
  return {
    tag: "div",
    children: [
      { tag: "h1", children: [{ text: "About Us" }] },
      { tag: "p", children: [{ text: `Current path: ${state.path}` }] },
      { tag: "p", children: [{ text: "This is the about page content." }] }
    ]
  };
}