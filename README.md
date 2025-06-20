# VibeZork
A Classic Adventure Reimagined with AI

![VibeZork](/docs/vibezork.png)

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

> [!CAUTION]
> The app has no usage limits. Be aware that AI API requests will consume your quotas and credits, especially when using the AI auto-play feature.

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
1. Click on the **Re(Start) Game** button to start or restart the game.
2. **Type commands** in the input field at the bottom of the main panel.
3. **Press Enter** or click **Send** to execute commands.
4. **Common commands:**
   - `look` - Examine your surroundings
   - `inventory` - Check what you're carrying
   - `north`, `south`, `east`, `west` - Move in directions
   - `take lamp` - Pick up objects
   - `open mailbox` - Interact with objects

### AI Autoplay

> [!CAUTION]
> The app has no usage limits. Be aware that AI API requests will consume your quotas and credits, especially when using the AI auto-play feature.

1. Click **Start AI** to let AI play automatically.
2. Adjust autoplay speed with the slider.
3. The AI will play continuously at the speed you set.
4. Input is disabled during autoplay mode.
5. Click **Pause AI** to pause the AI.

### AI Single Move
1. Click **AI Move** to let AI play one move.

### Controls Panel
- **Re(Start) Game** - Start or restart Zork from the beginning. 
- **Start AI** - Toggle automatic AI gameplay.
- **Pause AI** - Pause the AI.
- **AI Move** - Request one AI move.
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

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

This project is for educational and entertainment purposes. **Zork** is a trademark of [Activision](https://activision.com/).

## Credits

- **Original Zork** - [Infocom](https://en.wikipedia.org/wiki/Infocom) (1980) and the authors of the original game (Tim Anderson, Marc Blank, Bruce Daniels, and Dave Lebling).
- **Game File** - Dowload from [Data Driven Gamer](https://datadrivengamer.blogspot.com/2019/04/game-55-zork-i.html).
- **Frotz** - Z-machine interpreter by [David Kinder](https://www.davidkinder.co.uk/frotz.html).
- **Image Model** - [Flux-Schnell](https://replicate.com/black-forest-labs/flux-schnell) via [Replicate](https://replicate.com).
- **Music Model** - [MusicGen](https://replicate.com/ardianfe/music-gen-fn-200e) via [Replicate](https://replicate.com).
- **Playing Model** - [GPT-4.1](https://platform.openai.com/docs/models/gpt-4.1) by [OpenAI](https://openai.com/).
- **Framework** - [Electron](https://www.electronjs.org/), [React](https://reactjs.org/) and [Node.js](https://nodejs.org/).
- **Coding Assistant** - [Claude Code](https://www.anthropic.com/claude) by [Anthropic](https://www.anthropic.com/).

## Special Thanks

Special thanks to **[Lukas Nel](https://github.com/LukasNel)** and **[Philippe Mallette](https://github.com/philippemallette)** for their support, hints and great company during the hackathon!