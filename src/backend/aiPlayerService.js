const OpenAI = require('openai');

class AIPlayerService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.isEnabled = !!process.env.OPENAI_API_KEY;
    
    if (!this.isEnabled) {
      console.warn('OpenAI API key not found. AI player disabled.');
    }
  }

  /**
   * Generate a single next command based on game history
   */
  async generateNextCommand(gameHistory, currentState) {
    if (!this.isEnabled) {
      console.log('AI player disabled - no API key');
      return null;
    }

    try {
      const context = this.buildGameContext(gameHistory, currentState);
      const prompt = this.createPrompt(context);
      
      console.log('AI Player: Generating next command...');
      console.log('Context length:', context.length);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI playing the classic text adventure game Zork. You are intelligent, curious, and systematic in your exploration. 
            
Your goal is to explore the game world, solve puzzles, and progress through the adventure. You should:
- Explore new areas when possible
- Examine interesting objects and features
- Take useful items when you find them
- Try to solve puzzles logically
- Remember where you've been and what you've learned

IMPORTANT: Respond with ONLY a single game command. No explanations, no quotes, no additional text. Just the raw command that should be typed into the game.

Examples of good commands:
- north
- take lamp
- examine mailbox
- open window
- inventory
- look around
- unlock door with key`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      });

      const command = response.choices[0].message.content.trim();
      console.log('AI Player generated command:', command);
      
      return this.sanitizeCommand(command);

    } catch (error) {
      console.error('Error generating AI command:', error);
      return null;
    }
  }

  /**
   * Build context from game history and current state
   */
  buildGameContext(gameHistory, currentState) {
    let context = "=== ZORK GAME SESSION ===\n\n";
    
    // Add game history
    if (gameHistory && gameHistory.length > 0) {
      context += "GAME HISTORY:\n";
      gameHistory.forEach((entry, index) => {
        if (entry.type === 'start') {
          context += `[GAME START]\n${entry.output}\n\n`;
        } else if (entry.type === 'command') {
          context += `> ${entry.command}\n${entry.output}\n\n`;
        }
      });
    }
    
    // Add current state if different from last history entry
    if (currentState) {
      context += "CURRENT SITUATION:\n";
      context += currentState + "\n\n";
    }
    
    context += "What should be the next command?";
    
    return context;
  }

  /**
   * Create the prompt for AI decision making
   */
  createPrompt(context) {
    return `${context}

Based on the game history above, what is the best next command to continue playing Zork effectively?

Remember:
- Explore systematically
- Examine everything interesting
- Take useful items
- Try logical puzzle solutions
- Use standard adventure game commands

Respond with ONLY the command, nothing else:`;
  }

  /**
   * Clean and validate the AI generated command
   */
  sanitizeCommand(command) {
    if (!command) return null;
    
    // Remove quotes, extra whitespace, explanations
    let cleaned = command
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^[>\s]+/, '') // Remove > prompt and leading spaces
      .replace(/\.$/, '') // Remove trailing period
      .trim()
      .toLowerCase();
    
    // Take only the first line if multiple lines
    cleaned = cleaned.split('\n')[0];
    
    // Block potentially harmful commands
    const blockedCommands = ['quit', 'exit', 'restart', 'save', 'restore', 'script'];
    if (blockedCommands.some(blocked => cleaned.startsWith(blocked))) {
      console.log('AI Player: Blocked unsafe command:', cleaned);
      return 'look'; // Default safe command
    }
    
    // Ensure it's not empty
    if (!cleaned || cleaned.length === 0) {
      return 'look';
    }
    
    return cleaned;
  }

  /**
   * Check if AI player is available
   */
  isAvailable() {
    return this.isEnabled;
  }
}

module.exports = AIPlayerService;