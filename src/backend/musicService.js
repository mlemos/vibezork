const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');

class MusicGenerationService {
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY
    });
    this.isEnabled = !!process.env.REPLICATE_API_KEY;
    this.musicCache = new Map(); // Cache music by room to avoid regeneration
    
    if (!this.isEnabled) {
      console.warn('Replicate API token not found. Music generation disabled.');
    }
  }

  /**
   * Generate background music for a game scene
   */
  async generateMusic(gameOutput, gameStatus = null) {
    if (!this.isEnabled) {
      console.log('Music generation disabled - no API token');
      return null;
    }

    try {
      // Check cache first (by room)
      const roomKey = gameStatus?.room || 'unknown_room';
      if (this.musicCache.has(roomKey)) {
        console.log('Using cached music for room:', roomKey);
        return this.musicCache.get(roomKey);
      }

      const sceneDescription = this.extractSceneDescription(gameOutput);
      const musicPrompt = this.createMusicPrompt(sceneDescription, gameStatus);
      
      console.log('Music Generation: Creating background music...');
      console.log('Music prompt:', musicPrompt);
      console.log('Replicate input parameters:', {
        steps: 50,
        prompt: musicPrompt,
        model_version: "base",
        guidance_scale: 7,
        negative_prompt: "low quality, gentle, happy, upbeat",
        save_spectrogram: true
      });
      console.log('Calling Replicate API for music generation...');
      console.log('API Key present:', !!process.env.REPLICATE_API_KEY);
      console.log('API Key length:', process.env.REPLICATE_API_KEY?.length || 0);

      const startTime = Date.now();
      console.log('Music generation started at:', new Date().toISOString());

      const output = await this.replicate.run(
        "ardianfe/music-gen-fn-200e:96af46316252ddea4c6614e31861876183b59dce84bad765f38424e87919dd85",
        {
          input: {
            top_k: 250,
            top_p: 0,
            prompt: musicPrompt,
            duration: 12,
            temperature: 1,
            continuation: false,
            output_format: "wav",
            continuation_start: 0,
            multi_band_diffusion: false,
            normalization_strategy: "loudness",
            classifier_free_guidance: 3
          }
        }
      );

      const endTime = Date.now();
      console.log('Music generation completed at:', new Date().toISOString());
      console.log('Music generation took:', (endTime - startTime) / 1000, 'seconds');
      console.log('Replicate API call completed. Raw output:', output);
      console.log('Output type:', typeof output);
      console.log('Output is array:', Array.isArray(output));
      console.log('Output keys:', output ? Object.keys(output) : 'null');

      console.log('Music generation output:', output);
      
      // Handle music-gen-fn-200e output format
      let musicUrl = null;
      
      console.log('Music output type:', typeof output);
      console.log('Music output constructor:', output?.constructor?.name);
      console.log('Music output properties:', Object.getOwnPropertyNames(output || {}));
      
      try {
        if (output && output.url && typeof output.url === 'function') {
          // FileOutput object with url() method
          console.log('Using output.url() method...');
          musicUrl = await output.url();
          console.log('Extracted music URL:', musicUrl);
        } else if (typeof output === 'string' && output.startsWith('http')) {
          // Direct URL string
          musicUrl = output;
        } else if (output && typeof output.toString === 'function') {
          // Try toString method
          const stringValue = output.toString();
          if (stringValue.startsWith('http')) {
            musicUrl = stringValue;
          }
        } else {
          console.log('Unknown output format for music-gen-fn-200e');
          musicUrl = null;
        }
      } catch (error) {
        console.error('Error extracting music URL:', error);
        musicUrl = null;
      }

      if (musicUrl) {
        const musicData = {
          url: musicUrl,
          room: roomKey,
          prompt: musicPrompt,
          timestamp: new Date().toISOString()
        };

        // Cache the music for this room
        this.musicCache.set(roomKey, musicData);
        console.log('Music generated successfully for room:', roomKey);
        
        // Log to file
        this.logMusicGeneration(musicData);
        
        return musicData;
      } else {
        console.error('No music URL found in output:', output);
        return null;
      }

    } catch (error) {
      console.error('Error generating music:', error);
      return null;
    }
  }

  /**
   * Extract meaningful scene description from game output
   */
  extractSceneDescription(gameOutput) {
    // Remove command echoes and status lines
    let description = gameOutput
      .replace(/^>.*$/gm, '') // Remove command lines
      .replace(/.*Score:\s*\d+\s*Moves:\s*\d+.*$/gm, '') // Remove status lines
      .replace(/^\s*$/gm, '') // Remove empty lines
      .trim();

    // Take first meaningful paragraph as scene description
    const paragraphs = description.split('\n\n').filter(p => p.trim().length > 20);
    return paragraphs[0] || description;
  }

  /**
   * Create a music generation prompt based on the game scene
   */
  createMusicPrompt(sceneDescription, gameStatus = null) {
    // Analyze scene for mood and atmosphere
    const moodKeywords = this.analyzeMood(sceneDescription);
    
    // Clean scene description (remove extra text)
    const cleanScene = sceneDescription.substring(0, 300).trim();
    
    // Separate scene description from model instructions
    const sceneSection = `SCENE:\n${cleanScene}`;
    
    // Model instructions with cleaner format
    const instructionsSection = `INSTRUCTIONS:\nGenerate looping background music for a fantasy text adventure game.\nStyle: ${moodKeywords.style}.\nMood: ${moodKeywords.mood}.\nInstruments: ${moodKeywords.instruments}.\nPurpose: Enhance the immersive atmosphere of exploration without distracting from gameplay text.`;
    
    // Combine with clear separation
    const prompt = `${sceneSection}\n\n${instructionsSection}`;

    return prompt;
  }

  /**
   * Analyze scene description to determine musical mood and style
   */
  analyzeMood(sceneDescription) {
    const text = sceneDescription.toLowerCase();
    
    // Define mood patterns
    const moodPatterns = {
      dark: ['dark', 'shadow', 'cave', 'underground', 'dungeon', 'basement', 'deep'],
      mysterious: ['strange', 'mysterious', 'ancient', 'old', 'forgotten', 'hidden'],
      dangerous: ['trap', 'danger', 'monster', 'threat', 'warning', 'beware'],
      peaceful: ['garden', 'peaceful', 'quiet', 'serene', 'calm', 'safe'],
      majestic: ['castle', 'throne', 'grand', 'magnificent', 'royal', 'palace'],
      nature: ['forest', 'tree', 'river', 'water', 'mountain', 'outdoor'],
      magical: ['magic', 'spell', 'wizard', 'enchant', 'glow', 'sparkle']
    };

    // Score each mood
    const scores = {};
    for (const [mood, keywords] of Object.entries(moodPatterns)) {
      scores[mood] = keywords.reduce((score, keyword) => {
        return score + (text.includes(keyword) ? 1 : 0);
      }, 0);
    }

    // Find dominant mood
    const dominantMood = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );

    // Map moods to musical characteristics
    const moodMap = {
      dark: {
        style: "dark ambient, atmospheric drone",
        mood: "ominous, foreboding, tense",
        instruments: "low strings, deep bass, subtle percussion, haunting pads"
      },
      mysterious: {
        style: "ambient, ethereal soundscape",
        mood: "mysterious, curious, intriguing",
        instruments: "soft pads, gentle bells, whispered textures, ambient sounds"
      },
      dangerous: {
        style: "tense cinematic, suspenseful",
        mood: "threatening, urgent, dramatic",
        instruments: "staccato strings, dramatic percussion, brass stabs"
      },
      peaceful: {
        style: "serene ambient, gentle melodies",
        mood: "calm, peaceful, tranquil",
        instruments: "soft piano, gentle strings, nature sounds, warm pads"
      },
      majestic: {
        style: "orchestral, grand cinematic",
        mood: "noble, impressive, grand",
        instruments: "full orchestra, brass fanfares, timpani, soaring strings"
      },
      nature: {
        style: "organic ambient, natural soundscape",
        mood: "fresh, alive, natural",
        instruments: "acoustic guitar, flute, nature sounds, gentle percussion"
      },
      magical: {
        style: "fantasy ambient, mystical",
        mood: "enchanting, otherworldly, magical",
        instruments: "chimes, harp, ethereal vocals, shimmering pads"
      }
    };

    return moodMap[dominantMood] || moodMap.mysterious; // Default to mysterious
  }

  /**
   * Clear music cache
   */
  clearCache() {
    this.musicCache.clear();
    console.log('Music cache cleared');
  }

  /**
   * Log music generation to file
   */
  logMusicGeneration(musicData) {
    try {
      const logEntry = `${musicData.timestamp} | Room: ${musicData.room} | URL: ${musicData.url}\n`;
      const logPath = path.join(process.cwd(), 'music-log.txt');
      fs.appendFileSync(logPath, logEntry);
      console.log('Music generation logged to music-log.txt');
    } catch (error) {
      console.error('Error logging music generation:', error);
    }
  }

  /**
   * Check if music generation is available
   */
  isAvailable() {
    return this.isEnabled;
  }
}

module.exports = MusicGenerationService;