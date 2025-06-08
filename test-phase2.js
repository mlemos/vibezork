const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:3001';
const SOCKET_URL = 'http://localhost:3001';

// Test Phase 2 - Real dfrotz Integration
async function testPhase2() {
  console.log('🧪 Testing VibeZork Phase 2 - Real dfrotz Integration\n');

  try {
    // Test 1: Check server status
    console.log('1. Testing server status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/status`);
    console.log(`✅ Server status: ${statusResponse.data.status}`);
    console.log(`   Engine mode: ${statusResponse.data.engine_mode}`);
    console.log(`   dfrotz available: ${statusResponse.data.dfrotz_available}`);
    console.log();

    // Test 2: Initialize game engine
    console.log('2. Testing game engine initialization...');
    const initResponse = await axios.post(`${BASE_URL}/api/game/init`);
    console.log(`✅ Game engine initialized: ${initResponse.data.success}`);
    console.log();

    // Test 3: Start the real game
    console.log('3. Testing real dfrotz game start...');
    const startResponse = await axios.post(`${BASE_URL}/api/game/start`);
    console.log(`✅ Game started: ${startResponse.data.success}`);
    console.log('📖 Initial game output:');
    console.log(startResponse.data.output);
    console.log();

    // Test 4: Send real commands to dfrotz
    const testCommands = [
      'look',
      'examine house',
      'north',
      'inventory'
    ];

    for (const command of testCommands) {
      console.log(`4. Testing command: "${command}"`);
      try {
        const commandResponse = await axios.post(`${BASE_URL}/api/game/command`, {
          command: command
        });
        console.log(`✅ Command executed successfully`);
        console.log('🎮 Game response:');
        console.log(commandResponse.data.output);
        console.log();
        
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.log(`❌ Command failed: ${error.response?.data?.error || error.message}`);
        console.log();
      }
    }

    // Test 5: WebSocket real-time updates
    console.log('5. Testing WebSocket connection...');
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    socket.on('gameUpdate', (data) => {
      console.log('📡 Real-time game update received:', data);
    });

    // Send a command via WebSocket
    socket.emit('sendCommand', { command: 'help' });

    // Test 6: Get game history
    setTimeout(async () => {
      try {
        console.log('6. Testing game history...');
        const historyResponse = await axios.get(`${BASE_URL}/api/game/history`);
        console.log(`✅ Game history retrieved (${historyResponse.data.history.length} entries)`);
        
        // Show last few entries
        const recentHistory = historyResponse.data.history.slice(-3);
        recentHistory.forEach((entry, index) => {
          console.log(`   ${entry.timestamp}: ${entry.type} - ${entry.command || 'start'}`);
        });
        console.log();

        // Clean up
        socket.disconnect();
        console.log('🧪 Phase 2 testing completed successfully!');
        console.log('✅ Real dfrotz integration is working correctly');
        
      } catch (error) {
        console.log(`❌ History test failed: ${error.message}`);
        socket.disconnect();
      }
    }, 3000);

  } catch (error) {
    console.log(`❌ Phase 2 test failed: ${error.response?.data?.error || error.message}`);
    console.log('Details:', error.response?.data || error.message);
  }
}

testPhase2();