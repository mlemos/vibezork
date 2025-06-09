import React, { useState, useEffect, useRef } from 'react';
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
  const isMutedRef = useRef(false);
  const [graphicsMode, setGraphicsMode] = useState('pixelart');
  const [autoplaySpeed, setAutoplaySpeed] = useState(2); // seconds between moves
  const [isAIThinking, setIsAIThinking] = useState(false);
  const autoplayRef = useRef(false); // Use ref to track autoplay state for closures
  const graphicsModeRef = useRef('pixelart'); // Use ref to track graphics mode for closures
  const [gameStatus, setGameStatus] = useState(null);
  const previousRoomRef = useRef(null); // Track previous room for delay calculation
  const roomJustChangedRef = useRef(false); // Flag for room change delay
  const [currentImage, setCurrentImage] = useState(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentMusic, setCurrentMusic] = useState(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const audioRef1 = useRef(null); // Primary audio element
  const audioRef2 = useRef(null); // Secondary audio element for crossfading
  const [activeAudioRef, setActiveAudioRef] = useState(1); // Track which audio element is active

  // Keep ref in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
        // Check for room change before updating
        const newRoom = data.gameStatus.room;
        const previousRoom = previousRoomRef.current;
        
        if (newRoom && previousRoom && newRoom !== previousRoom) {
          console.log('Room changed detected:', previousRoom, '→', newRoom);
          roomJustChangedRef.current = true;
        }
        
        setGameStatus(data.gameStatus);
        // Update previous room tracking
        if (newRoom) {
          previousRoomRef.current = newRoom;
        }
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
        // Update previous room tracking for game reset
        if (data.gameStatus.room) {
          previousRoomRef.current = data.gameStatus.room;
          roomJustChangedRef.current = false; // Reset flag on game reset
        }
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

    gameService.onAIPrompt((data) => {
      console.log('AI prompt received in App:', data.prompt.length, 'characters');
      setAiThoughts(prev => [
        ...prev,
        '🤖 AI analyzing game state...',
        `📤 Prompt sent to OpenAI (${data.prompt.length} chars): "${data.prompt}"`
      ]);
    });

    gameService.onAIResponse((data) => {
      console.log('AI response received in App:', data.response.length, 'characters');
      setAiThoughts(prev => [
        ...prev,
        `📥 OpenAI Response (${data.response.length} chars): "${data.response}"`
      ]);
    });

    gameService.onMusicGenerated((data) => {
      console.log('🎵 Music generated event received in App:', data);
      
      if (data.generationStarted) {
        // Show music generation starting
        console.log('Music generation started for:', data.gameStatus?.room);
        setIsGeneratingMusic(true);
        setAiThoughts(prev => [
          ...prev,
          `🎵 Generating background music for ${data.gameStatus?.room || 'current area'}...`,
          `🎼 Music Prompt: "${data.prompt}"`
        ]);
      } else if (data.musicData && data.musicData.url) {
        // Music generation completed
        console.log('Music generation completed. URL:', data.musicData.url);
        setCurrentMusic(data.musicData.url);
        setIsGeneratingMusic(false);
        setAiThoughts(prev => [
          ...prev, 
          `✅ Background music generated for ${data.musicData.room}`,
          `🎵 Music URL: ${data.musicData.url}`
        ]);
        
        // Always try to play music - let playMusic handle mute checking
        console.log('Music generated, attempting playback');
        if (audioRef1.current && audioRef2.current) {
          playMusic(data.musicData.url);
        } else {
          console.log('Not playing music: no audio refs');
        }
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
    console.log('AI Move requested with current graphics mode:', graphicsModeRef.current);
    setAiThoughts(prev => [...prev, 'AI thinking...']);
    setIsGeneratingImage(true); // Start loading state for image
    
    try {
      if (isConnected) {
        // Request AI move via WebSocket with CURRENT graphics mode from ref
        await gameService.requestAIMove(graphicsModeRef.current);
      } else {
        // Fallback to local test mode
        setGameOutput(prev => [...prev, 'AI Move requested (no server connection)']);
        setIsGeneratingImage(false);
      }
    } catch (error) {
      console.error('Error requesting AI move:', error);
      setGameOutput(prev => [...prev, `❌ Error requesting AI move: ${error.message}`]);
      setIsGeneratingImage(false);
      throw error; // Re-throw for autoplay error handling
    }
  };

  const executeNextAIMove = async () => {
    console.log('executeNextAIMove called, autoplayRef.current:', autoplayRef.current);
    if (!autoplayRef.current) {
      console.log('Autoplay stopped - autoplayRef.current is false');
      return; // Stop if autoplay was turned off
    }
    
    try {
      console.log('Calling handleAIMove with current graphics mode:', graphicsModeRef.current);
      
      // Use current graphics mode state at execution time
      setAiThoughts(prev => [...prev, 'AI thinking...']);
      setIsGeneratingImage(true); // Start loading state for image
      
      if (isConnected) {
        // Request AI move via WebSocket with CURRENT graphics mode from ref
        await gameService.requestAIMove(graphicsModeRef.current);
      } else {
        // Fallback to local test mode
        setGameOutput(prev => [...prev, 'AI Move requested (no server connection)']);
        setIsGeneratingImage(false);
      }
      
      // Check if room just changed using flag
      const roomChanged = roomJustChangedRef.current;
      const delayMultiplier = roomChanged ? 3 : 1;
      const actualDelay = autoplaySpeed * delayMultiplier;
      
      console.log('AI move completed, room changed:', roomChanged, 'scheduling next move in', actualDelay, 'seconds');
      
      // Reset flag after using it
      roomJustChangedRef.current = false;
      
      // Schedule next move only after current one finishes
      setTimeout(() => {
        console.log('Timeout fired, calling executeNextAIMove again, autoplayRef.current:', autoplayRef.current);
        executeNextAIMove(); // Recursive call
      }, actualDelay * 1000);
      
    } catch (error) {
      console.error('Autoplay stopped due to error:', error);
      autoplayRef.current = false;
      setIsAIPlaying(false); // Stop autoplay on error
      setAiThoughts(prev => [...prev, `⏸️ Autoplay paused: ${error.message}`]);
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
    const newState = !isAIPlaying;
    console.log('AI Toggle clicked, new state:', newState);
    setIsAIPlaying(newState);
    autoplayRef.current = newState; // Update ref immediately
    
    if (newState) {
      // Start autoplay
      console.log('Starting autoplay with speed:', autoplaySpeed);
      setAiThoughts(prev => [...prev, `▶️ AI autoplay started (${autoplaySpeed}s delay)`]);
      executeNextAIMove(); // Start first move immediately
    } else {
      // Stop autoplay
      console.log('Stopping autoplay');
      setAiThoughts(prev => [...prev, '⏸️ AI autoplay paused']);
    }
  };

  const handleMuteToggle = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    isMutedRef.current = newMuteState;
    setAiThoughts(prev => [...prev, `Audio ${newMuteState ? 'muted' : 'unmuted'}`]);
    
    // Handle music playback based on mute state using volume control
    if (audioRef1.current && audioRef2.current) {
      const targetVolume = newMuteState ? 0 : 0.3;
      audioRef1.current.volume = targetVolume;
      audioRef2.current.volume = targetVolume;
      console.log('Music', newMuteState ? 'muted' : 'unmuted', 'via volume control');
    }
  };

  const handleGraphicsModeChange = (mode) => {
    setGraphicsMode(mode);
    graphicsModeRef.current = mode; // Update ref for closure access
    setAiThoughts(prev => [...prev, `Graphics mode changed to ${mode}`]);
    
    // Immediately update backend graphics mode
    gameService.updateGraphicsMode(mode);
  };

  const handleAutoplaySpeedChange = (speed) => {
    setAutoplaySpeed(speed);
    setAiThoughts(prev => [...prev, `AI autoplay speed set to ${speed} seconds`]);
  };

  const playMusic = (musicUrl) => {
    if (!audioRef1.current || !audioRef2.current || !musicUrl) {
      console.log('Missing audio refs or music URL:', { 
        audioRef1: !!audioRef1.current, 
        audioRef2: !!audioRef2.current, 
        musicUrl 
      });
      return;
    }

    // Check current mute state when actually playing
    if (isMutedRef.current) {
      console.log('Music is muted - not starting playback');
      return;
    }

    try {
      console.log('Starting crossfade to new music:', musicUrl);
      
      // Determine which audio element to use for new track
      const currentAudioRef = activeAudioRef === 1 ? audioRef1.current : audioRef2.current;
      const newAudioRef = activeAudioRef === 1 ? audioRef2.current : audioRef1.current;
      
      // Set up new track
      newAudioRef.src = musicUrl;
      newAudioRef.loop = true;
      newAudioRef.volume = 0; // Start at 0 for crossfade
      
      newAudioRef.addEventListener('canplay', () => {
        console.log('New music ready, starting crossfade');
        crossfadeMusic(currentAudioRef, newAudioRef);
      }, { once: true });
      
      newAudioRef.addEventListener('error', (e) => {
        console.error('New music error:', e);
        setAiThoughts(prev => [...prev, `❌ Failed to load new music`]);
      });
      
      newAudioRef.load(); // Trigger loading
      
    } catch (error) {
      console.error('Error setting up music crossfade:', error);
    }
  };

  const crossfadeMusic = (fromAudio, toAudio) => {
    const crossfadeDuration = 2000; // 2 seconds
    const steps = 50;
    const stepDuration = crossfadeDuration / steps;
    const volumeStep = 0.3 / steps; // Max volume is 0.3
    
    let currentStep = 0;
    
    // Start playing new track
    toAudio.play().catch(error => {
      console.error('Failed to play new music:', error);
      return;
    });
    
    const crossfadeInterval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      // Fade out current track
      if (fromAudio && !fromAudio.paused) {
        fromAudio.volume = Math.max(0, (1 - progress) * (isMutedRef.current ? 0 : 0.3));
      }
      
      // Fade in new track
      toAudio.volume = Math.min(isMutedRef.current ? 0 : 0.3, progress * (isMutedRef.current ? 0 : 0.3));
      
      if (currentStep >= steps) {
        clearInterval(crossfadeInterval);
        
        // Stop and reset old track
        if (fromAudio && !fromAudio.paused) {
          fromAudio.pause();
          fromAudio.currentTime = 0;
          fromAudio.volume = 0;
        }
        
        console.log('Crossfade complete');
        setActiveAudioRef(activeAudioRef === 1 ? 2 : 1);
        setAiThoughts(prev => [...prev, `🎵 Now playing background music ${isMuted ? '(muted)' : ''}`]);
      }
    }, stepDuration);
  };

  const stopMusic = () => {
    if (audioRef1.current && audioRef2.current) {
      console.log('Stopping all music');
      
      [audioRef1.current, audioRef2.current].forEach(audio => {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0;
        }
      });
      
      console.log('All music stopped');
    } else {
      console.log('No audio elements to stop');
    }
  };

  return (
    <div className="app-container">
      {/* Hidden audio elements for crossfading background music */}
      <audio ref={audioRef1} preload="auto" />
      <audio ref={audioRef2} preload="auto" />
      
      <div className="status-bar">
        <span className="status brand-title">
          <a href="https://github.com/mlemos/vibezork" target="_blank" rel="noopener noreferrer">VibeZork</a> <span className="byline">(by <a href="https://manoellemos.com" target="_blank" rel="noopener noreferrer">@mlemos</a>)</span>
        </span>
        <div className="status-indicators">
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
      </div>
      <div className="app-grid">
        <VibeZorkPanel 
          className="vibezork-panel" 
          gameOutput={gameOutput}
          gameStatus={gameStatus}
          currentImage={currentImage}
          isGeneratingImage={isGeneratingImage}
          onCommand={handleCommand}
          disabled={isAIPlaying}
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
            onAutoplaySpeedChange={handleAutoplaySpeedChange}
            isAIPlaying={isAIPlaying}
            isMuted={isMuted}
            graphicsMode={graphicsMode}
            autoplaySpeed={autoplaySpeed}
          />
        </div>
      </div>
    </div>
  );
};

export default App;