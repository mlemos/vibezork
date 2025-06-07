import React from 'react';

const VibeZorkPanel = ({ gameOutput, currentImage, isGeneratingImage, onCommand, disabled }) => {
  const [command, setCommand] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !disabled && onCommand) {
      onCommand(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="vibezork-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h3>VibeZork</h3>
      </div>

      {/* Graphics Section - 20% height */}
      <div className="graphics-section">
        {currentImage ? (
          <img src={currentImage} alt="Game scene" className="game-image" />
        ) : (
          <div className="placeholder-image">
            <div className="placeholder-content">
              {isGeneratingImage ? (
                <div className="loading-spinner">🎨 Generating graphics...</div>
              ) : (
                <div className="placeholder-text">
                  <h3>AI Graphics</h3>
                  <p>Generated images will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Game Output Section - Most of the space */}
      <div className="output-section">
        <div className="output-content">
          {gameOutput.map((line, index) => (
            <div key={index} className={`output-line ${line.startsWith('>') ? 'command' : 'response'}`}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Input Section - Bottom */}
      <div className="input-section">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={disabled}
              placeholder="Enter your command (e.g., 'look around', 'go north')"
              className="command-input"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={disabled || !command.trim()}
              className="send-button"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VibeZorkPanel;