# VibeZork

VibeZork is an Electron application where users can play Zork, the classic text-based adventure game, enhanced with AI-generated graphics and music.

## Phase 1 - Core Infrastructure ✅

Phase 1 implements the foundational components:

- ✅ Electron + React project structure
- ✅ Backend server with dfrotz integration 
- ✅ WebSocket communication between frontend and backend
- ✅ 4-panel UI layout (VibeZork, Input, AI, Controls)
- ✅ Mock game engine for testing without dfrotz installation

## Quick Start

### Install Dependencies
```bash
npm install
```

### Test Phase 1 Backend
```bash
node test-phase1.js
```

### Run the Full Application
```bash
npm run dev
```

This will start:
1. Backend server on port 3001
2. Webpack dev server on port 8080  
3. Electron app window

## Testing Phase 1

### Backend Tests
The `test-phase1.js` script verifies:
- Server startup and API endpoints
- Game engine mock responses
- WebSocket communication
- All CRUD operations for game state

### UI Testing
After running `npm run dev`:
1. Verify all 4 panels are visible
2. Test command input (try: "look", "inventory", "help")
3. Check AI panel shows command history
4. Verify controls work (reset, mode switching)
5. Confirm connection status in status bar

## Architecture

### Backend (`src/backend/`)
- `server.js` - Express server with WebSocket support
- `gameEngine.js` - dfrotz wrapper with mock fallback

### Frontend (`src/renderer/`)
- `components/` - React components for each panel
- `services/gameService.js` - WebSocket client and API calls
- `styles/` - CSS Grid layout and styling

### Electron (`src/electron/`)
- `main.js` - Main process window management
- `preload.js` - Secure IPC communication

## Mock Mode

Phase 1 includes a mock game engine that simulates Zork responses without requiring dfrotz installation. This allows testing the complete system architecture.

## Next Phases

- Phase 2: Complete game integration with real dfrotz
- Phase 3: AI graphics generation 
- Phase 4: AI player functionality
- Phase 5: Audio generation and polish
