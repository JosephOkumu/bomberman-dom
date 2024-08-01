class WebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.playerId = null;
    this.nickname = null;
  }

  connect(nickname) {
    this.nickname = nickname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '3000');
    const url = `${protocol}//${host}:${port}?nickname=${encodeURIComponent(nickname)}`;

    console.log('Connecting to WebSocket:', url);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.nickname);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  handleMessage(data) {
    console.log('Received WebSocket message:', data.type, data);
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
    } else {
      console.log('Unhandled message type:', data.type, data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  // Game-specific message senders
  sendPlayerMove(x, y, direction) {
    this.send({
      type: 'PLAYER_MOVE',
      playerId: this.playerId,
      x: x,
      y: y,
      direction: direction
    });
  }

  sendPlaceBomb() {
    this.send({
      type: 'PLACE_BOMB',
      playerId: this.playerId
    });
  }

  sendCollectPowerUp(powerUpId) {
    this.send({
      type: 'COLLECT_POWERUP',
      playerId: this.playerId,
      powerUpId: powerUpId
    });
  }

  sendChatMessage(message) {
    this.send({
      type: 'CHAT_MESSAGE',
      playerId: this.playerId,
      nickname: this.nickname,
      message: message
    });
  }

  sendManualStart() {
    this.send({
      type: 'MANUAL_START'
    });
  }
}

export default WebSocketClient;
