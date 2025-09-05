# Bomberman-dom

A multiplayer Bomberman game built with a custom mini-framework and real-time WebSocket communication. Experience classic Bomberman gameplay with modern web technologies!

![Game Screenshot](https://img.shields.io/badge/Game-Bomberman-orange?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-Server-green?style=for-the-badge&logo=node.js)

## 🎮 Features

### Core Gameplay
- **Multiplayer Support**: 2-4 players in real-time battles
- **Classic Bomberman Mechanics**: Place bombs, destroy walls, collect power-ups
- **Power-ups**: Increase bomb count, explosion range, and movement speed
- **Dynamic Board Generation**: Randomized destructible walls with guaranteed connectivity
- **Respawn System**: Multiple lives with strategic respawn points

### Technical Features
- **Custom MiniMVC Framework**: Built from scratch with virtual DOM and state management
- **Real-time Communication**: WebSocket-based multiplayer synchronization
- **Optimized Rendering**: Dirty cell tracking for efficient DOM updates
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Smooth Movement**: Continuous movement with keyboard controls (WASD/Arrow keys)


### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JosephOkumu/bomberman-dom.git
   cd bomberman-dom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the game**
   ```bash
   npm start
   ```

4. **Open your browser**
   - Navigate to `http://localhost:8000`
   - Enter a nickname and join the game!


## 🎯 How to Play

### Controls
- **Movement**: WASD keys or Arrow keys
- **Place Bomb**: Spacebar
- **Chat**: Type in the chat box and press Enter

### Game Rules
1. **Objective**: Be the last player standing
2. **Bombs**: Place bombs to destroy walls and eliminate opponents
3. **Power-ups**: Collect power-ups from destroyed walls:
   - 🧨 **Bomb**: Increase maximum bomb count
   - 🔥 **Flame**: Increase explosion range
   - ⚡ **Speed**: Increase movement speed
4. **Lives**: Each player starts with 3 lives
5. **Respawn**: Players respawn at their starting positions when eliminated

### Game Flow
1. **Lobby**: 2-4 players join the waiting room
2. **Countdown**: Game starts automatically when 4 players join, or after 20 seconds with 2+ players
3. **Battle**: Real-time multiplayer combat
4. **Victory**: Last player standing wins

### MiniMVC Framework

The game is built on a custom lightweight framework featuring:

- **State Management**: Centralized state with immutable updates
- **Virtual DOM**: Efficient rendering with diff-based updates
- **Routing**: Client-side routing with history API
- **Event System**: Declarative event handling
- **Component System**: Reusable view components

### Server Architecture

- **WebSocket Server**: Real-time communication on port 8080
- **Game State Management**: Centralized server-side game logic
- **Player Synchronization**: Broadcast updates to all connected clients
- **Anti-cheat**: Server-side validation of player actions


## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Authors
- [Joseph okumu](/https://github.com/JosephOkumu)

- [James Muchiri](https://github.com/j1mmy7z7)

- [Jesee Kuya](https://github.com/jesee-kuya)

- [Aaron Ochieng](https://github.com/Aaron-Ochieng)



