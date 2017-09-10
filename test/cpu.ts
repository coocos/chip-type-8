import CPU from "../src/cpu";
import { expect } from "chai";

describe("CPU", () => {
  it("should initialize memory at proper location", () => {
    const cpu = new CPU();

    //Load instructions to clear screen and check that the instructions
    //were stored the start of the application memory area
    cpu.load(new Uint8Array([0x00, 0xe0]));
    expect(cpu.memory).to.not.equal(undefined);
    expect(cpu.memory[0x200]).to.equal(0x00);
    expect(cpu.memory[0x201]).to.equal(0xe0);
  });
});
