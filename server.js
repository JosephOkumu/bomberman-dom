const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {
  availableAvatars: ['B1', 'B2', 'B3', 'B4'],
  waitingPlayers: [],
  game: {
    board: null,
    players: [
      { id: 1, x: 1, y: 1, direction: 'down', lives: 3, active: true },
      { id: 2, x: 29, y: 1, direction: 'down', lives: 3, active: false },
      { id: 3, x: 1, y: 11, direction: 'down', lives: 3, active: false },
      { id: 4, x: 29, y: 11, direction: 'down', lives: 3, active: false }
    ],
    currentPlayer: 1
  }
};

wss.on('connection', ws => {
  console.log('Client connected');

  ws.on('message', message => {
    console.log(`Received message => ${message}`);
    const msg = JSON.parse(message);

    switch (msg.type) {
      case 'JOIN_AND_NAVIGATE':
        if (gameState.availableAvatars.length > 0) {
          const newPlayer = {
            id: ws._socket.remoteAddress + ':' + ws._socket.remotePort,
            nickname: msg.nickname,
            avatar: gameState.availableAvatars[0]
          };
          gameState.waitingPlayers.push(newPlayer);
          gameState.availableAvatars.shift();

          // Broadcast the updated game state to all clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'UPDATE_STATE', state: gameState, currentPlayerId: newPlayer.id }));
            }
          });
        }
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const disconnectedPlayer = gameState.waitingPlayers.find(player => player.id === (ws._socket.remoteAddress + ':' + ws._socket.remotePort));
    if (disconnectedPlayer) {
      gameState.availableAvatars.push(disconnectedPlayer.avatar);
      gameState.waitingPlayers = gameState.waitingPlayers.filter(player => player.id !== disconnectedPlayer.id);

      // Broadcast the updated game state to all clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'UPDATE_STATE', state: gameState }));
        }
      });
    }
  });
});

console.log('WebSocket server started on port 8080');
