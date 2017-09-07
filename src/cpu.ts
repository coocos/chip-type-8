/**
 * Inspects the passed bytes and checks how many unique
 * opcodes there are. This is used for debugging only.
 * @param {Uint16Array} bytes Bytes
 */
function inspect(bytes: Uint16Array) {
  const uniqueOpcodes = new Set<number>(bytes);
  console.log(uniqueOpcodes);
}

/**
 * Decodes the the passed array of bytes into opcodes
 * and executes the opcodes
 * @param {Uint16Array} bytes Bytes
 */
export function load(bytes: Uint16Array) {
  inspect(bytes);
  for (let opcode of bytes) {
    execute(opcode);
  }
}

/**
 * Executes opcode and logs if the opcode is not identified
 * @param {number} opcode Opcode to be executed
 */
export function execute(opcode: number) {
  const hex = opcode.toString(16).toUpperCase();
  switch (opcode) {
    default:
      console.warn(`Unknown opcode: 0x${hex} (${opcode})`);
      break;
  }
}
