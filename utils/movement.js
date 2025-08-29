export default function createKeyboardHandler(currentPlayer, allPlayers, state, gameBoard) {
  return (e) => {
    if (e.target.tagName === 'INPUT') return;
    
    if (!currentPlayer || !currentPlayer.active || !currentPlayer.id) {
      return;
    }
    
    let newX = currentPlayer.x;
    let newY = currentPlayer.y;
    let direction = currentPlayer.direction;
    
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
        return;
    }
    
    e.preventDefault();
    
    const currentBoard = state.game.board;
    
    if (newY >= 0 && newY < currentBoard.length && 
        newX >= 0 && newX < currentBoard[0].length) {
      const targetCell = currentBoard[newY][newX];
      
      if (targetCell.type === 'p') {
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
