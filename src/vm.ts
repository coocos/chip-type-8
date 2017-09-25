import * as instructions from "./instructions";
import { prettyPrint } from "./utils";
import { OpcodeError } from "./errors";

/** ROMs loaded to memory start at 512 bytes in so at 0x200 */
const ROM_START = 0x200;

/**
 * Clock speed for executing instructions. CHIP-8 does not have a specified
 * clock speed but executing 500 - 600 instructions per second is said to
 * to provide a decent experience.
 */
const CLOCKSPEED = 600;

export default class VM {
  /** Sixteen 8-bit registers named V0 to VF */
  readonly registers: Uint8Array;

  /**
   * CHIP-8 has 4 kilobytes of memory, but the the first 512
   * bytes are traditionally reserved for the interpreter itself
   * so usually programs should be loaded starting from 0x200.
   */
  readonly memory: Uint8Array;

  /** Subroutine stack */
  readonly stack: Array<number>;

  /** Program counter, i.e. the current instruction address */
  counter: number;

  /** 16-bit address register - often referred by just I */
  address: number;

  /** Timers running at 60 hertz - will decrement until 0 */
  delayTimer: number;
  soundTimer: number;

  constructor() {
    this.registers = new Uint8Array(16);
    this.memory = new Uint8Array(0x1000);
    this.counter = ROM_START;
    this.address = 0;
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
  }

  /**
   * Loads the array of bytes into memory and executes the instructions
   * @param {Uint8Array} array of bytes to load to memory
   */
  load(bytes: Uint8Array) {
    //Load ROM into memory starting at 0x200
    for (let [index, _byte] of bytes.entries()) {
      this.memory[ROM_START + index] = _byte;
    }
  }

  /**
   * Executes a single "tick" of the virtual machine. This is meant to be
   * called at 60 times per second because it will decrement the timers which
   * run at 60 hertz. CHIP-8 does does not define a clock speed so in this
   * virtual machine a single tick will execute around 10 instructions, i.e.
   * ~600 instructions per second.
   */
  tick() {
    if (this.delayTimer > 0) {
      this.delayTimer--;
    }
    if (this.soundTimer > 0) {
      this.soundTimer--;
    }
    //Execute multiple instructions
    for (let _ = 0; _ < Math.round(CLOCKSPEED / 60); _++) {
      this.next();
    }
  }

  /** Fetches next instruction from memory and executes it */
  next() {
    this.execute(
      (this.memory[this.counter] << 8) | this.memory[this.counter + 1]
    );
  }

  /** Increment program counter by two memory slots / single opcode */
  incrementCounter() {
    this.counter += 2;
  }

  /**
   * Executes opcode and logs if the opcode is not identified
   * @param {number} opcode Opcode to be executed
   */
  execute(opcode: number) {
    //Shift to get the opcode identifying nibble
    const identifier = opcode & 0xf000;

    try {
      switch (identifier) {
        case 0x1000: //Jump to address
        case 0xb000: //Jump to address formed by adding value and register 0
          instructions.jump(opcode, this);
          break;
        case 0x0000: //Return from subroutine or execute machine language subroutine
        case 0x2000: //Execute subroutine
          instructions.subroutine(opcode, this);
          break;
        case 0x3000: //Skip next instruction if register is equal to value
        case 0x4000: //Skip next instruction if register not equal to value
        case 0x5000: //Skip next instruction if register x equals register y
        case 0x9000: //Skip next instruction if register x does not equal register y
          instructions.skip(opcode, this);
          break;
        case 0x6000: //Set register x to value
        case 0x7000: //Add value to register x
        case 0xc000: //Set register x to bitwise and between value and random number
          instructions.register(opcode, this);
          break;
        case 0x8000: //Various register-to-register operations
          instructions.betweenRegisters(opcode, this);
          break;
        case 0xa000: //Assign value to address register
          instructions.memory(opcode, this);
          break;
        case 0xf000: //Contains a myriad of instructions
          let operation = opcode & 0x00ff;
          switch (operation) {
            case 0x07: //Assign delay timer value to register
            case 0x15: //Assign register value to delay timer
            case 0x18: //Assign register value to sound timer
              instructions.timer(opcode, this);
              break;
            case 0x1e: //Assign register to address register
            case 0x55: //Copy registers to memory
            case 0x65: //Load registers from memory
            case 0x33: //Store register as binary-coded decimal to memory
              instructions.memory(opcode, this);
              break;
            default:
              throw new OpcodeError(
                `Failed to execute misc instruction: ${prettyPrint(opcode)}`
              );
          }
          break;
        default:
          throw new OpcodeError(
            `Failed to execute instruction: ${prettyPrint(opcode)}`
          );
      }
    } catch (e) {
      if (e instanceof OpcodeError) {
        console.warn(e);
      } else {
        throw e;
      }
    }
  }
}

/**
 * Inspects the passed bytes and checks how many unique
 * opcodes there are. This is used for debugging only.
 * @param {Uint8Array} bytes Bytes
 */
function inspect(bytes: Uint8Array) {
  const uniqueOpcodes = new Set<number>(bytes);
}
