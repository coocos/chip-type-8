import CPU from "../src/cpu";
import { expect } from "chai";

/**
 * Loads passed array of bytes to CPU and returns the CPU
 * @param {Array<number>} bytes Array of bytes
 * @return {CPU} Initialized CPU
 */
function initializeCpu(bytes: Array<number>): CPU {
  const cpu = new CPU();
  cpu.load(new Uint8Array(bytes));
  return cpu;
}

describe("CPU", () => {
  it("should initialize memory at proper location", () => {
    //Load instructions to clear screen and check that the instructions
    //were stored the start of the application memory area
    const cpu = initializeCpu([0x00, 0xe0]);
    cpu.next();
    expect(cpu.memory[0x200]).to.equal(0x00);
    expect(cpu.memory[0x201]).to.equal(0xe0);
  });
  it("should set register - 0x6XNN", () => {
    //Check setting register VB to 0xFF
    const cpu = initializeCpu([0x6b, 0xff]);
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xff);
  });
  it("should add to register - 0x7XNN", () => {
    const cpu = initializeCpu([0x7d, 0xff, 0x7d, 0x02]);
    //Add 0xFF to empty register VD and check the register
    cpu.next();
    expect(cpu.registers[0xd]).to.equal(0xff);
    //Add 0x2 to register VD and check that 8-bit overflow was handled
    cpu.next();
    expect(cpu.registers[0xd]).to.equal(0x1);
  });
  it("should assign register to register - 0x8XY0", () => {
    const cpu = initializeCpu([0x6b, 0xee, 0x8a, 0xb0]);
    //Set register VA to 0xEE
    cpu.next();
    expect(cpu.registers[0xb]).to.equal(0xee);
    expect(cpu.registers[0xa]).to.equal(0);
    //Assign register VA to VB
    cpu.next();
    expect(cpu.registers[0xa]).to.equal(0xee);
  });
});
