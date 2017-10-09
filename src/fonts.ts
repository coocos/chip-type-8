/**
 * Returns a single Uint8Array with sprite data for fonts.
 *
 * Sprite data is provided for fonts from 0 to 9 and A to F. Each font is
 * 4 pixels wide and 5 pixels high. Each byte equals one row of pixels and
 * each bit in each byte indicates whether a pixel on a row is on or off.
 * For example a zero looks like:
 *
 * 11110000 # 0xf0
 * 10010000 # 0x90
 * 10010000 # 0x90
 * 10010000 # 0x90
 * 11110000 # 0xf0
 *
 * @returns {Uint8Array} Font sprite data
 */
export function getFontSprites(): Uint8Array {
  //prettier-ignore
  return Uint8Array.from([
    0xf0, 0x90, 0x90, 0x90, 0xf0, //0
    0x20, 0x60, 0x20, 0x20, 0x70, //1
    0xf0, 0x10, 0xf0, 0x80, 0xf0, //2
    0xf0, 0x10, 0xf0, 0x10, 0xf0, //3
    0x90, 0x90, 0xf0, 0x10, 0x10, //4
    0xf0, 0x80, 0xf0, 0x10, 0xf0, //5
    0xf0, 0x80, 0xf0, 0x90, 0xf0, //6
    0xf0, 0x10, 0x20, 0x40, 0x40, //7
    0xf0, 0x90, 0xf0, 0x90, 0xf0, //8
    0xf0, 0x90, 0xf0, 0x10, 0xf0, //9
    0xf0, 0x90, 0xf0, 0x90, 0x90, //a
    0xe0, 0x90, 0xe0, 0x90, 0xe0, //b
    0xf0, 0x80, 0x80, 0x80, 0xf0, //c
    0xe0, 0x90, 0x90, 0x90, 0xe0, //d
    0xf0, 0x80, 0xf0, 0x80, 0xf0, //e
    0xf0, 0x80, 0xf0, 0x80, 0x80 //f
  ]);
}