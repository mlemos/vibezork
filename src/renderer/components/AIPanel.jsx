import React from 'react';

const AIPanel = ({ aiThoughts, isThinking }) => {
  return (
    <div className="ai-panel">
      <div className="panel-header">
        <h3>AI Assistant</h3>
      </div>
      <div className="ai-content">
        <div className="ai-thoughts">
          {aiThoughts.map((thought, index) => (
            <div key={index} className="thought-item">
              <span className="thought-timestamp">
                {new Date().toLocaleTimeString()}
              </span>
              <div className="thought-text">{thought}</div>
            </div>
          ))}
        </div>
        {isThinking && (
          <div className="thinking-indicator">
            <div className="thinking-dots">
              <span>•</span>
              <span>•</span>
              <span>•</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;