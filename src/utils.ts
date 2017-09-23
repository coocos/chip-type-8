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
