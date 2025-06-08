const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ImageGenerationService = require('./imageService');
const MusicGenerationService = require('./musicService');

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
    this.dfrotzPath = this.findDfrotzPath();
    this.gameFilePath = path.join(process.env.HOME, 'Downloads/zorkpack/zork1_sg.z5');
    
    // Image generation service
    this.imageService = new ImageGenerationService();
    
    // Music generation service
    this.musicService = new MusicGenerationService();
    
    // Callbacks for when media is generated
    this.onImageGenerated = null;
    this.onMusicGenerated = null;
    
    // Track current room for image generation optimization
    this.currentRoom = null;
  }

  /**
   * Find dfrotz binary in common installation paths
   */
  findDfrotzPath() {
    const commonPaths = [
      '/opt/homebrew/bin/dfrotz',        // Homebrew on Apple Silicon
      '/usr/local/bin/dfrotz',           // Homebrew on Intel Mac / Manual install
      '/usr/bin/dfrotz',                 // System package manager
      '/opt/local/bin/dfrotz',           // MacPorts
      process.env.DFROTZ_PATH,           // User-specified environment variable
    ].filter(Boolean); // Remove undefined values

    for (const dfrotzPath of commonPaths) {
      if (fs.existsSync(dfrotzPath)) {
        console.log(`Found dfrotz at: ${dfrotzPath}`);
        return dfrotzPath;
      }
    }

    // If none found, default to Homebrew path and let initialization handle the error
    const defaultPath = '/opt/homebrew/bin/dfrotz';
    console.warn('dfrotz not found in common paths, using default:', defaultPath);
    console.warn('Common paths checked:', commonPaths);
    console.warn('Set DFROTZ_PATH environment variable to specify custom location');
    return defaultPath;
  }

  async initialize() {
    console.log('Initializing Zork Game Engine...');
    console.log(`dfrotz path: ${this.dfrotzPath}`);
    console.log(`Game file: ${this.gameFilePath}`);
    
    // Verify dfrotz and game file exist
    if (!fs.existsSync(this.dfrotzPath)) {
      throw new Error(`dfrotz not found at ${this.dfrotzPath}. Install dfrotz or set DFROTZ_PATH environment variable.`);
    }
    
    if (!fs.existsSync(this.gameFilePath)) {
      throw new Error(`Game file not found at ${this.gameFilePath}`);
    }
    
    this.isInitialized = true;
    console.log('Game engine initialized (Phase 2 - Real dfrotz Mode)');
  }

  async startGame(graphicsMode = 'fantasy') {
    if (!this.isInitialized) {
      throw new Error('Game engine not initialized');
    }

    if (this.dfrotzProcess) {
      console.log('Game already running, killing existing process...');
      await this.killProcess();
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
            const result = this.cleanOutput(initialOutput);
            this.currentState = result.output;
            
            this.gameHistory.push({
              type: 'start',
              output: result.output,
              gameStatus: result.gameStatus,
              timestamp: new Date().toISOString()
            });
            
            // Always generate media on game start and set initial room
            if (result.gameStatus?.room) {
              this.currentRoom = result.gameStatus.room;
            }
            
            // Generate image
            this.generateImageForOutput(result.output, result.gameStatus, { type: 'start', graphicsMode: graphicsMode })
              .catch(error => {
                console.error('Error generating start image:', error);
              });
            
            // Generate music
            this.generateMusicForOutput(result.output, result.gameStatus, { type: 'start' })
              .catch(error => {
                console.error('Error generating start music:', error);
              });
            
            console.log('Game started successfully');
            console.log('Clean output:', result.output);
            resolve(result);
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

    // Don't add general stdout listener - let sendCommand handle its own output
    // this.dfrotzProcess.stdout.on('data', (data) => {
    //   const output = data.toString();
    //   this.outputBuffer += output;
    //   console.log('Game output (raw):', JSON.stringify(output));
    // });

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
    // Extract game status (room, score, moves) before cleaning
    const statusMatch = rawOutput.match(/^\s*(.+?)\s+Score:\s*(\d+)\s+Moves:\s*(\d+)\s*$/gm);
    let gameStatus = null;
    
    if (statusMatch && statusMatch.length > 0) {
      const lastStatus = statusMatch[statusMatch.length - 1];
      const match = lastStatus.match(/^\s*(.+?)\s+Score:\s*(\d+)\s+Moves:\s*(\d+)\s*$/);
      if (match) {
        gameStatus = {
          room: match[1].trim(),
          score: parseInt(match[2]),
          moves: parseInt(match[3])
        };
      }
    }

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
      // Remove command echo lines (starts with >)
      .replace(/^>\s*.*$/gm, '')
      // Remove prompt characters at the end
      .replace(/>\s*$/, '')
      // Remove multiple consecutive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove extra whitespace at start/end of lines
      .replace(/^\s+|\s+$/gm, '')
      // Trim whitespace
      .trim();
    
    return { output: cleaned, gameStatus };
  }

  async sendCommand(command, graphicsMode = 'fantasy') {
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
          const result = this.cleanOutput(this.outputBuffer);
          
          this.gameHistory.push({
            type: 'command',
            command: command,
            output: result.output,
            gameStatus: result.gameStatus,
            timestamp: new Date().toISOString()
          });

          // Only generate media if room has changed
          const newRoom = result.gameStatus?.room;
          if (newRoom && newRoom !== this.currentRoom) {
            console.log(`Room changed from "${this.currentRoom}" to "${newRoom}" - generating new media in ${graphicsMode} style`);
            this.currentRoom = newRoom;
            
            // Generate image
            this.generateImageForOutput(result.output, result.gameStatus, { type: 'command', command: command, graphicsMode: graphicsMode })
              .catch(error => {
                console.error('Error generating command image:', error);
              });
            
            // Generate music
            this.generateMusicForOutput(result.output, result.gameStatus, { type: 'command', command: command })
              .catch(error => {
                console.error('Error generating command music:', error);
              });
          } else {
            console.log(`Same room "${this.currentRoom}" - skipping media generation`);
          }

          this.currentState = result.output;
          this.isProcessingCommand = false;
          this.processCommandQueue();
          console.log(`Command "${command}" completed. Clean output:`, result.output);
          resolve(result);
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

  async resetGame(graphicsMode = 'fantasy') {
    console.log('Resetting game...');
    
    // Kill existing process if any
    await this.killProcess();

    // Reset state
    this.gameHistory = [];
    this.currentState = '';
    this.outputBuffer = '';
    this.commandQueue = [];
    this.isProcessingCommand = false;
    this.currentRoom = null; // Reset room tracking

    // Restart the game with graphics mode
    return await this.startGame(graphicsMode);
  }

  async killProcess() {
    if (this.dfrotzProcess) {
      console.log('Killing dfrotz process...');
      
      return new Promise((resolve) => {
        const process = this.dfrotzProcess;
        this.dfrotzProcess = null;
        
        // Set up cleanup timeout
        const timeout = setTimeout(() => {
          console.log('Force killing dfrotz process...');
          try {
            process.kill('SIGKILL');
          } catch (error) {
            console.error('Error force killing process:', error);
          }
          resolve();
        }, 2000);
        
        // Handle graceful shutdown
        process.on('close', () => {
          clearTimeout(timeout);
          console.log('dfrotz process closed gracefully');
          resolve();
        });
        
        process.on('error', (error) => {
          clearTimeout(timeout);
          console.error('Error during process shutdown:', error);
          resolve();
        });
        
        // Try graceful shutdown first
        try {
          process.kill('SIGTERM');
        } catch (error) {
          clearTimeout(timeout);
          console.error('Error sending SIGTERM:', error);
          resolve();
        }
      });
    }
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
    
    await this.killProcess();
    
    // Reset all state
    this.gameHistory = [];
    this.currentState = '';
    this.outputBuffer = '';
    this.commandQueue = [];
    this.isProcessingCommand = false;
    this.isInitialized = false;
    this.currentRoom = null;
    
    console.log('Game engine cleanup complete');
  }

  /**
   * Extract meaningful scene description from game output
   */
  extractSceneDescription(gameOutput) {
    // Remove command echoes and status lines
    let description = gameOutput
      .replace(/^>.*$/gm, '') // Remove command lines
      .replace(/.*Score:\s*\d+\s*Moves:\s*\d+.*$/gm, '') // Remove status lines
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();

    // Take first meaningful paragraph as scene description
    const paragraphs = description.split('\n\n').filter(p => p.trim().length > 20);
    return paragraphs[0] || description;
  }

  /**
   * Create a detailed prompt for image generation
   */
  createImagePrompt(sceneDescription, gameStatus = null, graphicsMode = 'fantasy') {
    // Define different styles based on graphics mode (matching UX options)
    const styleMap = {
      'fantasy': "fantasy adventure game art, retro 1980s text adventure style, detailed illustration, atmospheric lighting, mysterious and adventurous mood, magical elements, medieval fantasy",
      'realistic': "photorealistic art, natural lighting, realistic textures, modern photography style, detailed environments, lifelike rendering",
      'pixelart': "pixel art style, 8-bit retro gaming aesthetic, blocky pixels, classic video game art, nostalgic computer graphics, low resolution charm",
      'sketch': "pencil sketch art, hand-drawn illustration, sketchy lines, artistic drawing style, charcoal and graphite techniques, monochrome sketching"
    };
    
    const styleDescription = styleMap[graphicsMode] || styleMap['fantasy'];
    const baseStyle = `${styleDescription}, wide landscape composition, panoramic view`;
    
    // Extract location from game status if available
    const location = gameStatus?.room || "mysterious location";
    
    // Create descriptive prompt with clear instructions
    const prompt = `Generate an image for this scene: ${sceneDescription} (Location: ${location}). Use this artistic style: ${styleDescription}. Create a wide horizontal landscape format, panoramic view. No text or UI elements.`;
    
    return prompt.substring(0, 1000); // DALL-E has prompt length limits
  }

  /**
   * Generate image for game output
   */
  async generateImageForOutput(gameOutput, gameStatus = null, context = null) {
    if (!this.imageService.isAvailable()) {
      console.log('Image generation not available');
      return null;
    }

    try {
      // Extract scene description and create prompt immediately
      const sceneDescription = this.extractSceneDescription(gameOutput);
      const graphicsMode = context?.graphicsMode || 'fantasy';
      const prompt = this.createImagePrompt(sceneDescription, gameStatus, graphicsMode);
      
      console.log('=== IMAGE GENERATION ===');
      console.log('Graphics mode:', graphicsMode);
      console.log('Generated prompt:', prompt);
      console.log('========================');
      
      // Notify about prompt immediately
      if (this.onImageGenerated) {
        this.onImageGenerated({
          type: context?.type || 'unknown',
          command: context?.command,
          promptReady: true,
          prompt: prompt,
          sceneDescription: sceneDescription,
          output: gameOutput,
          gameStatus: gameStatus,
          graphicsMode: graphicsMode
        });
      }

      const imageData = await this.imageService.generateImage(gameOutput, gameStatus);
      if (imageData) {
        console.log('Image generated for game output');
        
        // Notify about completed image
        if (this.onImageGenerated) {
          this.onImageGenerated({
            type: context?.type || 'unknown',
            command: context?.command,
            imageData: imageData,
            output: gameOutput,
            gameStatus: gameStatus
          });
        }
        
        return imageData;
      }
    } catch (error) {
      console.error('Error in generateImageForOutput:', error);
    }
    
    return null;
  }

  /**
   * Generate music for game output
   */
  async generateMusicForOutput(gameOutput, gameStatus = null, context = null) {
    if (!this.musicService.isAvailable()) {
      console.log('Music generation not available');
      return null;
    }

    try {
      console.log('=== MUSIC GENERATION ===');
      console.log('Room:', gameStatus?.room || 'unknown');
      console.log('Context type:', context?.type || 'unknown');
      console.log('========================');
      
      // Extract scene description and create prompt immediately
      const sceneDescription = this.musicService.extractSceneDescription(gameOutput);
      const musicPrompt = this.musicService.createMusicPrompt(sceneDescription, gameStatus);
      
      // Notify about music generation starting with prompt
      if (this.onMusicGenerated) {
        this.onMusicGenerated({
          type: context?.type || 'unknown',
          command: context?.command,
          generationStarted: true,
          prompt: musicPrompt,
          sceneDescription: sceneDescription,
          output: gameOutput,
          gameStatus: gameStatus
        });
      }

      const musicData = await this.musicService.generateMusic(gameOutput, gameStatus);
      if (musicData) {
        console.log('Music generated for game output');
        
        // Notify about completed music
        if (this.onMusicGenerated) {
          this.onMusicGenerated({
            type: context?.type || 'unknown',
            command: context?.command,
            musicData: musicData,
            output: gameOutput,
            gameStatus: gameStatus
          });
        }
        
        return musicData;
      }
    } catch (error) {
      console.error('Error in generateMusicForOutput:', error);
    }
    
    return null;
  }

  /**
   * Set callback for when images are generated
   */
  setImageGeneratedCallback(callback) {
    this.onImageGenerated = callback;
  }

  /**
   * Set callback for when music is generated
   */
  setMusicGeneratedCallback(callback) {
    this.onMusicGenerated = callback;
  }
}

module.exports = ZorkGameEngine;