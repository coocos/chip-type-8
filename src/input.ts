//Map CHIP-8 keyboard to a modern keyboard
//prettier-ignore
const keyMap: { [index: string]: string } = {
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '12',
    'q': '4',
    'w': '5',
    'e': '6',
    'r': '13',
    'a': '7',
    's': '8',
    'd': '9',
    'f': '14',
    'z': '10',
    'x': '0',
    'c': '11',
    'v': '15'
}

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
  isPressed(key: string): boolean {
    return this.activeKeys.has(key);
  }
}
