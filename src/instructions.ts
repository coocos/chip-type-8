import VM from "./vm";
import { prettyPrint, randomByte, nibble, bcd } from "./utils";
import { OpcodeError, StackError } from "./errors";
import { keyMap } from "./input";

/** Max values for 8-bit and 16-bit unsigned integers - used for carry flags */
const EIGHT_BIT_WRAP = 0x100;
const SIXTEEN_BIT_WRAP = 0x1000;

/**
 * Decodes instructions related to conditional skipping and updates the state
 * of the virtual machine program counter
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function skip(opcode: number, vm: VM) {
  const identifier = opcode & 0xf000;
  let register: number, register1: number, register2: number, value: number;
  switch (identifier) {
    case 0x3000: //Skip next instruction if register is equal to value
      register = nibble(opcode).second();
      value = opcode & 0x00ff;
      if (vm.registers[register] === value) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x4000: //Skip next instruction if register not equal to value
      register = nibble(opcode).second();
      value = opcode & 0x00ff;
      if (vm.registers[register] !== value) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x5000: //Skip next instruction if register x equals register y
      register1 = nibble(opcode).second();
      register2 = nibble(opcode).third();
      if (vm.registers[register1] === vm.registers[register2]) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x9000: //Skip next instruction if register x does not equal register y
      register1 = nibble(opcode).second();
      register2 = nibble(opcode).third();
      if (vm.registers[register1] !== vm.registers[register2]) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    default:
      throw new OpcodeError(
        `Failed to decode skip instruction: ${prettyPrint(opcode)}`
      );
  }
}

/**
 * Decodes instructions for executing subroutines.
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function subroutine(opcode: number, vm: VM) {
  //The instruction for returning from a subroutine is the constant 0x00ee
  //but the other instructions here are not constants - this is just
  //a not-so-great workaround for handling the constant in the same
  //switch-case structure as the other instructions
  const identifier = opcode != 0xee ? opcode & 0xf000 : opcode;
  switch (identifier) {
    case 0x0000: //Execute machine language subroutine at address
      //NOTE: Not implemented by design - this instruction is considered
      //deprecated.
      vm.incrementCounter();
      break;
    case 0x00ee: //Return from subroutine
      const address = vm.stack.pop();
      //No subroutine has been called but an attempt to exit a subroutine was
      //was made - should not happen with a valid CHIP-8 program
      if (address === undefined) {
        throw new StackError();
      }
      //Restore program execution at the instruction just after the call to
      //execute a subroutine
      vm.counter = address;
      vm.incrementCounter();
      break;
    case 0x2000: //Call subroutine at address
      const subroutineAddress = nibble(opcode).without.first();
      //Push current program counter to the stack and set the counter to
      //subroutine address specified by the instruction
      vm.stack.push(vm.counter);
      vm.counter = subroutineAddress;
      break;
    default:
      throw new OpcodeError(
        `Failed to decode subroutine instruction: ${prettyPrint(opcode)}`
      );
  }
}

/**
 * Decodes instructions related to jumping to an address and updates the
 * virtual machine program counter to point to the new address
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function jump(opcode: number, vm: VM) {
  const identifier = opcode & 0xf000;
  switch (identifier) {
    case 0x1000: //Jump to address
      vm.counter = nibble(opcode).without.first();
      break;
    case 0xb000: //Jump to address formed by adding value and register 0
      let value = nibble(opcode).without.first();
      vm.counter = value + vm.registers[0];
      if (vm.counter >= SIXTEEN_BIT_WRAP) {
        throw new Error("Program counter corrupted");
      }
      break;
    default:
      throw new OpcodeError(
        `Failed to decode jump instruction: ${prettyPrint(opcode)}`
      );
  }
}

/**
 * Decodes instructions related to modifying the virtual machine timers
 * and updates the timers
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function timer(opcode: number, vm: VM) {
  const operation = opcode & 0x00ff;
  const register = nibble(opcode).second();
  switch (operation) {
    case 0x07: //Assign delay timer value to register
      vm.registers[register] = vm.delayTimer;
      break;
    case 0x15: //Assign register value to delay timer
      vm.delayTimer = vm.registers[register];
      break;
    case 0x18: //Assign register value to sound timer
      vm.soundTimer = vm.registers[register];
      break;
    default:
      throw new OpcodeError(
        `Failed to decode timer instruction: ${prettyPrint(opcode)}`
      );
  }
  vm.incrementCounter();
}

/**
 * Decodes instructions related to operations between different registers
 * and updates the registers and the virtual machine according to the
 * instructions
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function betweenRegisters(opcode: number, vm: VM) {
  const operation = opcode & 0x000f;
  const register1 = nibble(opcode).second();
  const register2 = nibble(opcode).third();
  let sub;

  switch (operation) {
    case 0x0: //Assign register y to register x (0x8xy0)
      vm.registers[register1] = vm.registers[register2];
      break;
    case 0x1: //Assign register x | register y to register x
      vm.registers[register1] =
        vm.registers[register1] | vm.registers[register2];
      break;
    case 0x2: //Assign register x & register y to register x
      vm.registers[register1] =
        vm.registers[register1] & vm.registers[register2];
      break;
    case 0x3: //Assign register x ^ register y to register x
      vm.registers[register1] =
        vm.registers[register1] ^ vm.registers[register2];
      break;
    case 0x4: //Add register x to register y
      const sum = vm.registers[register1] + vm.registers[register2];
      vm.registers[register1] = sum;
      //Set VF to 1 if the register value wrapped around, 0 if not
      vm.registers[0xf] = sum >= EIGHT_BIT_WRAP ? 1 : 0;
      break;
    case 0x5: //Subtract register y from register x
      sub = vm.registers[register1] - vm.registers[register2];
      vm.registers[register1] = sub;
      //Set VF to 0 if the register value wrapped around, 1 if not
      vm.registers[0xf] = sub < 0 ? 0 : 1;
      break;
    case 0x6:
      /**
       * This should shift value of register y right by one bit and assign it
       * to register x. However it seems like most implementations actually
       * just shift the register x right by one bit and store the least
       * significant bit prior to the sift in register VF.
       */
      vm.registers[0xf] = vm.registers[register1] & 0x1;
      vm.registers[register1] = vm.registers[register1] >> 1;
      break;
    case 0x7: //Subtract register x from register y and assign to register x
      sub = vm.registers[register2] - vm.registers[register1];
      vm.registers[register1] = sub;
      //Set VF to 0 if the register value wrapped around, 1 if not
      vm.registers[0xf] = sub < 0 ? 0 : 1;
      break;
    case 0xe:
      /**
       * This should shift value of register y left by one bit and assign it
       * to register x. However it seems like most implementations actually
       * just shift the register y left by one bit and store the most
       * significant bit prior to the shift in register VF.
       */
      vm.registers[0xf] = vm.registers[register1] >> 7;
      vm.registers[register1] = (vm.registers[register1] << 1) & 0xff;
      break;
    default:
      throw new OpcodeError(
        `Failed to decode register instruction: ${prettyPrint(opcode)}`
      );
  }
  vm.incrementCounter();
}

