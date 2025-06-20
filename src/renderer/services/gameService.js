import { io } from 'socket.io-client';

class GameService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.callbacks = {
      onGameOutput: null,
      onGameReset: null,
      onConnectionChange: null,
      onError: null,
      onImageGenerated: null,
      onAIPrompt: null,
      onAIResponse: null,
      onMusicGenerated: null
    };
    this.serverUrl = 'http://localhost:3001';
  }

  connect() {
    console.log('Connecting to game server...');
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000
    });

    this.socket.on('connect', () => {
      console.log('Connected to game server');
      this.isConnected = true;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from game server');
      this.isConnected = false;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    });

    this.socket.on('game-output', (data) => {
      console.log('Game output received:', data);
      if (this.callbacks.onGameOutput) {
        this.callbacks.onGameOutput(data);
      }
    });

    this.socket.on('game-reset', (data) => {
      console.log('Game reset received:', data);
      if (this.callbacks.onGameReset) {
        this.callbacks.onGameReset(data);
      }
    });

    this.socket.on('game-state', (data) => {
      console.log('Game state received:', data);
      if (this.callbacks.onGameOutput && data.currentState) {
        this.callbacks.onGameOutput({
          output: data.currentState,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    });

    this.socket.on('image-generated', (data) => {
      console.log('Image generated received:', data);
      if (this.callbacks.onImageGenerated) {
        this.callbacks.onImageGenerated(data);
      }
    });

    this.socket.on('ai-prompt', (data) => {
      console.log('AI prompt received:', data);
      if (this.callbacks.onAIPrompt) {
        this.callbacks.onAIPrompt(data);
      }
    });

    this.socket.on('ai-response', (data) => {
      console.log('AI response received:', data);
      if (this.callbacks.onAIResponse) {
        this.callbacks.onAIResponse(data);
      }
    });

    this.socket.on('music-generated', (data) => {
      console.log('Music generated received:', data);
      if (this.callbacks.onMusicGenerated) {
        this.callbacks.onMusicGenerated(data);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send command via WebSocket
  sendCommand(command, graphicsMode = 'pixelart') {
    if (!this.isConnected || !this.socket) {
      console.error('Not connected to game server');
      return Promise.reject(new Error('Not connected to game server'));
    }

    console.log('Sending command via WebSocket:', command);
    this.socket.emit('send-command', { command, graphicsMode });
    return Promise.resolve(); // WebSocket is fire-and-forget, response comes via event
  }

  // Alternative: Send command via HTTP
  async sendCommandHTTP(command) {
    try {
      const response = await fetch(`${this.serverUrl}/api/game/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending command via HTTP:', error);
      throw error;
    }
  }

  async startGame() {
    try {
      const response = await fetch(`${this.serverUrl}/api/game/start`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }

  async resetGame(graphicsMode = 'pixelart') {
    try {
      const response = await fetch(`${this.serverUrl}/api/game/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ graphicsMode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }

  async getGameHistory() {
    try {
      const response = await fetch(`${this.serverUrl}/api/game/history`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting game history:', error);
      throw error;
    }
  }

  async getServerStatus() {
    try {
      const response = await fetch(`${this.serverUrl}/api/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting server status:', error);
      throw error;
    }
  }

  // Request AI move via WebSocket
  requestAIMove(graphicsMode = 'pixelart') {
    if (!this.isConnected || !this.socket) {
      console.error('Not connected to game server');
      return Promise.reject(new Error('Not connected to game server'));
    }

    console.log('Requesting AI move via WebSocket with graphics mode:', graphicsMode);
    
    return new Promise((resolve, reject) => {
      // Set up one-time listeners for this AI move
      const onGameOutput = (data) => {
        if (data.fromAI) {
          // This is the response to our AI move request
          this.socket.off('game-output', onGameOutput);
          this.socket.off('error', onError);
          resolve(data);
        }
      };
      
      const onError = (error) => {
        this.socket.off('game-output', onGameOutput);
        this.socket.off('error', onError);
        reject(new Error(error.message));
      };
      
      // Listen for the response
      this.socket.on('game-output', onGameOutput);
      this.socket.on('error', onError);
      
      // Send the request with graphics mode
      this.socket.emit('ai-move', { graphicsMode });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        this.socket.off('game-output', onGameOutput);
        this.socket.off('error', onError);
        reject(new Error('AI move timeout'));
      }, 30000);
    });
  }

  // Update graphics mode immediately
  updateGraphicsMode(graphicsMode) {
    if (this.isConnected && this.socket) {
      console.log('Sending immediate graphics mode update:', graphicsMode);
      this.socket.emit('update-graphics-mode', { graphicsMode });
    } else {
      console.log('Cannot update graphics mode - not connected');
    }
  }

  // Event listeners
  onGameOutput(callback) {
    this.callbacks.onGameOutput = callback;
  }

  onGameReset(callback) {
    this.callbacks.onGameReset = callback;
  }

  onConnectionChange(callback) {
    this.callbacks.onConnectionChange = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }

  onImageGenerated(callback) {
    this.callbacks.onImageGenerated = callback;
  }

  onAIPrompt(callback) {
    this.callbacks.onAIPrompt = callback;
  }

  onAIResponse(callback) {
    this.callbacks.onAIResponse = callback;
  }

  onMusicGenerated(callback) {
    this.callbacks.onMusicGenerated = callback;
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export a singleton instance
export default new GameService();