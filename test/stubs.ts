/** Fake presentation of the internal pixel buffer */
interface PixelBuffer {
  [key: string]: string;
}

/**
 * Helper function for extracting RGBA components from an RGB
 * string like "rgb(255, 255, 255)".
 * @param {string} color RGB string
 * @returns {number[]} RGBA components in an array
 */
function extractRGBA(color: string): number[] {
  const regex = /rgb\((\d{1,3}),\s?(\d{1,3}),\s?(\d{1,3})\)/i;
  const rgb = regex.exec(color);
  if (rgb !== null) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), 0];
  } else {
    return [0, 0, 0, 0];
  }
}

/** Simplified server-side friendly stubs for CanvasElement.context */
export function stubCanvas() {
  const canvasContext = {
    /** Internal pixel buffer for storing pixel data */
    _pixels: {} as PixelBuffer,
    /** Fill color */
    fillStyle: "",
    /**
     * Stubbed getImageData which returns the RGBA components for the
     * requested coordinates as a byte array.
     * @param {number} x1 X coordinate
     * @param {number} y1 Y coordinate
     * @param {number} width Width of the image data
     * @param {number} height Height of the image data
     * @returns {Uint8Array} Array of RGBA components
     */
    getImageData(x1: number, y1: number, width: number, height: number) {
      const imageData = [];
      for (let x = x1; x < x1 + width; x++) {
        for (let y = y1; y < y1 + height; y++) {
          const pixel = this._pixels[`${x}-${y}`];
          imageData.push(...extractRGBA(pixel));
        }
      }
      return {
        data: Uint8Array.from(imageData)
      };
    },
    /**
     * Stubbed fillRect which sets an internal pixel buffer to match the passed
     * rect using the current fillStyle.
     * @param {number} x1 X coordinate
     * @param {number} y1 Y coordinate
     * @param {number} width Width of the rect
     * @param {number} height Height of the rect
     */
    fillRect(x1: number, y1: number, width: number, height: number) {
      for (let x = x1; x < x1 + width; x++) {
        for (let y = y1; y < y1 + height; y++) {
          this._pixels[`${x}-${y}`] = this.fillStyle;
        }
      }
    },
    clearRect(x: number, y: number, width: number, height: number) {}
  };
  //Stub global.document to provide support for basic canvas operations
  (<any>global).document = {
    querySelector(domElement: string) {
      return {
        getContext(contextType: string) {
          return canvasContext;
        }
      };
    }
  };
}
