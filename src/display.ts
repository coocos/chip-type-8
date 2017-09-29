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
  }

  /** Clears the display */
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
