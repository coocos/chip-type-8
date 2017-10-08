export default class Input {
  /** Currently pressed keys */
  private activeKeys: Set<string>;

  /**
   * Constructs the input handler and handles key presses accordingly
   * @param {DOMElement}
   * @return {Input} Input handler
   */
  constructor(element: Element | Document = document) {
    this.activeKeys = new Set<string>();
    element.addEventListener("keydown", (e: KeyboardEvent) => {
      this.activeKeys.add(e.key);
    });
    element.addEventListener("keyup", (e: KeyboardEvent) => {
      if (this.activeKeys.has(e.key)) {
        this.activeKeys.delete(e.key);
      }
    });
  }

  /**
   * Returns whether key is pressed
   * @param {string} key Name of the input key
   * @return {boolean} True if key is pressed, false if not
   */
  isPressed(key: string): boolean {
    return this.activeKeys.has(key);
  }
}
