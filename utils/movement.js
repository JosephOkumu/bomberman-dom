export default function createKeyboardHandler(currentPlayer, allPlayers, state, gameBoard) {
  return (e) => {
    // Don't handle keys if typing in input fields
    if (e.target.tagName === 'INPUT') return;
    
    if (!currentPlayer || !currentPlayer.active) return;
    
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
          // Send movement to server via WebSocket
          if (window.wsClient && window.wsClient.isConnected) {
            window.wsClient.sendPlayerMove(newX, newY, direction);
          }
          return null; // Don't update state locally, let server handle it
        }
      }
    }
    
    // If movement is blocked, just update direction
    if (direction !== currentPlayer.direction) {
      if (window.wsClient && window.wsClient.isConnected) {
        window.wsClient.sendPlayerMove(currentPlayer.x, currentPlayer.y, direction);
      }
      return null; // Don't update state locally, let server handle it
    }
  };
}