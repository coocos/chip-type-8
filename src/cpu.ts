/** ROMs loaded to memory start at 512 bytes in so at 0x200 */
const ROM_START = 0x200;

/**
 * Bit mask for conveniently extracting the register from
 * instructions like 0x6F00 where the F is the identifier
 * of the register
 */
const REGISTER_MASK = 0x0f00;

export default class CPU {
  /** Sixteen 8-bit registers named V0 to VF */
  readonly registers: Uint8Array;

  /**
   * CHIP-8 has 4 kilobytes of memory, but the the first 512
   * bytes are traditionally reserved for the interpreter itself
   * so usually programs should be loaded starting from 0x200.
   */
  readonly memory: Uint8Array;

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
    //Pretty print opcode
    const hex = opcode.toString(16).toUpperCase();

    //Shift to get the opcode identifying nibble
    const identifier = opcode & 0xf000;
    let register, register1, register2;
    let value, operation;
    let sub;
    switch (identifier) {
      case 0x1000: //Jump to address
        this.counter = opcode & 0x0fff;
        break;
      case 0x3000: //Skip next instruction if register is equal to value
        register = (opcode & REGISTER_MASK) >> 8;
        value = opcode & 0x00ff;
        if (this.registers[register] === value) {
          this.incrementCounter();
        }
        this.incrementCounter();
        break;
      case 0x4000: //Skip next instruction if register not equal to value
        register = (opcode & REGISTER_MASK) >> 8;
        value = opcode & 0x00ff;
        if (this.registers[register] !== value) {
          this.incrementCounter();
        }
        this.incrementCounter();
        break;
      case 0x5000: //Skip next instruction if register x equals register y
        register1 = (opcode & 0x0f00) >> 8;
        register2 = (opcode & 0x00f0) >> 4;
        if (this.registers[register1] === this.registers[register2]) {
          this.incrementCounter();
        }
        this.incrementCounter();
        break;
      case 0x6000: //Set register x to value (0x6xnn)
        register = (opcode & REGISTER_MASK) >> 8;
        value = opcode & 0x00ff;
        this.registers[register] = value;
        this.incrementCounter();
        break;
      case 0x7000: //Add value to register x (0x7xnn)
        register = (opcode & REGISTER_MASK) >> 8;
        value = opcode & 0x00ff;
        this.registers[register] = (this.registers[register] + value) % 256;
        this.incrementCounter();
        break;
      case 0x8000: //Various register-to-register operations
        operation = opcode & 0x000f;
        register1 = (opcode & 0x0f00) >> 8;
        register2 = (opcode & 0x00f0) >> 4;
        //It should be safe to increment program counter already here
        //for all sub operations since they do not modify the
        //the program counter
        this.incrementCounter();

        switch (operation) {
          case 0x0: //Assign register y to register x (0x8xy0)
            this.registers[register1] = this.registers[register2];
            break;
          case 0x1: //Assign register x | register y to register x
            this.registers[register1] =
              this.registers[register1] | this.registers[register2];
            break;
          case 0x2: //Assign register x & register y to register x
            this.registers[register1] =
              this.registers[register1] & this.registers[register2];
            break;
          case 0x3: //Assign register x ^ register y to register x
            this.registers[register1] =
              this.registers[register1] ^ this.registers[register2];
            break;
          case 0x4: //Add register x to register y
            const sum = this.registers[register1] + this.registers[register2];
            this.registers[register1] = sum % 256;
            //Set VF to 1 if the register value wrapped around, 0 if not
            this.registers[0xf] = sum >= 256 ? 1 : 0;
            break;
          case 0x5: //Subtract register y from register x
            sub = this.registers[register1] - this.registers[register2];
            this.registers[register1] = sub < 0 ? 256 + sub : sub;
            //Set VF to 0 if the register value wrapped around, 1 if not
            this.registers[0xf] = sub < 0 ? 0 : 1;
            break;
          case 0x6:
            //Shift value of register y right by one bit and assign it to register x
            //Store the least significant bit of register y in VF
            this.registers[register1] = this.registers[register2] >> 1;
            this.registers[0xf] = this.registers[register2] & 0x1;
            break;
          case 0x7: //Subtract register x from register y and assign to register x
            sub = this.registers[register2] - this.registers[register1];
            this.registers[register1] = sub < 0 ? 256 + sub : sub;
            //Set VF to 0 if the register value wrapped around, 1 if not
            this.registers[0xf] = sub < 0 ? 0 : 1;
            break;
          case 0xe:
            //Shift value of register y left by one bit and assign it to register x
            //Store the most significant bit of register y in VF
            this.registers[register1] = (this.registers[register2] << 1) & 0xff;
            this.registers[0xf] = this.registers[register2] >> 7;
            break;
        }
        break;
      case 0x9000: //Skip next instruction if register x does not equal register y
        register1 = (opcode & 0x0f00) >> 8;
        register2 = (opcode & 0x00f0) >> 4;
        if (this.registers[register1] !== this.registers[register2]) {
          this.incrementCounter();
        }
        this.incrementCounter();
        break;
      case 0xa000: //Assign value to address register
        let address = opcode & 0x0fff;
        this.address = address;
        this.incrementCounter();
        break;
      case 0xb000: //Jump to address formed by adding value and register 0
        value = opcode & 0x0fff;
        //Handle 16-bit wrap arounds
        this.counter = (value + this.registers[0]) % 0x10000;
        break;
      case 0xf000: //Miscellaneous instructions including sound and input
        operation = opcode & 0x00ff;
        register = (opcode & 0x0f00) >> 8;
        this.incrementCounter();
        switch (operation) {
          case 0x07: //Assign delay timer value to register
            this.registers[register] = this.delayTimer;
            break;
          case 0x15: //Assign register value to delay timer
            this.delayTimer = this.registers[register];
            break;
          case 0x18: //Assign register value to sound timer
            this.soundTimer = this.registers[register];
            break;
          default:
            console.warn(`Unknown opcode: 0x${hex} (${opcode})`);
            break;
        }
        break;
      default:
        console.warn(`Unknown opcode: 0x${hex} (${opcode})`);
        break;
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
