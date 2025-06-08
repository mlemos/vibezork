const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');

class ImageGenerationService {
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY
    });
    this.isEnabled = !!process.env.REPLICATE_API_KEY;
    
    if (!this.isEnabled) {
      console.warn('Replicate API token not found. Image generation disabled.');
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
   * Generate image using Replicate Flux model
   */
  async generateImage(gameOutput, gameStatus = null) {
    if (!this.isEnabled) {
      console.log('Image generation disabled - no API token');
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

      const input = {
        prompt: prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "21:9",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 4
      };

      console.log('Replicate input:', input);

      const output = await this.replicate.run("black-forest-labs/flux-schnell", { input });
      
      
      // Handle different output formats from Flux
      let imageUrl;
      let streamToProcess = null;
      
      if (Array.isArray(output) && output[0]) {
        if (output[0].constructor && (output[0].constructor.name === 'ReadableStream' || output[0].constructor.name === 'FileOutput')) {
          streamToProcess = output[0];
        } else {
          imageUrl = output[0];
        }
      } else if (output && output.constructor && output.constructor.name === 'ReadableStream') {
        streamToProcess = output;
      } else {
        imageUrl = output;
      }
      
      if (streamToProcess) {
        try {
          // Check if it's a FileOutput with a URL method
          if (streamToProcess.url && typeof streamToProcess.url === 'function') {
            const urlObject = await streamToProcess.url();
            imageUrl = urlObject.href || urlObject.toString();
          } else if (streamToProcess.toString && typeof streamToProcess.toString === 'function') {
            const stringValue = streamToProcess.toString();
            if (stringValue.startsWith('http')) {
              imageUrl = stringValue;
            }
          } else if (streamToProcess.getReader) {
            // It's a ReadableStream
            const chunks = [];
            const reader = streamToProcess.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            // Try to get the URL - Flux might be streaming the image data directly
            const combinedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
              combinedData.set(chunk, offset);
              offset += chunk.length;
            }
            
            // Check if it looks like a URL string
            const dataAsString = new TextDecoder().decode(combinedData);
            if (dataAsString.startsWith('http')) {
              imageUrl = dataAsString.trim();
            } else {
              // It's binary image data - we need to save it or convert to base64
              imageUrl = `data:image/webp;base64,${Buffer.from(combinedData).toString('base64')}`;
            }
          } else {
            imageUrl = null;
          }
        } catch (streamError) {
          console.error('Error processing stream:', streamError);
          imageUrl = null;
        }
      } else {
        imageUrl = output;
      }
      
      console.log('Image generated successfully:', imageUrl);
      
      const imageData = {
        url: imageUrl,
        prompt: prompt,
        sceneDescription: sceneDescription,
        timestamp: new Date().toISOString()
      };
      
      // Log to file
      this.logImageGeneration(imageData, gameStatus);
      
      return imageData;

    } catch (error) {
      console.error('Error generating image:', error);
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
   * Generate image with pre-formatted prompt
   */
  async generateImageWithPrompt(prompt, gameStatus = null) {
    if (!this.isEnabled) {
      console.log('Image generation disabled - no API token');
      return null;
    }

    try {
      console.log('Image prompt:', prompt);

      const input = {
        prompt: prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "21:9",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 4
      };

      console.log('Replicate input:', input);

      const output = await this.replicate.run("black-forest-labs/flux-schnell", { input });
      
      // Handle different output formats from Flux
      let imageUrl;
      let streamToProcess = null;
      
      if (Array.isArray(output) && output[0]) {
        if (output[0].constructor && (output[0].constructor.name === 'ReadableStream' || output[0].constructor.name === 'FileOutput')) {
          streamToProcess = output[0];
        } else {
          imageUrl = output[0];
        }
      } else if (output && output.constructor && output.constructor.name === 'ReadableStream') {
        streamToProcess = output;
      } else {
        imageUrl = output;
      }
      
      if (streamToProcess) {
        try {
          // Check if it's a FileOutput with a URL method
          if (streamToProcess.url && typeof streamToProcess.url === 'function') {
            const urlObject = await streamToProcess.url();
            imageUrl = urlObject.href || urlObject.toString();
          } else if (streamToProcess.toString && typeof streamToProcess.toString === 'function') {
            const stringValue = streamToProcess.toString();
            if (stringValue.startsWith('http')) {
              imageUrl = stringValue;
            }
          } else if (streamToProcess.getReader) {
            // It's a ReadableStream
            const chunks = [];
            const reader = streamToProcess.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            // Try to get the URL - Flux might be streaming the image data directly
            const combinedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
            let offset = 0;
            for (const chunk of chunks) {
              combinedData.set(chunk, offset);
              offset += chunk.length;
            }
            
            // Check if it looks like a URL string
            const decoder = new TextDecoder();
            const text = decoder.decode(combinedData);
            if (text.startsWith('http')) {
              imageUrl = text;
            } else {
              console.log('Stream data does not appear to be a URL');
              imageUrl = null;
            }
          }
        } catch (streamError) {
          console.error('Error processing stream:', streamError);
          imageUrl = null;
        }
      } else {
        imageUrl = output;
      }
      
      console.log('Image generated successfully:', imageUrl);
      
      const imageData = {
        url: imageUrl,
        prompt: prompt,
        sceneDescription: 'N/A', // Not available with pre-formatted prompt
        timestamp: new Date().toISOString()
      };
      
      // Log to file
      this.logImageGeneration(imageData, gameStatus);
      
      return imageData;

    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  }

  /**
   * Log image generation to file
   */
  logImageGeneration(imageData, gameStatus) {
    try {
      const logEntry = `${imageData.timestamp} | Room: ${gameStatus?.room || 'unknown'} | URL: ${imageData.url}\n`;
      const logPath = path.join(process.cwd(), 'image-log.txt');
      fs.appendFileSync(logPath, logEntry);
      console.log('Image generation logged to image-log.txt');
    } catch (error) {
      console.error('Error logging image generation:', error);
    }
  }

  /**
   * Check if image generation is available
   */
  isAvailable() {
    return this.isEnabled;
  }
}

module.exports = ImageGenerationService;