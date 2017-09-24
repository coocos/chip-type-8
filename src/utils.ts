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
