import * as instructions from "./instructions";
import { prettyPrint, nibble } from "./utils";
import { OpcodeError } from "./errors";
import { getFontSprites } from "./fonts";
import Display from "./display";
import Input from "./input";

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

  /** HP48 flags - used by Super Chip-48 only */
  readonly flags: Uint8Array;

  /**
   * CHIP-8 has 4 kilobytes of memory, but the the first 512
   * bytes are traditionally reserved for the interpreter itself
   * so usually programs should be loaded starting from 0x200.
   */
  readonly memory: Uint8Array;

  /** Subroutine stack */
  readonly stack: Array<number>;

  /** Display used to render sprites */
  readonly display: Display;

  /** Input handler */
  readonly input: Input;

  /** Program counter, i.e. the current instruction address */
  counter: number;

  /** 16-bit address register - often referred by just I */
  address: number;

  /** Timers running at 60 hertz - will decrement until 0 */
  delayTimer: number;
  soundTimer: number;

  /** Is virtual machine waiting for input before proceeding */
  waitingForInput: boolean;

  constructor(display: Display, input: Input = new Input()) {
    this.registers = new Uint8Array(16);
    this.flags = new Uint8Array(8);
    this.memory = new Uint8Array(0x1000);
    this.counter = ROM_START;
    this.address = 0;
    this.stack = [];
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = display;
    this.input = input;
    this.waitingForInput = false;
    this.loadFonts();
  }

  /** Load font sprite data to memory. Fonts are placed in a memory location
   * that applications won't use - the very beginning of the memory space.
   */
  private loadFonts() {
    const fontData = getFontSprites();
    for (let address = 0; address < fontData.length; address++) {
      this.memory[address] = fontData[address];
    }
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
    /**
     * Timers are only decremented if virtual machine is not waiting for an
     * input event. It's safe to try to execute instructions even when waiting
     * for an input as the program counter will not move beyond the instruction
     * which waits for the input.
     */
    if (!this.waitingForInput) {
      if (this.delayTimer > 0) {
        this.delayTimer--;
      }
      if (this.soundTimer > 0) {
        this.soundTimer--;
      }
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

  /** Returns whether input key is pressed */
  isKeyPressed(key: string) {
    return this.input.isPressed(key);
  }

  /**
   * Executes opcode and logs if the opcode is not identified
   * @param {number} opcode Opcode to be executed
   */
  execute(opcode: number) {
    //Most opcodes can be identified by the first nibble
    const identifier = opcode & 0xf000;

    switch (identifier) {
      case 0x1000: //Jump to address
      case 0xb000: //Jump to address formed by adding value and register 0
        instructions.jump(opcode, this);
        break;
      case 0x0000: //Multiple instructions related to display and subroutines
        switch (opcode) {
          case 0x00e0: //Clear screen
            instructions.display(opcode, this);
            break;
          case 0x00ee: //Return from subroutine
          default:
            //Execute machine language subroutine
            instructions.subroutine(opcode, this);
            break;
        }
        break;
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
      case 0xd000: //Draw sprite
        instructions.display(opcode, this);
        break;
      case 0xe000: //Handle input
        instructions.input(opcode, this);
        break;
      case 0xf000: //Contains a myriad of instructions
        let operation = opcode & 0x00ff;
        switch (operation) {
          case 0x0a: //Wait for input
            instructions.input(opcode, this);
            break;
          case 0x07: //Assign delay timer value to register
          case 0x15: //Assign register value to delay timer
          case 0x18: //Assign register value to sound timer
            instructions.timer(opcode, this);
            break;
          case 0x1e: //Assign register to address register
          case 0x29: //Assign font sprite location to address register
          case 0x33: //Store register as binary-coded decimal to memory
          case 0x55: //Copy registers to memory
          case 0x65: //Load registers from memory
            instructions.memory(opcode, this);
            break;
          case 0x75: //HP48 instruction only - store registers to flags
            for (let i = 0; i <= nibble(opcode).second(); i++) {
              this.flags[i] = this.registers[i];
            }
            this.incrementCounter();
            break;
          case 0x85: //HP48 instruction only - load registers from flags
            for (let i = 0; i <= nibble(opcode).second(); i++) {
              this.registers[i] = this.flags[i];
            }
            this.incrementCounter();
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
  }
}
