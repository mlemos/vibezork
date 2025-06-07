const { spawn } = require('child_process');
const path = require('path');

class ZorkGameEngine {
  constructor() {
    this.dfrotzProcess = null;
    this.gameHistory = [];
    this.currentState = '';
    this.isInitialized = false;
    this.outputBuffer = '';
    this.commandQueue = [];
    this.isProcessingCommand = false;
    
    // Configuration
    this.dfrotzPath = '/opt/homebrew/bin/dfrotz';
    this.gameFilePath = path.join(process.env.HOME, 'Downloads/zorkpack/zork1_sg');
  }

  async initialize() {
    console.log('Initializing Zork Game Engine...');
    console.log(`dfrotz path: ${this.dfrotzPath}`);
    console.log(`Game file: ${this.gameFilePath}`);
    
    // For Phase 1, we'll create a mock implementation that can be tested
    // without requiring the actual dfrotz installation
    this.isInitialized = true;
    console.log('Game engine initialized (Phase 1 - Mock Mode)');
  }

  async startGame() {
    if (!this.isInitialized) {
      throw new Error('Game engine not initialized');
    }

    if (this.dfrotzProcess) {
      console.log('Game already running, resetting...');
      await this.resetGame();
      return this.currentState;
    }

    try {
      console.log('Starting dfrotz process...');
      
      // Check if dfrotz exists, if not, use mock mode
      const fs = require('fs');
      if (!fs.existsSync(this.dfrotzPath)) {
        console.log('dfrotz not found, using mock mode for Phase 1 testing');
        return this.startMockGame();
      }

      this.dfrotzProcess = spawn(this.dfrotzPath, [this.gameFilePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.setupProcessHandlers();
      
      // Wait for initial game output
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Game startup timeout'));
        }, 5000);

        this.dfrotzProcess.stdout.once('data', (data) => {
          clearTimeout(timeout);
          const output = data.toString();
          this.currentState = output;
          this.gameHistory.push({
            type: 'start',
            output: output,
            timestamp: new Date().toISOString()
          });
          console.log('Game started successfully');
          resolve(output);
        });
      });

    } catch (error) {
      console.error('Error starting game:', error);
      // Fallback to mock mode
      console.log('Falling back to mock mode...');
      return this.startMockGame();
    }
  }

  startMockGame() {
    const mockOutput = `
ZORK I: The Great Underground Empire
Copyright (c) 1981, 1982, 1983 Infocom, Inc. All rights reserved.
ZORK is a registered trademark of Infocom, Inc.
Revision 88 / Serial number 840726

West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>`;

    this.currentState = mockOutput;
    this.gameHistory.push({
      type: 'start',
      output: mockOutput,
      timestamp: new Date().toISOString()
    });

    console.log('Mock game started for Phase 1 testing');
    return mockOutput;
  }

  setupProcessHandlers() {
    if (!this.dfrotzProcess) return;

    this.dfrotzProcess.stdout.on('data', (data) => {
      const output = data.toString();
      this.outputBuffer += output;
      this.currentState = output;
      console.log('Game output:', output.trim());
    });

    this.dfrotzProcess.stderr.on('data', (data) => {
      console.error('Game error:', data.toString());
    });

    this.dfrotzProcess.on('close', (code) => {
      console.log(`dfrotz process exited with code ${code}`);
      this.dfrotzProcess = null;
    });

    this.dfrotzProcess.on('error', (error) => {
      console.error('dfrotz process error:', error);
      this.dfrotzProcess = null;
    });
  }

  async sendCommand(command) {
    if (!this.isInitialized) {
      throw new Error('Game engine not initialized');
    }

    console.log(`Sending command: ${command}`);

    // For Phase 1, use mock responses
    if (!this.dfrotzProcess) {
      return this.sendMockCommand(command);
    }

    return new Promise((resolve, reject) => {
      if (this.isProcessingCommand) {
        this.commandQueue.push({ command, resolve, reject });
        return;
      }

      this.isProcessingCommand = true;
      this.outputBuffer = '';

      const timeout = setTimeout(() => {
        this.isProcessingCommand = false;
        this.processCommandQueue();
        reject(new Error('Command timeout'));
      }, 3000);

      const onData = (data) => {
        const output = data.toString();
        this.outputBuffer += output;
        
        // Look for the prompt (>) to know when the command is complete
        if (output.includes('>')) {
          clearTimeout(timeout);
          this.dfrotzProcess.stdout.removeListener('data', onData);
          
          this.gameHistory.push({
            type: 'command',
            command: command,
            output: this.outputBuffer,
            timestamp: new Date().toISOString()
          });

          this.isProcessingCommand = false;
          this.processCommandQueue();
          resolve(this.outputBuffer);
        }
      };

      this.dfrotzProcess.stdout.on('data', onData);
      this.dfrotzProcess.stdin.write(command + '\n');
    });
  }

  sendMockCommand(command) {
    const mockResponses = {
      'look': 'West of House\nYou are standing in an open field west of a white house, with a boarded front door.\nThere is a small mailbox here.\n\n>',
      'open mailbox': 'Opening the small mailbox reveals a leaflet.\n\n>',
      'read leaflet': 'WELCOME TO ZORK!\n\nZORK is a game of adventure, danger, and low cunning...\n\n>',
      'go north': 'North of House\nYou are facing the north side of a white house...\n\n>',
      'inventory': 'You are carrying:\n  nothing\n\n>',
      'help': 'Available commands: look, go [direction], take [item], inventory, quit\n\n>'
    };

    const response = mockResponses[command.toLowerCase()] || 
                    `I don't understand "${command}". (Phase 1 mock response)\n\n>`;

    this.gameHistory.push({
      type: 'command',
      command: command,
      output: response,
      timestamp: new Date().toISOString()
    });

    this.currentState = response;
    console.log(`Mock response for "${command}":`, response.trim());
    return Promise.resolve(response);
  }

  processCommandQueue() {
    if (this.commandQueue.length > 0 && !this.isProcessingCommand) {
      const { command, resolve, reject } = this.commandQueue.shift();
      this.sendCommand(command).then(resolve).catch(reject);
    }
  }

  async resetGame() {
    console.log('Resetting game...');
    
    if (this.dfrotzProcess) {
      this.dfrotzProcess.kill();
      this.dfrotzProcess = null;
    }

    this.gameHistory = [];
    this.currentState = '';
    this.outputBuffer = '';
    this.commandQueue = [];
    this.isProcessingCommand = false;

    // Restart the game
    return await this.startGame();
  }

  isRunning() {
    return this.dfrotzProcess !== null || this.isInitialized;
  }

  hasProcess() {
    return this.dfrotzProcess !== null;
  }

  getHistory() {
    return this.gameHistory;
  }

  getCurrentState() {
    return this.currentState;
  }

  async cleanup() {
    console.log('Cleaning up game engine...');
    
    if (this.dfrotzProcess) {
      this.dfrotzProcess.kill();
      this.dfrotzProcess = null;
    }

    this.isInitialized = false;
    console.log('Game engine cleanup complete');
  }
}

module.exports = ZorkGameEngine;