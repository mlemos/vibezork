# VibeZork
A Classic Adventure Reimagined with AI

![VibeZork](vibezork.png)

**VibeZork** offers a fun new way to play the beloved classic [Zork](https://en.wikipedia.org/wiki/Zork). I've taken the popular 80s text-based adventure and transformed the experience with the power of AI-generated graphics and music. This project lets you play the old classic via [Frotz](https://davidgriffith.gitlab.io/frotz/), now augmented with immersive visuals and dynamic audio that truly bring its world to life.

This idea kicked off during the [VIBE CODING SUMMIT](https://app.agihouse.org/events/vibe-coding-summit-20250607) at the [AGI House](https://agihouse.org/) in the Bay Area. For me, it's a nostalgic bridge straight back to my childhood, recalling countless hours spent immersed in text-based adventures and imagining the world I was in. Now, with the super powers of AI, the players can visualize many of those iconic scenarios and listen to music that tries to match the game's mood.

It's been an incredibly fun experience connecting the "prompts" of the 80s (where my imagination filled in all the blanks) with the powerful prompting capabilities of today's AI. I had a lot of fun building this, and I truly hope you enjoy playing it as much as I enjoyed creating it!

HeyHo!?

## Features

- **Desktop App** - [Electron](https://www.electronjs.org/) based desktop app and UI.
- **Classic Gameplay** - Full integration with the original Zork game via Frotz.
- **AI Graphics** - Real-time scene visualization in different styles.
- **AI Music** - Atmospheric music generation for each game location.
- **AI Autoplay** - Watch AI play through the game automatically.
- **Multiple Graphics Styles** - Choose from pixel art, realistic and more.

## Prerequisites

This instruction are for **macOS**, but it should be easy to adapt to other systems.

### Required Software
- **Node.js** (v16 or higher).
- **npm** (comes with Node.js).
- **frotz** - Z-machine interpreter for playing Zork.

### Installing dfrotz

**macOS (using Homebrew):**
```bash
brew install frotz
```

More info at [David Kinder's website](https://www.davidkinder.co.uk/frotz.html).

### Zork Game File
You'll need the Zork I game file `zork1_sg.z5`.

Find it here: https://datadrivengamer.blogspot.com/2019/04/game-55-zork-i.html

Place the game file at `~/Downloads/zorkpack/zork1_sg.z5`.

The app expects this exact location.

But this is easy to change if you want to. 

## Installation & Setup

### 1. Clone the Repository
```bash
gh repo clone mlemos/vibezork
cd vibezork
```

Or

```bash
git clone https://github.com/mlemos/vibezork.git
cd vibezork
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up API Keys
Set up your API keys in the in the following environment variables:

```bash
# Required for AI features
REPLICATE_API_KEY=your_replicate_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

## Running the Application

### Start the Full Application
```bash
npm run dev
```

This command starts:
1. **Backend server** on port 3001 (Express + WebSocket).
2. **Webpack dev server** on port 8080 (React frontend).
3. **Electron app** window.

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

### Basic Gameplay
1. **Type commands** in the input field at the bottom of the main panel.
2. **Press Enter** or click **Send** to execute commands.
3. **Common commands:**
   - `look` - Examine your surroundings
   - `inventory` - Check what you're carrying
   - `north`, `south`, `east`, `west` - Move in directions
   - `take lamp` - Pick up objects
   - `open mailbox` - Interact with objects

### AI Features

**Graphics Generation:**
- Images generate automatically when you enter new locations.
- Choose graphics style from dropdown: Pixel Art, Realistic, etc.
- Images appear in the graphics section at the top.

**Background Music:**
- Music generates automatically for each new room.
- Toggle with the **Mute/Unmute** button.
- Music crossfades smoothly between locations.
- Sometimes it take a few seconds for the music to start (generation is slow).

**AI Autoplay:**
1. Click **AI Autoplay** to let AI play automatically.
2. Adjust autoplay speed with the slider.
3. The AI will play continuously at the speed you set.
4. Input is disabled during autoplay mode.

**AI Single Move:**
1. Click **AI Single Move** to let AI play one move.

### Controls Panel
- **Reset Game** - Restart Zork from the beginning. 
- **AI Autoplay** - Toggle automatic AI gameplay.
- **AI Single Move** - Request one AI move.
- **Mute/Unmute** - Control background music.
- **Graphics Mode** - Select visual style for image generation.
- **Autoplay Speed** - Adjust timing between AI moves.

### Status Bar
Monitor real-time status:
- **Backend** - Connection to game server.
- **AI** - AI thinking/ready status. 
- **Auto** - Manual/autoplay mode.
- **Audio** - Sound on/off.
- **GFX** - Current graphics mode.

### AI Panel
- View AI thoughts and decision-making process.
- See image/music generation progress.
- See the prompts used on image and music generation.
- Error messages.

## Troubleshooting

### Common Issues

**"Backend not connected"**
- Ensure dfrotz is installed and in PATH.
- Check that Zork game file exists at specified path.
- Verify port 3001 is available.

**"No API token" warnings**
- Add REPLICATE_API_KEY and OPENAI_API_KEY to your environment variables.
- Restart the application after adding keys.

**Images/Music not generating**
- Verify API keys are valid and have credits.
- Check network connection.
- View browser console for detailed error messages.

**Game not responding**
- Try the **Reset Game** button.
- Check that dfrotz process is running: `ps aux | grep dfrotz`.
- Restart the application.

### Debug Mode
Enable detailed logging by setting:
```bash
DEBUG=true npm run dev
```

### Log Files
Check generated logs for debugging:
- `image-log.txt` - Image generation history.
- `music-log.txt` - Music generation history.

## Development

### Project Structure
```
src/
├── backend/               # Node.js server
│   ├── server.js          # Main server with WebSocket
│   ├── gameEngine.js      # Frotz integration
│   ├── imageService.js    # AI image generation
│   ├── musicService.js    # AI music generation
│   └── aiPlayerService.js # AI playing
├── electron/              # Electron main process
│   ├── main.js            # Window management
│   └── preload.js         # Security layer
└── renderer/              # React frontend
    ├── components/        # UI components
    ├── services/          # API clients
    └── styles/            # CSS styling
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test thoroughly.
5. Submit a pull request.
6. Have fun!

## License

This project is for educational and entertainment purposes. **Zork** is a trademark of [Activision](https://activision.com/).

## Credits

- **Original Zork** - Infocom (1980) [original game](https://datadrivengamer.blogspot.com/2019/04/game-55-zork-i.html).
- **Frotz** - Z-machine interpreter [David Kinder](https://www.davidkinder.co.uk/frotz.html).
- **Image Model** - [Flux-Schnell](https://replicate.com/black-forest-labs/flux-schnell) via [Replicate](https://replicate.com).
- **Music Model** - [MusicGen](https://replicate.com/ardianfe/music-gen-fn-200e) via [Replicate](https://replicate.com).
- **Playing Model** - OpenAI [GPT-4.1](https://platform.openai.com/docs/models/gpt-4.1) via [OpenAI](https://openai.com/).
- **Framework** - [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [Node.js](https://nodejs.org/).
- **Claude Code** - [Claude](https://www.anthropic.com/claude) via [Anthropic](https://www.anthropic.com/).

## Special Thanks

Special thanks to **[Lukas Nel](https://github.com/LukasNel)** and **[Philippe Mallette](https://github.com/philippemallette)** for their support, hints and great company during the hackathon!