export default function createKeyboardHandler(currentPlayer, allPlayers, state, gameBoard) {
  return (e) => {
    // Don't handle keys if typing in input fields
    if (e.target.tagName === 'INPUT') return;
    
    // Make sure we have a current player and it's active
    if (!currentPlayer || !currentPlayer.active || !currentPlayer.id) {
      console.log("No current player or player not active:", currentPlayer);
      return;
    }
    
    console.log("Handling movement for player:", currentPlayer.id, currentPlayer.nickname);
    
    let newX = currentPlayer.x;
    let newY = currentPlayer.y;
    let direction = currentPlayer.direction;
    
    // Handle movement keys
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        newY = currentPlayer.y - 1;
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        newY = currentPlayer.y + 1;
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        newX = currentPlayer.x - 1;
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        newX = currentPlayer.x + 1;
        direction = 'right';
        break;
      case ' ': // Spacebar for placing bombs
        e.preventDefault();
        return { type: 'PLACE_BOMB', payload: { playerId: currentPlayer.id } };
      default:
        return; // Don't prevent default for other keys
    }
    
    e.preventDefault();
    
    // Get the current board (use stored board from state)
    const currentBoard = state.game.board || gameBoard;
    
    // Check if the new position is valid (not a wall and within bounds)
    if (newY >= 0 && newY < currentBoard.length && 
        newX >= 0 && newX < currentBoard[0].length) {
      const targetCell = currentBoard[newY][newX];
      
      // Check if target cell is walkable (path only)
      if (targetCell === 'p') {
        // Check if another player is already at this position
        const playerAtPosition = allPlayers.find(p => 
          p.active && p.id !== currentPlayer.id && p.x === newX && p.y === newY
        );
        
        if (!playerAtPosition) {
          return {
            type: "MOVE_PLAYER",
            playerId: currentPlayer.id,
            x: newX,
            y: newY,
            direction: direction
          };
        }
      }
    }
    
    // If movement is blocked, just update direction
    if (direction !== currentPlayer.direction) {
      return {
        type: "MOVE_PLAYER",
        playerId: currentPlayer.id,
        x: currentPlayer.x,
        y: currentPlayer.y,
        direction: direction
      };
    }
  };
}
