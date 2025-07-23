import { diffList } from "./diff.js";
import { apply } from "./Dom.js";

export default (root, initialState, update, view) => {
  let state = initialState;
  let nodes = [];
  let queue = [];
  let isDrawing = false;
  let pendingDraw = false;

  function enqueue(msg) {
    queue.push(msg);
    if (!isDrawing) {
      scheduleUpdate();
    }
  }

  function scheduleUpdate() {
    if (pendingDraw) return;
    pendingDraw = true;
    
    requestAnimationFrame(() => {
      pendingDraw = false;
      updateState();
    });
  }

  async function draw() {
    if (isDrawing) return;
    isDrawing = true;
    
    try {
      const stateWithEnqueue = { ...state, enqueue };
      let newNodes = await view(stateWithEnqueue);
      
      // Batch DOM updates
      const diff = diffList(nodes, newNodes);
      apply(root, enqueue, diff);
      nodes = newNodes;
    } catch (error) {
      console.error('Error in view function:', error);
    } finally {
      isDrawing = false;
    }
  }

  function updateState() {
    if (queue.length === 0) return;
    
    // Process all queued messages in batch
    let msgs = queue;
    queue = [];
    let hasChanges = false;

    for (let msg of msgs) {
      const newState = update(state, msg);
      if (newState !== state) {
        state = newState;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      draw();
    }
  }

  // Initial render
  draw();

  return { enqueue };
};
