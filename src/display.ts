export default class Display {
  /** Canvas, i.e. drawing surface */
  canvas: HTMLCanvasElement;

  /** Two-dimensional context for canvas */
  context: CanvasRenderingContext2D;

  /**
   * Constructs display by finding the corresponding element from DOM
   * and constructs a two-dimensional context for sprite opertaions
   * @param {string} domElement Identifier of the canvas DOM element
   * @returns {Display} Display
   */
  constructor(domElement: string) {
    this.canvas = <HTMLCanvasElement>document.querySelector(domElement);
    if (!this.canvas) {
      throw new Error(`Failed to find ${domElement} in DOM`);
    }
    this.context = this.canvas.getContext("2d")!;
    this.clear();
  }

  /**
   * Draws an 8 pixel wide sprite at (x, y) with varying height. The height
   * is determined by the amount of bytes passed to the function and each
   * byte constitutes a row of 8 pixels, i.e. each bit is a single pixel in
   * a row of 8 pixels.
   *
   * If a white pixel is drawn on top of a white pixel, then the pixel is
   * flipped. The return value of the function indicates whether any pixels
   * were flipped in this manner when the sprite was drawn.
   *
   * @param {number} x1 X coordinate for the top left corner of the sprite
   * @param {number} y1 Y coordinate for the top left corner of the sprite
   * @param {Uint8Array} bytes Sprite data as bytes
   * @returns {boolean} True if any pixels were flipped, false if not
   */
  drawSprite(x1: number, y1: number, bytes: Uint8Array): boolean {
    let pixelsFlipped = false;
    for (let [y, _byte] of bytes.entries()) {
      for (let x = 0; x < 8; x++) {
        //Extract the next bit / pixel from the byte
        const bit = (_byte >> x) & 0x1;
        //Only set bits / pixels are drawn - unset bits are ignored
        if (bit) {
          //If pixel is already set it needs to be flipped
          if (this.isPixelSet(x1 + (7 - x), y1 + y)) {
            pixelsFlipped = true;
            this.context.fillStyle = "rgb(0, 0, 0)";
          } else {
            this.context.fillStyle = "rgb(255, 255, 255)";
          }
          //Fill pixel
          this.context.fillRect(x1 + (7 - x), y1 + y, 1, 1);
        }
      }
    }
    return pixelsFlipped;
  }

  /**
   * Returns whether pixel at coordinates (x, y) is set or not. Pixels are
   * considered set if the first component of an RGB triplet is larger than
   * zero.
   * @param {number} x Pixel x coordinate
   * @param {number} y Pixel y coordinate
   * @returns {boolean} True if pixel is set, false if not
   */
  public isPixelSet(x: number, y: number): boolean {
    const pixel = this.context.getImageData(x, y, 1, 1);
    return pixel.data[0] > 0;
  }

  /** Clears the display */
  clear() {
    this.context.fillStyle = "#000";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
