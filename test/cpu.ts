import CPU from "../src/cpu";
import { expect } from "chai";

/**
 * Loads passed array of opcodes to CPU and returns the CPU
 * @param {Array<number>} opcodes Array of opcodes
 * @return {CPU} Initialized CPU
 */
function initializeCpu(opcodes: Array<number>): CPU {
  //Transform 16-bit opcodes to 8-bit bytes so they fit to memory
  const bytes = opcodes.reduce((bytes, opcode) => {
    const firstByte = opcode >> 8;
    const secondByte = opcode & 0x00ff;
    return new Uint8Array([...bytes, firstByte, secondByte]);
  }, new Uint8Array([]));
  //Load bytes to memory
  const cpu = new CPU();
  cpu.load(bytes);
  return cpu;
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

describe("CPU", () => {
  it("should initialize memory at proper location", () => {
    //Load instructions to clear screen and check that the instructions
    //were stored the start of the application memory area
    const cpu = initializeCpu([0x00e0]);
    cpu.next();
    expect(cpu.memory[0x200]).to.equal(0x00);
    expect(cpu.memory[0x201]).to.equal(0xe0);
  });
  it("should set register", () => {
    //Check setting register VB to 0xFF
    const cpu = initializeCpu([0x6bff]);
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xff);
  });
  it("should add to register", () => {
    const cpu = initializeCpu([0x7dff, 0x7d02]);
    //Add 0xFF to empty register VD and check the register
    cpu.next();
    expect(cpu.registers[0xd]).to.equal(0xff);
    //Add 0x2 to register VD and check that 8-bit overflow was handled
    cpu.next();
    expect(cpu.registers[0xd]).to.equal(0x1);
  });
  it("should assign register to register", () => {
    const cpu = initializeCpu([0x6bee, 0x8ab0]);
    //Set register VA to 0xEE
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xee);
    expect(cpu.registers[0xa]).to.equal(0);
    //Assign register VA to VB
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xee);
  });
  it("should assign register | register to register", () => {
    const cpu = initializeCpu([0x6bcd, 0x6a12, 0x8ba1]);
    //Assign to registers VB and VA
    times(2, () => cpu.next());
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise or
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd | 0x12);
  });
  it("should assign register & register to register", () => {
    const cpu = initializeCpu([0x6bcd, 0x6a12, 0x8ba2]);
    //Assign to registers VB and VA
    times(2, () => cpu.next());
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise and
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd & 0x12);
  });
  it("should assign register ^ register to register", () => {
    const cpu = initializeCpu([0x6bcd, 0x6a12, 0x8ba3]);
    //Assign to registers VB and VA
    times(2, () => cpu.next());
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise xor
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd ^ 0x12);
  });
  it("should add register to register and set the carry flag", () => {
    const cpu = initializeCpu([0x6af0, 0x6b01, 0x8ab4, 0x8aa4]);
    //Assign to registers VA and VB
    times(2, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0xf0);
    expect(cpu.registers[0xb]).to.equal(0x01);
    //Add register to register and check that carry flag is not set
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xf1);
    expect(cpu.registers[0xf]).to.equal(0x0);
    //Add register to itself and check that carry flag is set
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xe2);
    expect(cpu.registers[0xf]).to.equal(0x1);
  });
  it("should subtract register y from register x and set the borrow flag", () => {
    const cpu = initializeCpu([0x6a02, 0x6b01, 0x6c02, 0x8ab5, 0x8ac5]);
    //Assign to registers VA, VB and VC
    times(3, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0x02);
    expect(cpu.registers[0xb]).to.equal(0x1);
    expect(cpu.registers[0xc]).to.equal(0x02);
    //Subtract register from register and check that borrow flag is set correctly
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0x1);
    expect(cpu.registers[0xf]).to.equal(0x1);
    //Subtract register from register and check that borrow flag is set correctly
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xff);
    expect(cpu.registers[0xf]).to.equal(0x0);
  });
  it("should subtract register x from register y and set the borrow flag", () => {
    const cpu = initializeCpu([0x6a03, 0x6b04, 0x6c00, 0x8ab7, 0x8ac7]);
    //Assign to registers VA, VB and VC
    times(3, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0x03);
    expect(cpu.registers[0xb]).to.equal(0x04);
    expect(cpu.registers[0xc]).to.equal(0x0);
    //Subtract register from register and check that borrow flag is set
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0x1);
    expect(cpu.registers[0xf]).to.equal(0x1);
    //Subtract register from register and check that borrow flag is not set
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xff);
    expect(cpu.registers[0xf]).to.equal(0x0);
  });
  it("should shift register right by one bit and assign it to another register", () => {
    const cpu = initializeCpu([0x6bee, 0x8ab6, 0x6bff, 0x8ab6]);
    //Shift value register VB to the right by 1 bit and and store it in register
    //VA - set register VF to the least significant bit before the shift
    times(2, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0x77);
    expect(cpu.registers[0xf]).to.equal(0x0);
    times(2, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0x7f);
    expect(cpu.registers[0xf]).to.equal(0x1);
  });
  it("should shift register left by one bit and assign it to another register", () => {
    const cpu = initializeCpu([0x6bee, 0x8abe, 0x6b7f, 0x8abe]);
    //Shift value register VB to the left by 1 bit and and store it in register
    //VA - set register VF to the most significant bit before the shift
    times(2, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0xdc);
    expect(cpu.registers[0xf]).to.equal(0x1);
    times(2, () => cpu.next());
    expect(cpu.registers[0xa]).to.equal(0xfe);
    expect(cpu.registers[0xf]).to.equal(0x0);
  });
  it("should skip next instruction if register x does not equal register y", () => {
    const cpu = initializeCpu([0x6aff, 0x6bff, 0x9ab0, 0x6bfe, 0x9ab0]);
    //Check that upon initialization the program counter is at the right address
    expect(cpu.counter).to.be.equal(0x200);
    //Check after register assignments that the program counter is correct
    times(2, () => cpu.next());
    expect(cpu.counter).to.be.equal(0x204);
    //Check that the conditional did not occur since the registers are equal
    cpu.next();
    expect(cpu.counter).to.be.equal(0x206);
    //Set registers to be unequal and check that skip occurs
    times(2, () => cpu.next());
    expect(cpu.counter).to.be.equal(0x20c);
  });
});
