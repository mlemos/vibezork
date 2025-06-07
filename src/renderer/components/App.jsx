import React, { useState, useEffect } from 'react';
import VibeZorkPanel from './VibeZorkPanel';
import AIPanel from './AIPanel';
import ControlsPanel from './ControlsPanel';
import gameService from '../services/gameService';
import '../styles/layout.css';

const App = () => {
  const [gameOutput, setGameOutput] = useState(['Welcome to VibeZork! (Phase 1 - UI Layout Test)', 'Connecting to game server...']);
  const [isConnected, setIsConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Connecting...');
  const [aiThoughts, setAiThoughts] = useState(['AI Panel initialized (Phase 1)', 'Waiting for game integration...']);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [graphicsMode, setGraphicsMode] = useState('fantasy');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    // Set up game service callbacks
    gameService.onConnectionChange((connected) => {
      setIsConnected(connected);
      setBackendStatus(connected ? 'Connected to backend' : 'Disconnected from backend');
      
      if (connected) {
        setGameOutput(prev => [...prev, '✅ Connected to game server']);
        setAiThoughts(prev => [...prev, 'Connected to game server']);
      } else {
        setGameOutput(prev => [...prev, '❌ Lost connection to game server']);
        setAiThoughts(prev => [...prev, 'Lost connection to game server']);
      }
    });

    gameService.onGameOutput((data) => {
      console.log('Game output received in App:', data);
      if (data.command) {
        setGameOutput(prev => [...prev, `> ${data.command}`, data.output]);
      } else {
        setGameOutput(prev => [...prev, data.output]);
      }
      
      // Update game status if provided
      if (data.gameStatus) {
        setGameStatus(data.gameStatus);
      }

      // Note: Images now come via separate image-generated event
      
      setAiThoughts(prev => [...prev, `Game response: ${data.output.substring(0, 50)}...`]);
    });

    gameService.onGameReset((data) => {
      setGameOutput(['🔄 Game Reset', data.output]);
      setAiThoughts(prev => [...prev, 'Game was reset']);
      
      // Update game status if provided
      if (data.gameStatus) {
        setGameStatus(data.gameStatus);
      }

      // Note: Images now come via separate image-generated event
    });

    gameService.onError((error) => {
      setGameOutput(prev => [...prev, `❌ Error: ${error.message}`]);
      setAiThoughts(prev => [...prev, `Error occurred: ${error.message}`]);
    });

    gameService.onImageGenerated((data) => {
      console.log('Image generated received in App:', data);
      
      if (data.promptReady) {
        // Show prompt immediately when generation starts
        setAiThoughts(prev => [
          ...prev,
          `🎨 Generating ${data.type} scene image in ${graphicsMode} style...`,
          `Prompt: "${data.prompt}"`
        ]);
      } else if (data.imageData && data.imageData.url) {
        // Show completion when image is ready
        setCurrentImage(data.imageData.url);
        setIsGeneratingImage(false);
        setAiThoughts(prev => [
          ...prev, 
          `✅ ${data.type} scene image completed`
        ]);
      }
    });

    // Connect to game service
    gameService.connect();

    // Test server status
    const testConnection = async () => {
      try {
        const status = await gameService.getServerStatus();
        if (status.status === 'running') {
          setBackendStatus('Connected to backend');
          // Don't call connect() again - already connected from line 55
        }
      } catch (error) {
        setBackendStatus('Backend not connected');
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 5000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      gameService.disconnect();
    };
  }, []);

  const handleCommand = async (command) => {
    console.log('Command entered:', command);
    setAiThoughts(prev => [...prev, `User command: ${command}`]);
    setIsGeneratingImage(true); // Start loading state for image
    
    try {
      if (isConnected) {
        // Send via WebSocket for real-time response
        await gameService.sendCommand(command, graphicsMode);
      } else {
        // Fallback to local test mode
        setGameOutput(prev => [...prev, `> ${command}`, 'Command received (Phase 1 test - no server connection)']);
        setIsGeneratingImage(false);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setGameOutput(prev => [...prev, `❌ Error sending command: ${error.message}`]);
      setIsGeneratingImage(false);
    }
  };

  const handleAIMove = async () => {
    console.log('AI Move requested');
    setAiThoughts(prev => [...prev, 'AI thinking...']);
    setIsGeneratingImage(true); // Start loading state for image
    
    try {
      if (isConnected) {
        // Request AI move via WebSocket
        await gameService.requestAIMove();
      } else {
        // Fallback to local test mode
        setGameOutput(prev => [...prev, 'AI Move requested (no server connection)']);
        setIsGeneratingImage(false);
      }
    } catch (error) {
      console.error('Error requesting AI move:', error);
      setGameOutput(prev => [...prev, `❌ Error requesting AI move: ${error.message}`]);
      setIsGeneratingImage(false);
    }
  };

  const handleReset = async () => {
    setAiThoughts(prev => [...prev, 'Resetting game...']);
    setIsGeneratingImage(true); // Start loading state for image
    
    try {
      if (isConnected) {
        await gameService.resetGame(graphicsMode);
      } else {
        setGameOutput(['🔄 Game reset (Phase 1 test - no server connection)']);
        setIsGeneratingImage(false);
      }
    } catch (error) {
      console.error('Error resetting game:', error);
      setGameOutput(prev => [...prev, `❌ Error resetting game: ${error.message}`]);
      setIsGeneratingImage(false);
    }
  };

  const handleAIToggle = () => {
    setIsAIPlaying(!isAIPlaying);
    setAiThoughts(prev => [...prev, `AI player ${!isAIPlaying ? 'activated' : 'deactivated'}`]);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    setAiThoughts(prev => [...prev, `Audio ${!isMuted ? 'muted' : 'unmuted'}`]);
  };

  const handleGraphicsModeChange = (mode) => {
    setGraphicsMode(mode);
    setAiThoughts(prev => [...prev, `Graphics mode changed to ${mode}`]);
  };

  return (
    <div className="app-container">
      <div className="status-bar">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          Backend: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className={`status ${isAIThinking ? 'thinking' : 'ai-ready'}`}>
          AI: {isAIThinking ? 'Thinking' : 'Ready'}
        </span>
        <span className={`status ${isAIPlaying ? 'ai-active' : 'ai-idle'}`}>
          Auto: {isAIPlaying ? 'Playing' : 'Manual'}
        </span>
        <span className={`status ${!isMuted ? 'audio-on' : 'audio-off'}`}>
          Audio: {!isMuted ? 'On' : 'Off'}
        </span>
        <span className="status graphics-mode">
          GFX: {graphicsMode.toUpperCase()}
        </span>
      </div>
      <div className="app-grid">
        <VibeZorkPanel 
          className="vibezork-panel" 
          gameOutput={gameOutput}
          gameStatus={gameStatus}
          currentImage={currentImage}
          isGeneratingImage={isGeneratingImage}
          onCommand={handleCommand}
          disabled={false}
        />
        <div className="sidebar">
          <AIPanel 
            className="ai-panel" 
            aiThoughts={aiThoughts}
            isThinking={isAIThinking}
          />
          <ControlsPanel 
            className="controls-panel" 
            onReset={handleReset}
            onAIToggle={handleAIToggle}
            onMuteToggle={handleMuteToggle}
            onGraphicsModeChange={handleGraphicsModeChange}
            onAIMove={handleAIMove}
            isAIPlaying={isAIPlaying}
            isMuted={isMuted}
            graphicsMode={graphicsMode}
          />
        </div>
      </div>
    </div>
  );
};

export default App;