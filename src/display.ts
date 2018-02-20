export default class Display {
  /** The display wraps after 64 pixels horizontally and 32 pixels vertically */
  private static HORIZONTAL_WRAP = 64;
  private static VERTICAL_WRAP = 32;

  /** Set pixels are white, background pixels are black */
  private static BACKGROUND_COLOR = "rgb(0, 0, 0)";
  private static FOREGROUND_COLOR = "rgb(255, 255, 255)";

  /** Canvas, i.e. drawing surface */
  canvas: HTMLCanvasElement;

  /** Two-dimensional context for canvas */
  context: CanvasRenderingContext2D;

  /** Scaling factor of the screen */
  scale: number;

  /**
   * Constructs display by finding the corresponding element from DOM
   * and constructs a two-dimensional context for sprite opertaions
   * @param {string | HTMLCanvasElement} domElement DOM identifier or element for canvas
   * @param {number} scale Screen scaling factor
   * @returns {Display} Display
   */
  constructor(domElement: string | HTMLCanvasElement, scale: number = 8) {
    if (this.isCanvas(domElement)) {
      this.canvas = domElement;
      this.scale = Math.round(domElement.clientWidth / Display.HORIZONTAL_WRAP);
    } else {
      this.canvas = <HTMLCanvasElement>document.querySelector(domElement);
      this.scale = scale;
      if (!this.canvas) {
        throw new Error(`Failed to find ${domElement} in DOM`);
      }
    }
    this.context = this.canvas.getContext("2d")!;
    this.clear();
  }

  /** Type guard for checking whether canvas is DOM identifier or DOM element */
  private isCanvas(
    canvas: string | HTMLCanvasElement
  ): canvas is HTMLCanvasElement {
    return (<HTMLCanvasElement>canvas).getContext !== undefined;
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
    for (let [y2, _byte] of bytes.entries()) {
      //Loop through each bit in the byte - each bit is a single horizontal pixel
      for (let x2 = 0; x2 < 8; x2++) {
        const bit = (_byte >> x2) & 0x1;
        //Only set bits / pixels are drawn - unset bits are ignored
        if (bit) {
          //X coordinate is the starting x coordinate + bit offset
          let x = (x1 + (7 - x2)) % Display.HORIZONTAL_WRAP;
          //Final y coordinate is the starting y coordinate + byte offset
          let y = (y1 + y2) % Display.VERTICAL_WRAP;

          //If pixel is already set it needs to be flipped
          if (this.isPixelSet(x * this.scale, y * this.scale)) {
            pixelsFlipped = true;
            this.context.fillStyle = Display.BACKGROUND_COLOR;
          } else {
            this.context.fillStyle = Display.FOREGROUND_COLOR;
          }

          //Fill pixel
          this.context.fillRect(
            x * this.scale,
            y * this.scale,
            1 * this.scale,
            1 * this.scale
          );
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
  isPixelSet(x: number, y: number): boolean {
    const pixel = this.context.getImageData(x, y, 1, 1);
    return pixel.data[0] > 0;
  }

  /** Clears the display */
  clear() {
    this.context.fillStyle = Display.BACKGROUND_COLOR;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
