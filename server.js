const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let gameState = {};

async function initializeGame() {
  const { avatars } = await import('./utils/avatarConfig.js');
  gameState = {
    availableAvatars: avatars.map(a => a.name),
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
}

let playerIdCounter = 1;

initializeGame().then(() => {
  wss.on('connection', ws => {
    console.log('Client connected');

    ws.on('message', message => {
      try {
        console.log(`Received message => ${message}`);
        const msg = JSON.parse(message);

        switch (msg.type) {
          case 'JOIN_AND_NAVIGATE':
            if (gameState.availableAvatars.length > 0) {
              const newPlayer = {
                id: playerIdCounter++,
                nickname: msg.nickname,
                avatar: gameState.availableAvatars[0]
              };
              ws.playerId = newPlayer.id;
              gameState.waitingPlayers.push(newPlayer);
              gameState.availableAvatars.shift();

              // Send the player their ID
              ws.send(JSON.stringify({ type: 'SET_PLAYER_ID', playerId: newPlayer.id }));

              // Broadcast the updated game state to all clients
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ type: 'UPDATE_STATE', state: { waitingPlayers: gameState.waitingPlayers } }));
                }
              });
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Failed to process message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      if (ws.playerId) {
        const disconnectedPlayer = gameState.waitingPlayers.find(player => player.id === ws.playerId);
        if (disconnectedPlayer) {
          gameState.availableAvatars.push(disconnectedPlayer.avatar);
          gameState.waitingPlayers = gameState.waitingPlayers.filter(player => player.id !== ws.playerId);

          // Broadcast the updated game state to all clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'UPDATE_STATE', state: gameState }));
            }
          });
        }
      }
    });
  });

  console.log('WebSocket server started on port 8080');
});
