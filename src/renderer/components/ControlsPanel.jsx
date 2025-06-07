import React from 'react';

const ControlsPanel = ({ 
  onReset, 
  onAIToggle, 
  onMuteToggle, 
  onGraphicsModeChange,
  isAIPlaying,
  isMuted,
  graphicsMode 
}) => {
  return (
    <div className="controls-panel">
      <div className="controls-group">
        <button 
          onClick={onReset}
          className="control-button reset-button"
          title="Reset the game to start over"
        >
          🔄 Reset Game
        </button>
        
        <button 
          onClick={onAIToggle}
          className={`control-button ai-button ${isAIPlaying ? 'active' : ''}`}
          title={isAIPlaying ? 'Pause AI player' : 'Let AI play the game'}
        >
          {isAIPlaying ? '⏸️ Pause AI' : '▶️ Play AI'}
        </button>
        
        <button 
          onClick={onMuteToggle}
          className={`control-button mute-button ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
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
          <option value="fantasy">🏰 Fantasy Style</option>
          <option value="realistic">📷 Realistic</option>
          <option value="pixelart">🎮 Pixel Art</option>
          <option value="sketch">✏️ Sketch</option>
        </select>
      </div>
    </div>
  );
};

export default ControlsPanel;