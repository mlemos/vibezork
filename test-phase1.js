#!/usr/bin/env node

/**
 * Phase 1 Test Script for VibeZork
 * 
 * This script tests that all Phase 1 components are working:
 * 1. Backend server can start and respond to API calls
 * 2. Mock game engine functions correctly
 * 3. WebSocket communication works
 * 4. All endpoints respond correctly
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');
const { io } = require('socket.io-client');

class Phase1Tester {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      serverStart: false,
      apiStatus: false,
      gameStart: false,
      gameCommand: false,
      gameReset: false,
      websocket: false
    };
  }

  async runTests() {
    console.log('🚀 Starting Phase 1 Tests for VibeZork\n');

    try {
      // Test 1: Start the backend server
      await this.testServerStart();
      
      // Wait for server to initialize
      await this.sleep(2000);
      
      // Test 2: Check server status
      await this.testServerStatus();
      
      // Test 3: Test game start
      await this.testGameStart();
      
      // Test 4: Test game commands
      await this.testGameCommands();
      
      // Test 5: Test game reset
      await this.testGameReset();
      
      // Test 6: Test WebSocket connection
      await this.testWebSocket();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.cleanup();
    }
  }

  async testServerStart() {
    console.log('📡 Test 1: Starting backend server...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['src/backend/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('   Server:', output.trim());
        
        if (output.includes('VibeZork server running')) {
          this.testResults.serverStart = true;
          console.log('✅ Server started successfully\n');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.log('   Server Error:', data.toString().trim());
      });

      this.serverProcess.on('error', (error) => {
        console.log('❌ Failed to start server:', error.message);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.testResults.serverStart) {
          console.log('❌ Server start timeout\n');
          reject(new Error('Server start timeout'));
        }
      }, 10000);
    });
  }

  async testServerStatus() {
    console.log('🔍 Test 2: Checking server status...');
    
    try {
      const response = await fetch('http://localhost:3001/api/status');
      const data = await response.json();
      
      if (response.ok && data.status === 'running') {
        this.testResults.apiStatus = true;
        console.log('✅ Server status API working');
        console.log(`   Status: ${data.status}`);
        console.log(`   Game running: ${data.game.isRunning}`);
        console.log('');
      } else {
        console.log('❌ Server status API failed');
      }
    } catch (error) {
      console.log('❌ Server status API error:', error.message);
    }
  }

  async testGameStart() {
    console.log('🎮 Test 3: Starting game...');
    
    try {
      const response = await fetch('http://localhost:3001/api/game/start', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.testResults.gameStart = true;
        console.log('✅ Game start API working');
        console.log('   Game output preview:', data.output.substring(0, 100) + '...');
        console.log('');
      } else {
        console.log('❌ Game start API failed:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Game start API error:', error.message);
    }
  }

  async testGameCommands() {
    console.log('⌨️  Test 4: Testing game commands...');
    
    const testCommands = ['look', 'inventory', 'help'];
    
    for (const command of testCommands) {
      try {
        const response = await fetch('http://localhost:3001/api/game/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`   ✅ Command "${command}" successful`);
          this.testResults.gameCommand = true;
        } else {
          console.log(`   ❌ Command "${command}" failed`);
        }
      } catch (error) {
        console.log(`   ❌ Command "${command}" error:`, error.message);
      }
    }
    console.log('');
  }

  async testGameReset() {
    console.log('🔄 Test 5: Testing game reset...');
    
    try {
      const response = await fetch('http://localhost:3001/api/game/reset', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        this.testResults.gameReset = true;
        console.log('✅ Game reset API working');
        console.log('');
      } else {
        console.log('❌ Game reset API failed');
      }
    } catch (error) {
      console.log('❌ Game reset API error:', error.message);
    }
  }

  async testWebSocket() {
    console.log('🔌 Test 6: Testing WebSocket connection...');
    
    return new Promise((resolve) => {
      const socket = io('http://localhost:3001');
      
      socket.on('connect', () => {
        console.log('   ✅ WebSocket connected');
        
        // Test sending a command via WebSocket
        socket.emit('send-command', { command: 'look' });
      });

      socket.on('game-output', (data) => {
        console.log('   ✅ WebSocket game output received');
        this.testResults.websocket = true;
        socket.disconnect();
        console.log('');
        resolve();
      });

      socket.on('connect_error', (error) => {
        console.log('   ❌ WebSocket connection failed:', error.message);
        console.log('');
        resolve();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.testResults.websocket) {
          console.log('   ❌ WebSocket test timeout');
          socket.disconnect();
          console.log('');
        }
        resolve();
      }, 5000);
    });
  }

  printResults() {
    console.log('📊 Phase 1 Test Results');
    console.log('========================');
    
    const results = [
      { name: 'Server Start', status: this.testResults.serverStart },
      { name: 'API Status', status: this.testResults.apiStatus },
      { name: 'Game Start', status: this.testResults.gameStart },
      { name: 'Game Commands', status: this.testResults.gameCommand },
      { name: 'Game Reset', status: this.testResults.gameReset },
      { name: 'WebSocket', status: this.testResults.websocket }
    ];

    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
    });

    const passedTests = results.filter(r => r.status).length;
    const totalTests = results.length;
    
    console.log(`\n📈 Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All Phase 1 tests passed! Ready for Electron app testing.');
      console.log('\nNext steps:');
      console.log('1. Run "npm run dev" to start the full application');
      console.log('2. Test the UI with all 4 panels');
      console.log('3. Verify WebSocket communication in the app');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
  }

  cleanup() {
    if (this.serverProcess) {
      console.log('\n🧹 Cleaning up...');
      this.serverProcess.kill();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Check if node-fetch is available, if not provide instructions
async function checkDependencies() {
  try {
    require('node-fetch');
    return true;
  } catch (error) {
    console.log('❌ node-fetch not found. Installing...');
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', 'node-fetch@2'], { stdio: 'inherit' });
      npm.on('close', (code) => {
        if (code === 0) {
          console.log('✅ node-fetch installed successfully');
          resolve(true);
        } else {
          reject(new Error('Failed to install node-fetch'));
        }
      });
    });
  }
}

// Run the tests
async function main() {
  try {
    await checkDependencies();
    const tester = new Phase1Tester();
    await tester.runTests();
  } catch (error) {
    console.error('Failed to run tests:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}