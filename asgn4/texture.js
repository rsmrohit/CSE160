// Rohit Mamidipaka
// ID: 2009124
// rmamidip@ucsc.edu
// texture.js - Texture loading and management

class TextureManager {
  constructor(gl) {
    this.gl = gl;
    this.textures = new Map(); // Map of texture name -> WebGL texture
    this.loadedCount = 0;
    this.totalCount = 0;
  }
  
  /**
   * Load a texture from an image URL
   * @param {string} name - Unique identifier for this texture
   * @param {string} url - URL or path to the image
   * @param {function} callback - Optional callback when texture loads
   */
  loadTexture(name, url, callback) {
    const gl = this.gl;
    
    // Create texture object
    const texture = gl.createTexture();
    if (!texture) {
      console.log('Failed to create texture object');
      return null;
    }
    
    // Create image object
    const image = new Image();
    
    this.totalCount++;
    
    image.onload = () => {
      this.handleTextureLoaded(texture, image, name);
      this.loadedCount++;
      
      if (callback) {
        callback(texture);
      }
      
      console.log(`Texture loaded: ${name} (${this.loadedCount}/${this.totalCount})`);
    };
    
    image.onerror = () => {
      console.error(`Failed to load texture: ${name} from ${url}`);
    };
    
    // Start loading the image
    image.src = url;
    
    // Store the texture
    this.textures.set(name, texture);
    
    return texture;
  }
  
  /**
   * Handle texture loading once image is ready
   */
  handleTextureLoaded(texture, image, name) {
    const gl = this.gl;
    
    // Flip the image's Y axis to match WebGL texture coordinates
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    
    // Bind the texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    } else {
      // NPOT textures in WebGL1 must use clamp-to-edge and no mipmaps.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    // Upload the image to the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    if (this.isPowerOf2(image.width) && this.isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    
    // Unbind
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  isPowerOf2(value) {
    return (value & (value - 1)) === 0;
  }
  
  /**
   * Create a simple procedural texture (useful for testing)
   */
  createCheckerboardTexture(name, size = 64, color1 = [255, 255, 255], color2 = [0, 0, 0]) {
    const gl = this.gl;
    
    // Create texture data
    const pixels = new Uint8Array(size * size * 4);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = (y * size + x) * 4;
        const isWhite = (Math.floor(x / (size / 8)) + Math.floor(y / (size / 8))) % 2 === 0;
        const color = isWhite ? color1 : color2;
        
        pixels[index + 0] = color[0];
        pixels[index + 1] = color[1];
        pixels[index + 2] = color[2];
        pixels[index + 3] = 255;
      }
    }
    
    // Create and configure texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size,
      size,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    this.textures.set(name, texture);
    this.loadedCount++;
    this.totalCount++;
    
    return texture;
  }
  
  /**
   * Get a texture by name
   */
  getTexture(name) {
    return this.textures.get(name);
  }
  
  /**
   * Bind a texture for rendering
   */
  bindTexture(name, textureUnit = 0) {
    const gl = this.gl;
    const texture = this.textures.get(name);
    
    if (texture) {
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return true;
    }
    
    console.warn(`Texture not found: ${name}`);
    return false;
  }
  
  /**
   * Check if all textures are loaded
   */
  isAllLoaded() {
    return this.loadedCount >= this.totalCount;
  }
  
  /**
   * Get loading progress (0.0 to 1.0)
   */
  getProgress() {
    if (this.totalCount === 0) return 1.0;
    return this.loadedCount / this.totalCount;
  }
}
