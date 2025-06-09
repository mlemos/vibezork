import React from 'react';

const ControlsPanel = ({ 
  onReset, 
  onAIToggle, 
  onMuteToggle, 
  onGraphicsModeChange,
  onAIMove,
  onAutoplaySpeedChange,
  isAIPlaying,
  isMuted,
  graphicsMode,
  autoplaySpeed 
}) => {
  return (
    <div className="controls-panel">
      <div className="controls-group">
        <button 
          onClick={onReset}
          className="control-button reset-button"
          title="Reset the game to start over"
        >
          🔄 (Re)Start Game
        </button>
        
        <div className="ai-controls-row">
          <button 
            onClick={onAIToggle}
            className={`control-button ai-button ${isAIPlaying ? 'active' : ''}`}
            title={isAIPlaying ? 'Pause AI player' : 'Let AI play the game'}
          >
            {isAIPlaying ? '⏸️ Pause AI' : '▶️ Start AI'}
          </button>
          
          <button 
            onClick={onAIMove}
            className="control-button ai-move-button"
            title="Let AI make the next move"
          >
            🤖 AI Move
          </button>
        </div>
        
        <button 
          onClick={onMuteToggle}
          className={`control-button mute-button ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>
      
      <div className="autoplay-controls">
        <label htmlFor="autoplay-speed" className="autoplay-label">
          AI Speed: {autoplaySpeed}s
        </label>
        <input
          id="autoplay-speed"
          type="range"
          min="1"
          max="10"
          value={autoplaySpeed}
          onChange={(e) => onAutoplaySpeedChange(Number(e.target.value))}
          className="autoplay-slider"
          disabled={isAIPlaying}
        />
      </div>
      
      <div className="graphics-controls">
        <label htmlFor="graphics-mode" className="graphics-label">
          Graphics Style:
        </label>
        <select 
          id="graphics-mode"
          value={graphicsMode} 
          onChange={(e) => onGraphicsModeChange(e.target.value)}
          className="graphics-select"
        >
          <option value="pixelart">🎮 Pixel Art</option>
          <option value="fantasy">🏰 Fantasy</option>
          <option value="realistic">📷 Photorealistic</option>
          <option value="cartoonish">🎨 Cartoonish</option>
          <option value="ghibli">🌸 Ghibli</option>
        </select>
      </div>
    </div>
  );
};

export default ControlsPanel;