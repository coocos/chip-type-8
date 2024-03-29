import "mocha";
import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";

import { stubCanvas, stubKeys } from "./stubs";

import VM from "../src/core/vm";
import Display from "../src/core/display";
import Input from "../src/core/input";
import * as utils from "../src/core/utils";

/**
 * Initializes virtual machine with array of instructions
 * @param {Array<number>} opcodes Array of opcodes
 * @return {VM} Initialized virtual machine
 */
function initializeVm(opcodes: number[]): VM {
  //Stub DOM methods required by display and input for virtual machine tests
  (<any>global).document = Object.assign({}, stubKeys(), stubCanvas());
  const input = new Input();
  const display = new Display("#display");

  //Transform 16-bit opcodes to 8-bit bytes so they fit to memory
  const bytes = opcodes.reduce((bytes, opcode) => {
    const firstByte = opcode >> 8;
    const secondByte = opcode & 0x00ff;
    return new Uint8Array([...bytes, firstByte, secondByte]);
  }, new Uint8Array([]));

  //Initialize virtual machine
  const vm = new VM(display, input);
  vm.load(bytes);
  return vm;
}

/**
 * Executes function n times - used to execute multiple opcodes at once
 * @param {number} count How many times to execute the function
 * @param {Function} fn Function to execute
 */
function times(count: number, fn: Function) {
  for (let i = 0; i < count; i++) {
    fn();
  }
}

