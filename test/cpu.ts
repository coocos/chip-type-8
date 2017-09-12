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
    cpu.next();
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise or
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd | 0x12);
  });
  it("should assign register & register to register", () => {
    const cpu = initializeCpu([0x6bcd, 0x6a12, 0x8ba2]);
    //Assign to registers VB and VA
    cpu.next();
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise and
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd & 0x12);
  });
  it("should assign register ^ register to register", () => {
    const cpu = initializeCpu([0x6bcd, 0x6a12, 0x8ba3]);
    //Assign to registers VB and VA
    cpu.next();
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd);
    expect(cpu.registers[0xa]).to.equal(0x12);
    //Assign register to register with bitwise xor
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xcd ^ 0x12);
  });
  it("should add register to register and set the carry flag", () => {
    const cpu = initializeCpu([0x6af0, 0x6b01, 0x8ab4, 0x8aa4]);
    //Assign to registers VA and VB
    cpu.next();
    cpu.next();
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
});
