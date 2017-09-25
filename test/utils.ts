import { expect } from "chai";

import * as utils from "../src/utils";

describe("Binary-coded decimal conversion", () => {
  it("should convert values correctly", () => {
    let [hundreds, tens, ones] = utils.bcd(0x7b);
    expect(hundreds).to.equal(1);
    expect(tens).to.equal(2);
    expect(ones).to.equal(3);
    [hundreds, tens, ones] = utils.bcd(0xff);
    expect(hundreds).to.equal(2);
    expect(tens).to.equal(5);
    expect(ones).to.equal(5);
    [hundreds, tens, ones] = utils.bcd(0xf);
    expect(hundreds).to.equal(0);
    expect(tens).to.equal(1);
    expect(ones).to.equal(5);
    [hundreds, tens, ones] = utils.bcd(0x1);
    expect(hundreds).to.equal(0);
    expect(tens).to.equal(0);
    expect(ones).to.equal(1);
  });
});
