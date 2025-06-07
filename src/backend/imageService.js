const OpenAI = require('openai');

class ImageGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.isEnabled = !!process.env.OPENAI_API_KEY;
    
    if (!this.isEnabled) {
      console.warn('OpenAI API key not found. Image generation disabled.');
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
   * Create a detailed prompt for image generation
   */
  createImagePrompt(sceneDescription, gameStatus = null) {
    // Base style for all Zork images
    const baseStyle = "fantasy adventure game art, retro 1980s text adventure style, detailed illustration, atmospheric lighting, mysterious and adventurous mood";
    
    // Extract location from game status if available
    const location = gameStatus?.room || "mysterious location";
    
    // Create enhanced prompt
    const prompt = `${sceneDescription}. ${baseStyle}. Location: ${location}. High quality digital art, no text or UI elements.`;
    
    return prompt.substring(0, 1000); // DALL-E has prompt length limits
  }

  /**
   * Generate image using OpenAI DALL-E
   */
  async generateImage(gameOutput, gameStatus = null) {
    if (!this.isEnabled) {
      console.log('Image generation disabled - no API key');
      return null;
    }

    try {
      console.log('Generating image for game output...');
      
      const sceneDescription = this.extractSceneDescription(gameOutput);
      console.log('Scene description:', sceneDescription);
      
      if (sceneDescription.length < 10) {
        console.log('Scene description too short, skipping image generation');
        return null;
      }

      const prompt = this.createImagePrompt(sceneDescription, gameStatus);
      console.log('Image prompt:', prompt);

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      });

      const imageUrl = response.data[0].url;
      console.log('Image generated successfully:', imageUrl);
      
      return {
        url: imageUrl,
        prompt: prompt,
        sceneDescription: sceneDescription,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating image:', error);
      
      // Handle specific API errors
      if (error.code === 'insufficient_quota') {
        console.error('OpenAI API quota exceeded');
      } else if (error.code === 'invalid_api_key') {
        console.error('Invalid OpenAI API key');
      }
      
      return null;
    }
  }

  /**
   * Generate image for game start
   */
  async generateStartImage(initialGameOutput, gameStatus = null) {
    console.log('Generating start image...');
    return await this.generateImage(initialGameOutput, gameStatus);
  }

  /**
   * Generate image for command response
   */
  async generateCommandImage(commandOutput, gameStatus = null) {
    console.log('Generating command response image...');
    return await this.generateImage(commandOutput, gameStatus);
  }

  /**
   * Check if image generation is available
   */
  isAvailable() {
    return this.isEnabled;
  }
}

module.exports = ImageGenerationService;