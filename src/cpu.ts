/** Sixteen 8-bit registers named V0 to VF */
const registers = new Uint8Array(0xf);

/** 16-bit address register named I */
let addressRegister: number;

/**
 * CHIP-8 has 4 kilobytes of memory, but the the first 512
 * bytes are traditionally reserved for the interpreter itself
 * so usually programs should be loaded starting from 0x200.
 */
let memory = new Uint8Array(0x1000);

/** ROMs loaded to memory start at 512 bytes in so at 0x200 */

const ROM_START = 0x200;

/** Program counter, i.e. the current instruction address */
const programCounter = ROM_START;

/**
 * Bit mask for conveniently extracting the register from
 * instructions like 0x6F00 where the F is the identifier
 * of the register
 */
const REGISTER_MASK = 0x0f00;

/**
 * Inspects the passed bytes and checks how many unique
 * opcodes there are. This is used for debugging only.
 * @param {Uint8Array} bytes Bytes
 */
function inspect(bytes: Uint8Array) {
  const uniqueOpcodes = new Set<number>(bytes);
  console.log(uniqueOpcodes);
}

/**
 * Decodes the the passed array of bytes into opcodes
 * and executes the opcodes
 * @param {Uint8Array} bytes Bytes
 */
export function load(bytes: Uint8Array) {
  //Load ROM into memory starting at 0x200
  for (let [index, _byte] of bytes.entries()) {
    memory[ROM_START + index] = _byte;
  }

  //Decode and execute opcodes
  for (let [index, nibble] of memory.slice(ROM_START).entries()) {
    //Opcodes are 16-bits but they are stored in 8-bit slots
    //so combine the slots before passing them to be executed
    execute((memory[index] << 8) | memory[index + 1]);
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
      value = opcode & (0x00ff % 255);
      registers[register] += value;
      break;
    case 0x8: //Various register-to-register operations
      const operation = opcode & 0x000f;
      const register1 = opcode & (0x0f00 >> 8);
      const register2 = opcode & (0x00f0 >> 4);
      switch (operation) {
        case 0x0: //Assign register x to register y (0x8xy0)
          registers[register1] = registers[register2];
          break;
        case 0x1: //Assign register x | register y to register x
          registers[register1] = registers[register1] | registers[register2];
          break;
        case 0x2: //Assign register x & register y to register x
          registers[register1] = registers[register1] & registers[register2];
          break;
        case 0x3: //Assign register x ^ register y to register x
          registers[register1] = registers[register1] ^ registers[register2];
          break;
        case 0x4: //Add register x to register y - set VF to 1 if carry, 0 if not
          const sum = registers[register1] + registers[register2];
          if (sum > 255) {
            registers[register1] = sum % 255;
            registers[0xf] = 1;
          } else {
            registers[register1] = sum;
            registers[0xf] = 0;
          }
          break;
      }
      break;
    default:
      console.warn(`Unknown opcode: 0x${hex} (${opcode})`);
      break;
  }
}