/**
 * Decodes instructions related to operations for modifying a single register
 * and updates the register and virtual machine according to the instructions
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function register(opcode: number, vm: VM) {
  const instruction = opcode & 0xf000;
  const register = nibble(opcode).second();
  const value = opcode & 0x00ff;
  switch (instruction) {
    case 0x6000: //Set register x to value
      vm.registers[register] = value;
      break;
    case 0x7000: //Add value to register x
      vm.registers[register] += value;
      break;
    case 0xc000: //Set register to bitwise and between value and random number
      vm.registers[register] = opcode & 0x00ff & randomByte();
      break;
    default:
      throw new OpcodeError(
        `Failed to decode register instruction: ${prettyPrint(opcode)}`
      );
  }
  vm.incrementCounter();
}

/**
 * Decodes instructions related to the address register I
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function memory(opcode: number, vm: VM) {
  const identifier = opcode & 0xf000;

  if (identifier === 0xa000) {
    //Assign memory address to address register I
    vm.address = nibble(opcode).without.first();
  } else if (nibble(opcode).without.second() === 0xf01e) {
    //Add register value to address register I
    const register = nibble(opcode).second();
    const newAddress = vm.address + vm.registers[register];
    //Mark register register flow in register f
    vm.registers[0xf] = newAddress >= SIXTEEN_BIT_WRAP ? 1 : 0;
    vm.address = newAddress % SIXTEEN_BIT_WRAP;
  } else if (nibble(opcode).without.second() === 0xf055) {
    /**
     * Copy registers to memory starting from the address in the address
     * register. The last register to be copied is dictated by the second
     * byte of the instruction. For example 0xFA55 would copy the registers
     * 0 to A to memory starting from the address stored in address register I.
     */
    const lastRegister = nibble(opcode).second();
    for (let register = 0; register <= lastRegister; register++) {
      vm.memory[vm.address] = vm.registers[register];
      vm.address++;
    }
  } else if (nibble(opcode).without.second() === 0xf065) {
    /**
     * Load register contents from memory starting from the address in the
     * address register. The last register to be loaded is dictated by the
     * second byte of the instruction.
     */
    const lastRegister = nibble(opcode).second();
    for (let register = 0; register <= lastRegister; register++) {
      vm.registers[register] = vm.memory[vm.address];
      vm.address++;
    }
  } else if (nibble(opcode).without.second() === 0xf033) {
    /**
     * Load register value to memory as a binary-coded decimal. The value
     * is stored in three consecutive memory slots starting from the address
     * in address register I. For example 0xFF would be stored in consecutive
     * memory slots as values 2, 5 and 5.
     */
    const register = nibble(opcode).second();
    const binaryCodedDigits = bcd(vm.registers[register]);
    for (let offset = 0; offset < 3; offset++) {
      vm.memory[vm.address + offset] = binaryCodedDigits[offset];
    }
  } else if (nibble(opcode).without.second() === 0xf029) {
    /**
     * Set address register to location of the font sprite. Font sprites are
     * loaded by the interpreter to 0x0 and onwards with 5 bytes of allocated
     * for each font. The second nibble of the opcode identifies the register
     * which stores the requested font.
     */
    const register = nibble(opcode).second();
    const font = vm.registers[register];
    vm.address = font * 5;
  } else {
    throw new OpcodeError(
      `Failed to decode memory instruction: ${prettyPrint(opcode)}`
    );
  }
  vm.incrementCounter();
}

