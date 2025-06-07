import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import SimpleTest from './components/SimpleTest';
import './styles/index.css';

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('React app starting...');

try {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Root container not found');
  }
  
  console.log('Creating React root...');
  const root = createRoot(container);
  
  console.log('Rendering App component...');
  
  // For debugging, let's try a simple test first
  const useSimpleTest = window.location.search.includes('simple');
  
  if (useSimpleTest) {
    root.render(<SimpleTest />);
  } else {
    root.render(<App />);
  }
  
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Failed to start React app:', error);
  
  // Fallback display
  document.body.innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a1a; font-family: monospace;">
      <h1>VibeZork - Error</h1>
      <p>Failed to load React app: ${error.message}</p>
      <p>Check the console for more details.</p>
    </div>
  `;
}