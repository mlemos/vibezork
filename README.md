# VibeZork

![VibeZork](vibezork.png)

VibeZork is an Electron application where users can play Zork, the classic text-based adventure game, enhanced with AI-generated graphics and background music. Experience the classic text adventure in a whole new way with immersive visuals and ambient soundscapes generated in real-time by AI.

## Features

- **Classic Zork Gameplay** - Full integration with the original Zork game via dfrotz.
- **AI-Generated Graphics** - Real-time scene visualization using Replicate's Flux-Schnell model.
- **AI Background Music** - Atmospheric music generation for each game location.
- **AI Autoplay Mode** - Watch AI play through the game automatically.
- **Multiple Graphics Styles** - Choose from pixel art, realistic, fantasy art, and more.

## Prerequisites

This instruction are for macOS, but it should be easy to adapt to other systems.

### Required Software
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **dfrotz** - Z-machine interpreter for playing Zork

### Installing dfrotz

**macOS (using Homebrew):**
```bash
brew install frotz
```

**Other systems:** Download from [David Kinder's website](https://www.davidkinder.co.uk/frotz.html)

### Zork Game File
You'll need the Zork I game file `zork1_sg.z5`.

Find it here: https://datadrivengamer.blogspot.com/2019/04/game-55-zork-i.html

Place the game file at `~/Downloads/zorkpack/zork1_sg.z5`.

The app expects this exact location.

But this is easy to change if you want to. 

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd vibezork
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up API Keys
Create a `.env` file in the root directory with your API keys:

```bash
# Required for AI features
REPLICATE_API_KEY=your_replicate_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Getting API Keys:**

**Replicate API Key:**
1. Sign up at [replicate.com](https://replicate.com)
2. Go to Account Settings → API Tokens
3. Create a new token

**OpenAI API Key:**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new API key


## Running the Application

### Start the Full Application
```bash
npm run dev
```

This command starts:
1. **Backend server** on port 3001 (Express + WebSocket)
2. **Webpack dev server** on port 8080 (React frontend)
3. **Electron app** window

### Alternative: Run Components Separately
```bash
# Terminal 1: Backend only
npm run backend

# Terminal 2: Frontend only  
npm run webpack:dev

# Terminal 3: Electron only (after frontend is ready)
npm run electron:dev
```

## How to Use VibeZork

### Loading Screen
1. **Click the loading screen** to start the game
2. Wait for the connection to establish

### Basic Gameplay
1. **Type commands** in the input field at the bottom of the main panel
2. **Press Enter** or click **Send** to execute commands
3. **Common commands:**
   - `look` - Examine your surroundings
   - `inventory` - Check what you're carrying
   - `north`, `south`, `east`, `west` - Move in directions
   - `take lamp` - Pick up objects
   - `open mailbox` - Interact with objects

### AI Features

**Graphics Generation:**
- Images generate automatically when you enter new locations
- Choose graphics style from dropdown: Pixel Art, Realistic, Fantasy Art, Watercolor, Sketch
- Images appear in the graphics section at the top

**Background Music:**
- Music generates automatically for each new room
- Toggle with the **Mute/Unmute** button
- Music crossfades smoothly between locations

**AI Autoplay:**
1. Click **AI Autoplay** to let AI play automatically
2. Adjust autoplay speed with the slider (1-10 seconds between moves)
3. Click **AI Single Move** for one AI action
4. Input is disabled during autoplay mode

### Controls Panel
- **Reset Game** - Restart Zork from the beginning
- **AI Autoplay** - Toggle automatic AI gameplay
- **AI Single Move** - Request one AI move
- **Mute/Unmute** - Control background music
- **Graphics Mode** - Select visual style for image generation
- **Autoplay Speed** - Adjust timing between AI moves

### Status Bar
Monitor real-time status:
- **Backend** - Connection to game server
- **AI** - AI thinking/ready status  
- **Auto** - Manual/autoplay mode
- **Audio** - Sound on/off
- **GFX** - Current graphics mode

### AI Panel
- View AI thoughts and decision-making process
- See image/music generation progress
- Monitor AI reasoning during autoplay

## Troubleshooting

### Common Issues

**"Backend not connected"**
- Ensure dfrotz is installed and in PATH
- Check that Zork game file exists at specified path
- Verify port 3001 is available

**"No API token" warnings**
- Add REPLICATE_API_KEY and OPENAI_API_KEY to `.env` file
- Restart the application after adding keys

**Images/Music not generating**
- Verify API keys are valid and have credits
- Check network connection
- View browser console for detailed error messages

**Game not responding**
- Try the **Reset Game** button
- Check that dfrotz process is running: `ps aux | grep dfrotz`
- Restart the application

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=true npm run dev
```

### Log Files
Check generated logs for debugging:
- `image-log.txt` - Image generation history
- `music-log.txt` - Music generation history

## Development

### Project Structure
```
src/
├── backend/           # Node.js server
│   ├── server.js     # Main server with WebSocket
│   ├── gameEngine.js # dfrotz integration
│   ├── imageService.js # AI image generation
│   └── musicService.js # AI music generation
├── electron/         # Electron main process
│   ├── main.js      # Window management
│   └── preload.js   # Security layer
└── renderer/         # React frontend
    ├── components/   # UI components
    ├── services/     # API clients
    └── styles/       # CSS styling
```

### Available Scripts
- `npm run dev` - Start full development environment
- `npm run backend` - Backend server only
- `npm run webpack:dev` - Frontend development server
- `npm run electron:dev` - Electron app only
- `npm run build` - Production build
- `npm test` - Run test suite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and entertainment purposes. Zork is a trademark of Activision. AI generation services are provided by Replicate and OpenAI.

## Credits

- **Original Zork** - Infocom (1980)
- **dfrotz** - Z-machine interpreter
- **AI Models** - Replicate (Flux-Schnell for images, MusicGen for audio), OpenAI (GPT-4)
- **Framework** - Electron, React, Node.js

## Special Thanks

Special thanks to **[Lukas Nel](https://github.com/LukasNel)** and **[Philippe Mallette](https://github.com/philippemallette)** for their support, hints and great company during the hackathon!