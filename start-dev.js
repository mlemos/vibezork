#!/usr/bin/env node

const { spawn } = require('child_process');
const fetch = require('node-fetch');

class DevStarter {
  constructor() {
    this.processes = [];
  }

  async start() {
    console.log('🚀 Starting VibeZork Development Environment\n');

    try {
      // Step 1: Start backend server
      console.log('1️⃣ Starting backend server...');
      await this.startBackend();
      
      // Step 2: Start webpack dev server
      console.log('2️⃣ Starting webpack dev server...');
      await this.startWebpack();
      
      // Step 3: Wait for servers to be ready
      console.log('3️⃣ Waiting for servers to be ready...');
      await this.waitForServers();
      
      // Step 4: Start Electron
      console.log('4️⃣ Starting Electron app...');
      await this.startElectron();
      
      console.log('✅ All services started successfully!\n');
      console.log('Press Ctrl+C to stop all services');
      
    } catch (error) {
      console.error('❌ Failed to start development environment:', error);
      this.cleanup();
      process.exit(1);
    }
  }

  startBackend() {
    return new Promise((resolve, reject) => {
      const backend = spawn('node', ['src/backend/server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.push(backend);

      backend.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`   [Backend] ${output.trim()}`);
        
        if (output.includes('VibeZork server running')) {
          resolve();
        }
      });

      backend.stderr.on('data', (data) => {
        console.log(`   [Backend Error] ${data.toString().trim()}`);
      });

      backend.on('error', reject);

      setTimeout(() => reject(new Error('Backend startup timeout')), 10000);
    });
  }

  startWebpack() {
    return new Promise((resolve, reject) => {
      const webpack = spawn('npm', ['run', 'webpack:dev'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.processes.push(webpack);

      webpack.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`   [Webpack] ${output.trim()}`);
        
        if (output.includes('compiled successfully')) {
          setTimeout(resolve, 1000); // Give it a moment to be fully ready
        }
      });

      webpack.stderr.on('data', (data) => {
        console.log(`   [Webpack Error] ${data.toString().trim()}`);
      });

      webpack.on('error', reject);

      setTimeout(() => reject(new Error('Webpack startup timeout')), 30000);
    });
  }

  async waitForServers() {
    // Test backend
    console.log('   Testing backend server...');
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch('http://localhost:3001/api/status');
        if (response.ok) {
          console.log('   ✅ Backend server is ready');
          break;
        }
      } catch (error) {
        if (i === 9) throw new Error('Backend server not responding');
        await this.sleep(1000);
      }
    }

    // Test webpack dev server
    console.log('   Testing webpack dev server...');
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch('http://localhost:8080/');
        if (response.ok) {
          console.log('   ✅ Webpack dev server is ready');
          break;
        }
      } catch (error) {
        if (i === 9) throw new Error('Webpack dev server not responding');
        await this.sleep(1000);
      }
    }
  }

  startElectron() {
    return new Promise((resolve, reject) => {
      const electron = spawn('npx', ['electron', '.'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      });

      this.processes.push(electron);

      electron.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`   [Electron] ${output.trim()}`);
        
        if (output.includes('Window ready to show') || output.includes('Page loaded successfully')) {
          resolve();
        }
      });

      electron.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`   [Electron] ${output.trim()}`);
        
        // Don't treat warnings as errors, but resolve on successful start
        if (output.includes('ready-to-show') || output.includes('did-finish-load')) {
          resolve();
        }
      });

      electron.on('error', reject);

      // Auto-resolve after 10 seconds assuming Electron started
      setTimeout(() => {
        console.log('   🔄 Electron should be running (timeout reached)');
        resolve();
      }, 10000);
    });
  }

  cleanup() {
    console.log('\n🧹 Cleaning up processes...');
    this.processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill();
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  if (global.devStarter) {
    global.devStarter.cleanup();
  }
  process.exit(0);
});

// Start the development environment
const starter = new DevStarter();
global.devStarter = starter;
starter.start();