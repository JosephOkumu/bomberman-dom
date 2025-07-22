export default function ContactPage(state) {
  return {
    tag: "div",
    children: [
      { tag: "h1", children: [{ text: "Contact Us" }] },
      { tag: "p", children: [{ text: `Current path: ${state.path}` }] },
      { tag: "p", children: [{ text: "Get in touch with us here." }] }
    ]
  };
}