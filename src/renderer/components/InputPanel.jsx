import React, { useState } from 'react';

const InputPanel = ({ onCommand, disabled }) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (command.trim() && !disabled) {
      onCommand(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="input-panel">
      <div className="input-header">
        <h3>Command Input</h3>
      </div>
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
      <div className="input-help">
        <small>
          Phase 1 Test: Type any command to test the interface
        </small>
      </div>
    </div>
  );
};

export default InputPanel;