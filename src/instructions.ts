import VM from "./vm";
import { prettyPrint, randomByte } from "./utils";
import { OpcodeError, StackError } from "./errors";

/** Bitmask for extracting the register from multiple instructions */
const REGISTER_MASK = 0x0f00;
/** Used to wrap numbers since JS does not have unsigned 8-bit integers */
const EIGHT_BIT_WRAP = 0x100;
/** Used to wrap numbers since JS does not have unsigned 16-bit integers */
const SIXTEEN_BIT_WRAP = 0x10000;

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
      register = (opcode & REGISTER_MASK) >> 8;
      value = opcode & 0x00ff;
      if (vm.registers[register] === value) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x4000: //Skip next instruction if register not equal to value
      register = (opcode & REGISTER_MASK) >> 8;
      value = opcode & 0x00ff;
      if (vm.registers[register] !== value) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x5000: //Skip next instruction if register x equals register y
      register1 = (opcode & 0x0f00) >> 8;
      register2 = (opcode & 0x00f0) >> 4;
      if (vm.registers[register1] === vm.registers[register2]) {
        vm.incrementCounter();
      }
      vm.incrementCounter();
      break;
    case 0x9000: //Skip next instruction if register x does not equal register y
      register1 = (opcode & 0x0f00) >> 8;
      register2 = (opcode & 0x00f0) >> 4;
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
      const subroutineAddress = opcode & 0x0fff;
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
      vm.counter = opcode & 0x0fff;
      break;
    case 0xb000: //Jump to address formed by adding value and register 0
      let value = opcode & 0x0fff;
      //Handle 16-bit wrap arounds
      vm.counter = (value + vm.registers[0]) % 0x10000;
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
  const register = (opcode & 0x0f00) >> 8;
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
  const register1 = (opcode & 0x0f00) >> 8;
  const register2 = (opcode & 0x00f0) >> 4;
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
      vm.registers[register1] = sum % EIGHT_BIT_WRAP;
      //Set VF to 1 if the register value wrapped around, 0 if not
      vm.registers[0xf] = sum >= EIGHT_BIT_WRAP ? 1 : 0;
      break;
    case 0x5: //Subtract register y from register x
      sub = vm.registers[register1] - vm.registers[register2];
      vm.registers[register1] = sub < 0 ? EIGHT_BIT_WRAP + sub : sub;
      //Set VF to 0 if the register value wrapped around, 1 if not
      vm.registers[0xf] = sub < 0 ? 0 : 1;
      break;
    case 0x6:
      //Shift value of register y right by one bit and assign it to register x
      //Store the least significant bit of register y in VF
      vm.registers[register1] = vm.registers[register2] >> 1;
      vm.registers[0xf] = vm.registers[register2] & 0x1;
      break;
    case 0x7: //Subtract register x from register y and assign to register x
      sub = vm.registers[register2] - vm.registers[register1];
      vm.registers[register1] = sub < 0 ? EIGHT_BIT_WRAP + sub : sub;
      //Set VF to 0 if the register value wrapped around, 1 if not
      vm.registers[0xf] = sub < 0 ? 0 : 1;
      break;
    case 0xe:
      //Shift value of register y left by one bit and assign it to register x
      //Store the most significant bit of register y in VF
      vm.registers[register1] = (vm.registers[register2] << 1) & 0xff;
      vm.registers[0xf] = vm.registers[register2] >> 7;
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
  const register = (opcode & REGISTER_MASK) >> 8;
  const value = opcode & 0x00ff;
  switch (instruction) {
    case 0x6000: //Set register x to value
      vm.registers[register] = value;
      break;
    case 0x7000: //Add value to register x
      vm.registers[register] =
        (vm.registers[register] + value) % EIGHT_BIT_WRAP;
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
    vm.address = opcode & 0x0fff;
  } else if ((opcode & 0xf0ff) === 0xf01e) {
    //Add register value to address register I
    const register = (opcode & 0x0f00) >> 8;
    const newAddress = vm.address + vm.registers[register];
    vm.address = newAddress % SIXTEEN_BIT_WRAP;
  } else {
    throw new OpcodeError(
      `Failed to decode memory instruction: ${prettyPrint(opcode)}`
    );
  }
}
