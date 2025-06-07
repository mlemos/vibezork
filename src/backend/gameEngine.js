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
    this.gameFilePath = path.join(process.env.HOME, 'Downloads/zorkpack/zork1_sg.z5');
  }

  async initialize() {
    console.log('Initializing Zork Game Engine...');
    console.log(`dfrotz path: ${this.dfrotzPath}`);
    console.log(`Game file: ${this.gameFilePath}`);
    
    // Verify dfrotz and game file exist
    const fs = require('fs');
    if (!fs.existsSync(this.dfrotzPath)) {
      throw new Error(`dfrotz not found at ${this.dfrotzPath}`);
    }
    
    if (!fs.existsSync(this.gameFilePath)) {
      throw new Error(`Game file not found at ${this.gameFilePath}`);
    }
    
    this.isInitialized = true;
    console.log('Game engine initialized (Phase 2 - Real dfrotz Mode)');
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

    console.log('Starting dfrotz process...');
    
    try {
      this.dfrotzProcess = spawn(this.dfrotzPath, [this.gameFilePath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.setupProcessHandlers();
      
      // Wait for initial game output
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          this.cleanup();
          reject(new Error('Game startup timeout'));
        }, 15000);

        let initialOutput = '';
        
        const onData = (data) => {
          const output = data.toString();
          initialOutput += output;
          console.log('Initial output received:', JSON.stringify(output));
          
          // Look for the first prompt (>) to know the game is ready
          if (output.includes('>') && (initialOutput.includes('West of House') || initialOutput.includes('house'))) {
            clearTimeout(timeout);
            this.dfrotzProcess.stdout.removeListener('data', onData);
            
            // Clean and store the initial output
            const cleanOutput = this.cleanOutput(initialOutput);
            this.currentState = cleanOutput;
            this.gameHistory.push({
              type: 'start',
              output: cleanOutput,
              timestamp: new Date().toISOString()
            });
            
            console.log('Game started successfully');
            console.log('Clean output:', cleanOutput);
            resolve(cleanOutput);
          }
        };

        const onError = (error) => {
          clearTimeout(timeout);
          console.error('dfrotz process failed to start:', error);
          this.cleanup();
          reject(new Error(`Failed to start dfrotz: ${error.message}`));
        };

        this.dfrotzProcess.on('error', onError);
        this.dfrotzProcess.stdout.on('data', onData);
      });
    } catch (error) {
      console.error('Error spawning dfrotz process:', error);
      throw new Error(`Failed to spawn dfrotz process: ${error.message}`);
    }
  }


  setupProcessHandlers() {
    if (!this.dfrotzProcess) return;

    this.dfrotzProcess.stdout.on('data', (data) => {
      const output = data.toString();
      this.outputBuffer += output;
      console.log('Game output (raw):', JSON.stringify(output));
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

  cleanOutput(rawOutput) {
    // Remove the status line (Score: X Moves: Y) and clean up formatting
    let cleaned = rawOutput
      // Remove lines that are just status info (Score/Moves)
      .replace(/^\s*.*Score:\s*\d+\s*Moves:\s*\d+\s*$/gm, '')
      // Remove the "Using normal formatting" line
      .replace(/Using normal formatting\.?\s*/g, '')
      // Remove the "Loading" line
      .replace(/Loading .*\.z5\.?\s*/g, '')
      // Remove dfrotz startup messages
      .replace(/Welcome to Dungeon\..*?Zork I.*?\n/gs, '')
      // Remove the dfrotz version line
      .replace(/ZORK I: The Great Underground Empire.*?\n/g, '')
      // Remove copyright lines
      .replace(/Copyright.*?Infocom.*?\n/g, '')
      // Remove prompt characters at the end
      .replace(/>\s*$/, '')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove extra whitespace at start/end of lines
      .replace(/^\s+|\s+$/gm, '')
      // Trim whitespace
      .trim();
    
    return cleaned;
  }

  async sendCommand(command) {
    if (!this.isInitialized) {
      throw new Error('Game engine not initialized');
    }

    if (!this.dfrotzProcess) {
      throw new Error('Game not started');
    }

    console.log(`Sending command: ${command}`);

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
        reject(new Error(`Command timeout: ${command}`));
      }, 8000);

      const onData = (data) => {
        const output = data.toString();
        this.outputBuffer += output;
        console.log('Command output received:', JSON.stringify(output));
        
        // Look for the prompt (>) to know when the command is complete
        if (output.includes('>')) {
          clearTimeout(timeout);
          this.dfrotzProcess.stdout.removeListener('data', onData);
          
          // Clean the output
          const cleanOutput = this.cleanOutput(this.outputBuffer);
          
          this.gameHistory.push({
            type: 'command',
            command: command,
            output: cleanOutput,
            timestamp: new Date().toISOString()
          });

          this.currentState = cleanOutput;
          this.isProcessingCommand = false;
          this.processCommandQueue();
          console.log(`Command "${command}" completed. Clean output:`, cleanOutput);
          resolve(cleanOutput);
        }
      };

      const onError = (error) => {
        clearTimeout(timeout);
        this.isProcessingCommand = false;
        this.processCommandQueue();
        console.error('Error during command execution:', error);
        reject(new Error(`Command execution failed: ${error.message}`));
      };

      try {
        this.dfrotzProcess.stdout.on('data', onData);
        this.dfrotzProcess.on('error', onError);
        this.dfrotzProcess.stdin.write(command + '\n');
      } catch (error) {
        clearTimeout(timeout);
        this.isProcessingCommand = false;
        this.processCommandQueue();
        reject(new Error(`Failed to send command: ${error.message}`));
      }
    });
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