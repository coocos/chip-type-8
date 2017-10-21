//Map CHIP-8 keyboard to a modern keyboard
//prettier-ignore
export const keyMap: { [index: string]: number } = {
    '1': 0x1,
    '2': 0x2,
    '3': 0x3,
    '4': 0xc,
    'q': 0x4,
    'w': 0x5,
    'e': 0x6,
    'r': 0xd,
    'a': 0x7,
    's': 0x8,
    'd': 0x9,
    'f': 0xe,
    'z': 0xa,
    'x': 0x0,
    'c': 0xb,
    'v': 0xf
}

export default class Input {
  /** Currently pressed keys */
  private activeKeys: Set<number>;

  /**
   * Constructs the input handler and handles key presses accordingly
   * @param {DOMElement}
   * @return {Input} Input handler
   */
  constructor(element: Element | Document = document) {
    this.activeKeys = new Set<number>();
    element.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key in keyMap) {
        this.activeKeys.add(keyMap[e.key]);
      }
    });
    element.addEventListener("keyup", (e: KeyboardEvent) => {
      const key = keyMap[e.key];
      if (this.activeKeys.has(key)) {
        this.activeKeys.delete(key);
      }
    });
  }

  /**
   * Returns whether key is pressed
   * @param {string} key Name of the input key
   * @return {boolean} True if key is pressed, false if not
   */
  isPressed(key: number): boolean {
    return this.activeKeys.has(key);
  }
}