describe("Virtual machine", () => {
  describe("general logic", () => {
    it("should initialize memory at proper location", () => {
      //Load instructions to set register and check that the instructions
      //were stored the start of the application memory area
      const vm = initializeVm([0x6aff]);
      vm.next();
      expect(vm.memory[0x200]).to.equal(0x6a);
      expect(vm.memory[0x201]).to.equal(0xff);
    });
  });
  describe("input instruction", () => {
    it("should skip a code block depending on the input", () => {
      const vm = initializeVm([
        0x6a0f, //Assign 0xf to register a
        0xea9e, //Skip next instruction if 0xf is pressed
        0xea9e, //Skip next instruction if 0xf is pressed
        0x6b0f, //Assign 0xf to register b - should not happen
        0xeaa1, //Skip next instruction if 0xf is not pressed
        0xeaa1 //Skip next instruction if 0xf is not pressed
      ]);
      const keys = stubKeys();
      times(2, () => vm.next());
      expect(vm.counter).to.equal(0x204);
      //Press the key and execute the same instruction again
      document.dispatchEvent(<KeyboardEvent>{ type: "keydown", key: "v" });
      vm.next();
      //Key is pressed - next instruction should be skipped
      expect(vm.counter).to.equal(0x208);
      expect(vm.registers[0xb]).to.equal(0x0);
      //Key is pressed - next instruction should not be skipped
      vm.next();
      expect(vm.counter).to.equal(0x20a);
      //Lift key - next instruction should be skipped
      document.dispatchEvent(<KeyboardEvent>{ type: "keyup", key: "v" });
      vm.next();
      expect(vm.counter).to.equal(0x20e);
    });
    it("should wait until a key is pressed before proceeding", () => {
      const vm = initializeVm([
        0x6a0f, //Assign 0xF to register VA
        0xfa0a //Wait for input and store it to register VA
      ]);
      const keys = stubKeys();
      //Store value in register and then wait for input
      times(2, () => vm.next());
      expect(vm.counter).to.equal(0x202);
      expect(vm.registers[0xa]).to.equal(0xf);
      //Executing more instructions should not modify the state of the virtual
      //machine as the virtual machine is still waiting for input
      times(10, () => vm.next());
      expect(vm.counter).to.equal(0x202);
      expect(vm.registers[0xa]).to.equal(0xf);
      //Pressing a key should advance the virtual machine
      document.dispatchEvent(<KeyboardEvent>{ type: "keydown", key: "a" });
      vm.next();
      expect(vm.registers[0xa]).to.equal(0x7);
      expect(vm.counter).to.equal(0x204);
    });
  });
  describe("register instruction", () => {
    it("should set value to register", () => {
      //Check setting register VB to 0xFF
      const vm = initializeVm([0x6bff]);
      vm.next();
      expect(vm.registers[0xb]).to.equal(0xff);
    });
    it("should add to register", () => {
      const vm = initializeVm([0x7dff, 0x7d02]);
      //Add 0xFF to empty register VD and check the register
      vm.next();
      expect(vm.registers[0xd]).to.equal(0xff);
      //Add 0x2 to register VD and check that 8-bit overflow was handled
      vm.next();
      expect(vm.registers[0xd]).to.equal(0x1);
    });
    it("should assign register to register", () => {
      const vm = initializeVm([0x6bee, 0x8ab0]);
      //Set register VA to 0xEE
      vm.next();
      expect(vm.registers[0xb]).to.equal(0xee);
      expect(vm.registers[0xa]).to.equal(0);
      //Assign register VA to VB
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xee);
    });
    it("should assign random & value to register", () => {
      //Stub random generator to always generate the same number
      sinon.stub(utils, "randomByte").returns(0xff);

      const vm = initializeVm([0xcaee]);
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xff & 0xee);
    });
    it("should assign register | register to register", () => {
      const vm = initializeVm([0x6bcd, 0x6a12, 0x8ba1]);
      //Assign to registers VB and VA
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0xcd);
      expect(vm.registers[0xa]).to.equal(0x12);
      //Assign register to register with bitwise or
      vm.next();
      expect(vm.registers[0xb]).to.equal(0xcd | 0x12);
    });
    it("should assign register & register to register", () => {
      const vm = initializeVm([0x6bcd, 0x6a12, 0x8ba2]);
      //Assign to registers VB and VA
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0xcd);
      expect(vm.registers[0xa]).to.equal(0x12);
      //Assign register to register with bitwise and
      vm.next();
      expect(vm.registers[0xb]).to.equal(0xcd & 0x12);
    });
    it("should assign register ^ register to register", () => {
      const vm = initializeVm([0x6bcd, 0x6a12, 0x8ba3]);
      //Assign to registers VB and VA
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0xcd);
      expect(vm.registers[0xa]).to.equal(0x12);
      //Assign register to register with bitwise xor
      vm.next();
      expect(vm.registers[0xb]).to.equal(0xcd ^ 0x12);
    });
    it("should add register to register and set the carry flag", () => {
      const vm = initializeVm([0x6af0, 0x6b01, 0x8ab4, 0x8aa4]);
      //Assign to registers VA and VB
      times(2, () => vm.next());
      expect(vm.registers[0xa]).to.equal(0xf0);
      expect(vm.registers[0xb]).to.equal(0x01);
      //Add register to register and check that carry flag is not set
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xf1);
      expect(vm.registers[0xf]).to.equal(0x0);
      //Add register to itself and check that carry flag is set
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xe2);
      expect(vm.registers[0xf]).to.equal(0x1);
    });
    it("should subtract register y from register x and set the borrow flag", () => {
      const vm = initializeVm([0x6a02, 0x6b01, 0x6c02, 0x8ab5, 0x8ac5]);
      //Assign to registers VA, VB and VC
      times(3, () => vm.next());
      expect(vm.registers[0xa]).to.equal(0x02);
      expect(vm.registers[0xb]).to.equal(0x1);
      expect(vm.registers[0xc]).to.equal(0x02);
      //Subtract register from register and check that borrow flag is set correctly
      vm.next();
      expect(vm.registers[0xa]).to.equal(0x1);
      expect(vm.registers[0xf]).to.equal(0x1);
      //Subtract register from register and check that borrow flag is set correctly
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xff);
      expect(vm.registers[0xf]).to.equal(0x0);
    });
    it("should subtract register x from register y and set the borrow flag", () => {
      const vm = initializeVm([0x6a03, 0x6b04, 0x6c00, 0x8ab7, 0x8ac7]);
      //Assign to registers VA, VB and VC
      times(3, () => vm.next());
      expect(vm.registers[0xa]).to.equal(0x03);
      expect(vm.registers[0xb]).to.equal(0x04);
      expect(vm.registers[0xc]).to.equal(0x0);
      //Subtract register from register and check that borrow flag is set
      vm.next();
      expect(vm.registers[0xa]).to.equal(0x1);
      expect(vm.registers[0xf]).to.equal(0x1);
      //Subtract register from register and check that borrow flag is not set
      vm.next();
      expect(vm.registers[0xa]).to.equal(0xff);
      expect(vm.registers[0xf]).to.equal(0x0);
    });
    it("should shift register right by one bit", () => {
      const vm = initializeVm([
        0x6bee, //Store 0xEE in register VB (least significant bit is 0)
        0x8bb6, //Shift register VB right by one bit
        0x6bff, //Store 0xFF in register VB (least significant bit is 1)
        0x8bb6 //Shift register VB right by one bit
      ]);
      //Register VB should be shifted right and register VF should be 0
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0x77);
      expect(vm.registers[0xf]).to.equal(0x0);
      //Register VB should be shifted right and register VF should be 1
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0x7f);
      expect(vm.registers[0xf]).to.equal(0x1);
    });
    it("should shift register left by one bit", () => {
      const vm = initializeVm([
        0x6bee, //Store 0xEE in register VB (most significant bit is 1)
        0x8bbe, //Shift register VB left by one bit
        0x6b7f, //Store 0x7F in register VB (most significant bit is 0)
        0x8bbe //Shift register VB left by one bit
      ]);
      //Register VB should be shifted left and register VF should be 1
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0xdc);
      expect(vm.registers[0xf]).to.equal(0x1);
      //Register VB should be shifted left and register VF should be 0
      times(2, () => vm.next());
      expect(vm.registers[0xb]).to.equal(0xfe);
      expect(vm.registers[0xf]).to.equal(0x0);
    });
  });
  describe("skip instruction", () => {
    it("should skip next instruction if register x does not equal register y", () => {
      const vm = initializeVm([0x6aff, 0x6bff, 0x9ab0, 0x6bfe, 0x9ab0]);
      //Check that upon initialization the program counter is at the right address
      expect(vm.counter).to.be.equal(0x200);
      //Check after register assignments that the program counter is correct
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x204);
      //Check that the conditional did not occur since the registers are equal
      vm.next();
      expect(vm.counter).to.be.equal(0x206);
      //Set registers to be unequal and check that skip occurs
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x20c);
    });
    it("should skip next instruction if register x equals registers y", () => {
      const vm = initializeVm([0x6aff, 0x6bfe, 0x5ab0, 0x6bff, 0x5ab0]);
      //Check after register assignments that the program counter is correct
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x204);
      //Check that the skip did not occur since the registers are not equal
      vm.next();
      expect(vm.counter).to.be.equal(0x206);
      //Set registers to be equal and check that skip occurs
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x20c);
    });
    it("should skip next instruction if register equals value", () => {
      const vm = initializeVm([0x6aff, 0x3aff, 0x0, 0x3afe]);
      //Check that the VM skipped the third instruction
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x206);
      //Check that the VM did not skip - register does not match the value
      vm.next();
      expect(vm.counter).to.be.equal(0x208);
    });
    it("should skip next instruction if register does not equal value", () => {
      const vm = initializeVm([0x6aff, 0x4afe, 0x0, 0x4aff]);
      //Check that the VM skipped the third instruction
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x206);
      //Check that the VM did not skip - register does match the value
      vm.next();
      expect(vm.counter).to.be.equal(0x208);
    });
  });
  describe("jump instruction", () => {
    it("should jump to address formed by adding value and register 0", () => {
      const vm = initializeVm([0xb204, 0x0, 0x60ff, 0xb2ff]);
      //Check that jumping works when register 0 is empty
      vm.next();
      expect(vm.counter).to.be.equal(0x204);
      //Check that jumping works when register 0 is not empty
      times(2, () => vm.next());
      expect(vm.registers[0x0]).to.be.equal(0xff);
      expect(vm.counter).to.be.equal(0x2ff + 0xff);
    });
    it("should jump to address", () => {
      const vm = initializeVm([0x1206, 0x0, 0x0, 0x60ff]);
      times(2, () => vm.next());
      //Check that program counter has jumped over 2 instructions
      expect(vm.counter).to.be.equal(0x208);
      //Check that the last instruction was executed
      expect(vm.registers[0x0]).to.be.equal(0xff);
    });
  });
  describe("timer instruction", () => {
    it("should assign register value to delay timer", () => {
      const vm = initializeVm([0x6a3c, 0xfa15]);
      expect(vm.delayTimer).to.be.equal(0x0);
      times(2, () => vm.next());
      expect(vm.registers[0xa]).to.be.equal(0x3c);
      expect(vm.delayTimer).to.be.equal(vm.registers[0xa]);
    });
    it("should assign register value to sound timer", () => {
      const vm = initializeVm([0x6a3c, 0xfa18]);
      expect(vm.soundTimer).to.be.equal(0x0);
      times(2, () => vm.next());
      expect(vm.registers[0xa]).to.be.equal(0x3c);
      expect(vm.soundTimer).to.be.equal(vm.registers[0xa]);
    });
    it("should assign delay timer value to register", () => {
      const vm = initializeVm([0x6a0f, 0xfa15, 0xfb07]);
      expect(vm.registers[0xb]).to.be.equal(0x0);
      times(3, () => vm.next());
      expect(vm.registers[0xa]).to.be.equal(0x0f);
      expect(vm.registers[0xb]).to.be.equal(vm.delayTimer);
    });
  });
  describe("subroutine instruction", () => {
    it("should execute subroutine at a specific address", () => {
      const vm = initializeVm([0x2210]);
      vm.next();
      expect(vm.counter).to.be.equal(0x210);
    });
    it("should execute subroutine and return from subroutine", () => {
      const vm = initializeVm([0x2206, 0x6aff, 0x6bff, 0x6cff, 0x00ee]);
      times(2, () => vm.next());
      expect(vm.counter).to.be.equal(0x208);
      vm.next();
      expect(vm.registers[0xc]).to.be.equal(0xff);
      expect(vm.counter).to.be.equal(0x202);
      times(2, () => vm.next());
      expect(vm.registers[0xa]).to.be.equal(0xff);
      expect(vm.registers[0xb]).to.be.equal(0xff);
    });
  });
  describe("memory instruction", () => {
    it("should set value to address register I", () => {
      const vm = initializeVm([0xa123]);
      expect(vm.address).to.be.equal(0x0);
      vm.next();
      expect(vm.address).to.be.equal(0x123);
    });
    it("should add register to address register I", () => {
      const vm = initializeVm([0x6aff, 0xfa1e]);
      times(2, () => vm.next());
      expect(vm.address).to.equal(0xff);
    });
    it("should copy registers to memory starting at address in register I", () => {
      //Generate instructions to set all registers from 0 to F to unique values,
      //i.e. instructions 0x6000, 0x6101, 0x6202 all the way up to F
      const opcodes = _.range(16).map(reg => 0x6000 | (reg << 8) | reg);
      //Set all registers and address register I and copy registers to memory
      const vm = initializeVm([...opcodes, 0xa300, 0xff55]);
      times(18, () => vm.next());
      //Check that the registers have been set
      for (let register = 0; register < 0xf; register++) {
        expect(vm.registers[register]).to.equal(register);
      }
      //Check that the registers have been copied to memory
      for (let address = 0x300; address <= 0x30f; address++) {
        expect(vm.memory[address]).to.equal(vm.registers[address & 0x00f]);
      }
      //Check that the memory beyond the register area was not filled
      expect(vm.memory[0x310]).to.equal(0x0);
      //Check that address register has not been incremented
      expect(vm.address).to.equal(0x300);
    });
    it("should load registers from memory starting at address in register I", () => {
      //Generate unique values for all registers - these should be loaded into registers
      const registerValues = _.range(8).map(value => {
        /**
         * The virtual machine is usually initialized with 16-bit instructions in
         * these tests so the initialization function assumes that the values to
         * be loaded into memory are 16-bit values. However in this case we want
         * to load 8-bit values into the memory so combine the 8-bit values into
         * 16-bit pairwise values like 0x0102, 0x0304, 0x0506 and so on. This way
         * the values get inserted into memory as 0x01, 0x02, 0x03, 0x04 and so on.
         */
        return ((value * 2) << 8) | (value * 2 + 1);
      });
      //Set address register to point to the values in memory and load values from
      //memory to registers - all register should be filled after this
      const vm = initializeVm([0xa208, 0xff65, 0x0, 0x0, ...registerValues]);
      times(2, () => vm.next());
      //Registers should now contain the values loaded from memory
      for (let register = 0; register <= 0xf; register++) {
        expect(vm.registers[register]).to.equal(register);
      }
      //Address register should not have been incremented
      expect(vm.address).to.equal(0x208);
    });
    it("should store register value as binary-coded decimal in memory", () => {
      /**
       * Set register A to 0x7B, set address register I to 0x300 and check that
       * the value of register A was stored as a binary-coded decimal in memory
       * at addresses 0x300, 0x301 and 0x302. One digit should be stored at each
       * location so 0x300 should contain 1, 0x301 2 and 0x302 3.
       */
      const vm = initializeVm([0x6a7b, 0xa300, 0xfa33]);
      times(3, () => vm.next());
      //Registers A and address register I should contain the expected values
      expect(vm.registers[0xa]).to.equal(0x7b);
      expect(vm.address).to.equal(0x300);
      //Memory should now contain the BCD value
      for (let value = 0; value < 3; value++) {
        expect(vm.memory[0x300 + value]).to.equal(value + 1);
      }
    });
    it("should set address register I to point to font sprites", () => {
      const vm = initializeVm([
        0x6000, //Insert 0x0 to register 0
        0xf029, //Point address register to the font 0 in register 0
        0x600f, //Insert 0xf to register 0
        0xf029 //Point address register to the font F in register 0
      ]);
      //Font data should be loaded to memory during startup
      const zeroFont = Uint8Array.from([0xf0, 0x90, 0x90, 0x90, 0xf0]);
      expect(vm.memory.slice(0, 5)).to.deep.equal(zeroFont);
      //Address register should get updated to the location of the 0 font
      times(2, () => vm.next());
      expect(vm.address).to.equal(0x0);
      //Address register should get updated to the location of the f font
      times(2, () => vm.next());
      expect(vm.address).to.equal(0x4b);
    });
  });
  describe("display instruction", () => {
    it("should clear the screen", () => {
      const vm = initializeVm([0x00e0]);
      sinon.spy(vm.display, "clear");
      vm.next();
      expect(vm.display.clear).to.have.property("calledOnce", true);
    });
    it("should read and draw sprite from memory", () => {
      const vm = initializeVm([
        0x6000, //Assign 0x0 to register 0
        0x6101, //Assign 0x1 to register 1
        0x6205, //Assign 0x5 to register 2
        0xa214, //Assign address 0x214 to address register I
        0xd202, //Draw 2 bytes worth of sprites from register I to (5, 0)
        0xa216, //Assing address 0x216 to address register I
        0xd211, //Draw a single sprite byte from register I to (5, 1)
        0x00e0, //Clear screen (dummy instruction to pad memory)
        0x00e0, //Clear screen (dummy instruction to pad memory)
        0x00e0, //Clear screen (dummy instruction to pad memory)
        0xff0f, //Sprite data (row with 8 non-empty pixels and row with 4 non-empty pixels)
        0x0100 //Sprite data (row with 7 empty pixels and 1 non-empty pixel)
      ]);
      const drawSprite = sinon.spy(vm.display, "drawSprite");

      //Assign pixel coordinates to registers
      times(3, () => vm.next());

      //Check that the virtual machine handles first sprite correctly
      times(2, () => vm.next());
      expect(drawSprite).to.have.property("calledOnce", true);
      let expectedArgs = [5, 0, Uint8Array.from([0xff, 0xf])];
      expect(drawSprite.calledWith(...expectedArgs)).to.be.true;
      //Drawing the sprite should not cause any flipped pixels
      expect(vm.registers[0xf]).to.equal(0);

      //Check that the virtual machine handles the second sprite correctly
      expectedArgs = [5, 1, Uint8Array.from([0x01])];
      times(2, () => vm.next());
      expect(drawSprite).to.have.property("calledTwice", true);
      expect(drawSprite.calledWith(...expectedArgs)).to.be.true;
      //Drawing the sprite should cause a flipped pixel since it overlaps
      //the previously drawn sprite
      expect(vm.registers[0xf]).to.equal(1);
    });
  });
});
