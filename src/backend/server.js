const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ZorkGameEngine = require('./gameEngine');
const AIPlayerService = require('./aiPlayerService');

class VibeZorkServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.gameEngine = new ZorkGameEngine();
    this.aiPlayer = new AIPlayerService();
    this.port = process.env.PORT || 3001;
    
    // Set up image generation callback
    this.gameEngine.setImageGeneratedCallback((data) => {
      console.log('Image generated, broadcasting to clients:', data.type);
      console.log('Image data includes prompt:', !!data.imageData?.prompt);
      console.log('Prompt preview:', data.imageData?.prompt?.substring(0, 100) + '...');
      this.io.emit('image-generated', data);
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // Add logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({ 
        status: 'running', 
        timestamp: new Date().toISOString(),
        game: {
          isRunning: this.gameEngine.isRunning(),
          hasProcess: this.gameEngine.hasProcess()
        }
      });
    });

    // Game control endpoints
    this.app.post('/api/game/start', async (req, res) => {
      try {
        const { graphicsMode = 'fantasy' } = req.body;
        const result = await this.gameEngine.startGame(graphicsMode);
        res.json({ 
          success: true, 
          message: 'Game started', 
          output: result.output, 
          gameStatus: result.gameStatus
        });
      } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/game/command', async (req, res) => {
      try {
        const { command } = req.body;
        const result = await this.gameEngine.sendCommand(command);
        
        // Broadcast to all connected clients
        this.io.emit('game-output', {
          command,
          output: result.output,
          gameStatus: result.gameStatus,
          timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, output: result.output, gameStatus: result.gameStatus });
      } catch (error) {
        console.error('Error sending command:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/game/reset', async (req, res) => {
      try {
        const { graphicsMode = 'fantasy' } = req.body;
        const result = await this.gameEngine.resetGame(graphicsMode);
        
        // Broadcast reset to all connected clients
        this.io.emit('game-reset', {
          output: result.output,
          gameStatus: result.gameStatus,
          timestamp: new Date().toISOString()
        });
        
        res.json({ success: true, message: 'Game reset', output: result.output, gameStatus: result.gameStatus });
      } catch (error) {
        console.error('Error resetting game:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.get('/api/game/history', (req, res) => {
      res.json({
        success: true,
        history: this.gameEngine.getHistory(),
        currentState: this.gameEngine.getCurrentState()
      });
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Send current game state to new client
      socket.emit('game-state', {
        isRunning: this.gameEngine.isRunning(),
        history: this.gameEngine.getHistory(),
        currentState: this.gameEngine.getCurrentState()
      });

      // Handle client commands via WebSocket
      socket.on('send-command', async (data) => {
        try {
          const { command, graphicsMode = 'fantasy' } = data;
          console.log(`Command from ${socket.id}: ${command} (Graphics: ${graphicsMode})`);
          
          const result = await this.gameEngine.sendCommand(command, graphicsMode);
          
          // Broadcast to all clients
          this.io.emit('game-output', {
            command,
            output: result.output,
            gameStatus: result.gameStatus,
            timestamp: new Date().toISOString(),
            fromClient: socket.id
          });
        } catch (error) {
          console.error('WebSocket command error:', error);
          socket.emit('error', { message: error.message });
        }
      });

      // Handle AI move requests
      socket.on('ai-move', async () => {
        try {
          console.log(`AI move requested from ${socket.id}`);
          
          // Get current game state and history
          const gameHistory = this.gameEngine.getHistory();
          const currentState = this.gameEngine.getCurrentState();
          
          // Generate AI command with prompt and response callbacks
          const aiCommand = await this.aiPlayer.generateNextCommand(
            gameHistory, 
            currentState,
            (prompt) => {
              // Broadcast the prompt to all clients
              console.log('Broadcasting AI prompt to clients, length:', prompt.length);
              this.io.emit('ai-prompt', {
                prompt: prompt,
                timestamp: new Date().toISOString(),
                fromClient: socket.id
              });
            },
            (fullResponse) => {
              // Broadcast the full AI response to all clients
              console.log('Broadcasting AI response to clients, length:', fullResponse.length);
              this.io.emit('ai-response', {
                response: fullResponse,
                timestamp: new Date().toISOString(),
                fromClient: socket.id
              });
            }
          );
          
          if (!aiCommand) {
            socket.emit('error', { message: 'AI player failed to generate command' });
            return;
          }
          
          console.log(`AI generated command: ${aiCommand}`);
          
          // Execute the AI command
          const result = await this.gameEngine.sendCommand(aiCommand, 'fantasy');
          
          // Broadcast to all clients with AI indicator
          this.io.emit('game-output', {
            command: aiCommand,
            output: result.output,
            gameStatus: result.gameStatus,
            timestamp: new Date().toISOString(),
            fromAI: true,
            fromClient: socket.id
          });
        } catch (error) {
          console.error('WebSocket AI move error:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  async start() {
    try {
      // Initialize the game engine
      console.log('Initializing game engine...');
      await this.gameEngine.initialize();
      
      this.server.listen(this.port, () => {
        console.log(`VibeZork server running on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/api/status`);
        console.log('WebSocket server ready for connections');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    console.log('Shutting down server...');
    await this.gameEngine.cleanup();
    this.server.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  if (global.vibeZorkServer) {
    await global.vibeZorkServer.stop();
  }
  process.exit(0);
});

// Start the server
const server = new VibeZorkServer();
global.vibeZorkServer = server;
server.start();