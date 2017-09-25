/**
 * Calculate binary-coded decimal representation of an unsigned 8-bit integer.
 * For example a value like 123 should return [1, 2, 3]. A proper binary-coded
 * decimal would actually also combine the values via bitwise operations but the
 * virtual machine is going to need to unpack it anyway and store them separately
 * into memory so it makes sense to just return an array.
 * @param {number} value Number to encode
 * @returns {Array<number>} Binary-coded values
 */
export function bcd(value: number): Array<number> {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value / 10) % 10);
  const ones = Math.floor((value % 100) % 10);
  return [hundreds, tens, ones];
}

/**
 * Returns a hexadecimal string representation of a 16-bit opcode. For example
 * 255 will return '0x00FF'
 * @param {number} opcode Opcode
 * @returns {string} Opcode as a hexadecimal string
 */
export function prettyPrint(opcode: number): string {
  return `0x${opcode.toString(16).toUpperCase()}`;
}

/**
 * Returns a random number between 0 and 255
 * @returns {number} Number between 0 and 255
 */
export function randomByte(): number {
  return Math.round(Math.random() * 255);
}

/** Nibbler defines methods for extracting nibbles from a 16-bit instruction */
interface Nibbler {
  first(): number;
  second(): number;
  third(): number;
  fourth(): number;
}

/**
 * A convenience wrapper for extracting nibbles (4-bit blocks) from 16-bit
 * opcodes. The returned Nibbler object contains methods for extracting
 * the first, second, third or fourth most significant byte of an opcode.
 * @param {number} instruction 16-bit instruction / opcode
 * @returns {Nibbler} An object which contains methods for extracting nibbles
 */
export function nibble(instruction: number): Nibbler {
  return {
    first: () => (instruction & 0xf000) >> 12,
    second: () => (instruction & 0x0f00) >> 8,
    third: () => (instruction & 0x00f0) >> 4,
    fourth: () => instruction & 0x000f
  };
}
