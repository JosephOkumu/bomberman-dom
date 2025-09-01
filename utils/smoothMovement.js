let moveInterval;
let currentDirection = null;

const directionKeys = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

function startMovement(dispatch, getState) {
  if (moveInterval) {
    clearInterval(moveInterval);
  }

  const player = getState().game.players.find(p => p.id === getState().currentPlayerId);
  const baseSpeed = 200; // ms per move
  const speedBonus = player ? (player.speed - 1) * 20 : 0;
  const moveSpeed = Math.max(50, baseSpeed - speedBonus);

  moveInterval = setInterval(() => {
    if (currentDirection) {
      const state = getState();
      const currentPlayer = state.game.players.find(p => p.id === state.currentPlayerId);
      if (currentPlayer) {
        dispatch({ type: 'PLAYER_MOVE', payload: { playerId: currentPlayer.id, direction: currentDirection } });
      }
    }
  }, moveSpeed);
}

function handleKeyDown(e, dispatch, getState) {
  const newDirection = directionKeys[e.key];
  if (newDirection) {
    e.preventDefault();
    currentDirection = newDirection;
  } else if (e.key === ' ') {
    e.preventDefault();
    const state = getState();
    const currentPlayer = state.game.players.find(p => p.id === state.currentPlayerId);
    if (currentPlayer) {
      dispatch({ type: 'PLAYER_PLACE_BOMB', payload: { playerId: currentPlayer.id } });
    }
  }
}

function handleKeyUp(e) {
  const releasedDirection = directionKeys[e.key];
  if (releasedDirection && releasedDirection === currentDirection) {
    e.preventDefault();
    currentDirection = null;
  }
}

export function initMovement(dispatch, getState) {
  const keyDownHandler = (e) => handleKeyDown(e, dispatch, getState);
  document.addEventListener('keydown', keyDownHandler);
  document.addEventListener('keyup', handleKeyUp);
  startMovement(dispatch, getState);

  return () => {
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', handleKeyUp);
    clearInterval(moveInterval);
  };
}
