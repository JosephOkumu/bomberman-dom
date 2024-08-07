# Bomberman DOM - Multiplayer Game

A multiplayer Bomberman game built using a custom DOM-based mini-framework with WebSocket support.

## Features

- **Multiplayer Support**: 2-4 players with real-time WebSocket communication
- **Waiting Room**: Automatic avatar assignment, player highlighting, and countdown timers
- **Game Mechanics**: 
  - 3 lives per player
  - Bomb placement and explosions
  - Power-ups (bombs, flames, speed)
  - Destructible blocks
  - Chat system
- **Responsive Design**: Works on desktop and mobile devices
- **60fps Performance**: Optimized DOM updates for smooth gameplay

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Enter a nickname and join the game
2. Wait for other players (2-4 players required)
3. Game starts automatically after countdown
4. Use WASD or arrow keys to move
5. Press SPACEBAR to place bombs
6. Collect power-ups to increase your abilities
7. Chat with other players using the sidebar

## Controls

- **Movement**: WASD or Arrow Keys
- **Place Bomb**: SPACEBAR
- **Chat**: Type in the chat input field
- **Toggle Sidebar**: Click the menu button (mobile)

## Game Rules

- Each player starts with 3 lives
- Players start in the 4 corners of the map
- Bombs explode after 3 seconds
- Power-ups appear when blocks are destroyed
- Last player standing wins
- Game ends after 3 minutes if no winner

## Technical Details

- **Frontend**: Custom DOM-based framework (no external dependencies)
- **Backend**: Node.js with WebSocket (ws library)
- **Real-time**: WebSocket communication for all game events
- **Assets**: Custom sprite sheets for players and game elements 