/**
 * Decodes instructions related to rendering sprites to a display
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function display(opcode: number, vm: VM) {
  const nibbles = nibble(opcode);
  //Clear screen
  if (opcode === 0x00e0) {
    vm.display.clear();
  } else if (nibbles.first() === 0xd) {
    /**
     * Draw a sprite by reading sprite data from address register and drawing
     * the sprite to the coordinate specified in registers x and y.
     *
     * The second nibble of the instruction defines the register which stores the x
     * coordinate and the third nibble the register which stores the y coordinate.
     * The fourth nibble defines how many bytes should be read from the address
     * register, i.e. how tall the sprite is as each byte corresponds to a row of
     * 8 pixels.
     */
    const spriteByteCount = nibbles.fourth();
    const spriteBytes = vm.memory.slice(
      vm.address,
      vm.address + spriteByteCount
    );
    const xCoordinate = vm.registers[nibbles.second()];
    const yCoordinate = vm.registers[nibbles.third()];
    const pixelsFlipped = vm.display.drawSprite(
      xCoordinate,
      yCoordinate,
      spriteBytes
    );
    //If any non-empty pixels were flipped to empty when the sprite was
    //drawn then set register F to 1. Otherwise set it to 0
    vm.registers[0xf] = pixelsFlipped ? 1 : 0;
  } else {
    throw new OpcodeError(
      `Failed to decode display instruction: ${prettyPrint(opcode)}`
    );
  }
  vm.incrementCounter();
}

/**
 * Decodes instructions related to input handling
 * @param {number} opcode Opcode / instruction
 * @param {VM} vm Virtual machine
 */
export function input(opcode: number, vm: VM) {
  const nibbles = nibble(opcode);
  const identifier = nibbles.without.second();
  const register = nibbles.second();
  const key = vm.registers[register];
  switch (identifier) {
    case 0xf00a:
      vm.waitingForInput = true;
      //If any key is pressed then the virtual machine can proceed
      for (let currentKey of Object.keys(keyMap)) {
        if (vm.isKeyPressed(keyMap[currentKey])) {
          vm.waitingForInput = false;
          vm.registers[register] = keyMap[currentKey];
          vm.incrementCounter();
          break;
        }
      }
      break;
    case 0xe0a1:
      /**
       * If the key stored in register is currently not pressed then
       * skip the following instruction
       */
      if (!vm.isKeyPressed(key)) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0xe09e:
      /**
       * If the key stored in register is currently pressed then
       * skip the following instruction
       */
      if (vm.isKeyPressed(key)) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    default:
      throw new OpcodeError(
        `Failed to decode input instruction: ${prettyPrint(opcode)}`
      );
  }
}
