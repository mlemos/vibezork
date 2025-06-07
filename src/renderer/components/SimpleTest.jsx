import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#4caf50' }}>VibeZork - Simple Test</h1>
      <p>✅ React is working!</p>
      <p>✅ Components are rendering!</p>
      <p>✅ Styles are applied!</p>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '2fr 1fr 100px',
        gap: '10px',
        height: '60vh',
        marginTop: '20px'
      }}>
        <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
          <h3>VibeZork Panel</h3>
          <p>Graphics would go here</p>
          <div style={{ backgroundColor: '#1e1e1e', padding: '10px', marginTop: '10px' }}>
            <p>Game output would go here</p>
          </div>
        </div>
        
        <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
          <h3>AI Panel</h3>
          <p>AI thoughts would go here</p>
        </div>
        
        <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
          <h3>Input Panel</h3>
          <input 
            type="text" 
            placeholder="Enter command..."
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#1e1e1e',
              border: '1px solid #555',
              color: '#e0e0e0',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '15px', 
          borderRadius: '8px',
          gridColumn: '1 / -1'
        }}>
          <h3>Controls Panel</h3>
          <button style={{
            padding: '10px 15px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}>
            Reset Game
          </button>
          <button style={{
            padding: '10px 15px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}>
            AI Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;