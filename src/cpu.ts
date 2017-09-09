/** Sixteen 8-bit registers named V0 to VF */
const registers = new Uint8Array(0xf);

/** 16-bit address register named I */
let addressRegister: number;

/** Program counter, i.e. the current instruction address */
const programCounter = 0;

/** 4 kilobytes of memory */
const memory = new Uint8Array(0x1000);

/**
 * Bit mask for conveniently extracting the register from
 * instructions like 0x6F00 where the F is the identifier
 * of the register
 */
const REGISTER_MASK = 0x0f00;

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
  console.log(registers);
}

/**
 * Executes opcode and logs if the opcode is not identified
 * @param {number} opcode Opcode to be executed
 */
export function execute(opcode: number) {
  const hex = opcode.toString(16).toUpperCase();

  //Shift to get the opcode identifying nibble
  const identifier = opcode >> 12;
  let register;
  let value;
  switch (identifier) {
    case 0x6: //Set register x to nn (0x6xnn)
      register = (opcode & REGISTER_MASK) >> 8;
      value = opcode & 0x00ff;
      registers[register] = value;
      break;
    case 0x7: //Add nn to register x (0x7nn)
      register = (opcode & REGISTER_MASK) >> 8;
      value = opcode & 0x00ff;
      registers[register] += value;
      break;
    default:
      console.warn(`Unknown opcode: 0x${hex} (${opcode})`);
      break;
  }
}
