import "mocha";
import { expect } from "chai";
import * as sinon from "sinon";

import { stubCanvas } from "./stubs";

import Display from "../src/display";

describe("Display", () => {
  it("should clear screen", () => {
    stubCanvas();
    const display = new Display("#display");
    sinon.spy(display.context, "clearRect");
    display.clear();
    expect(display.context.clearRect).to.have.property("calledOnce", true);
  });
  it("should draw a sprite", () => {
    //Initialize stubs, spies and construct display
    stubCanvas();
    const display = new Display("#display");
    sinon.spy(display.context, "fillRect");

    //Draw two rows of sprite data and check that the internal draw calls were made
    let flipped = display.drawSprite(0, 0, new Uint8Array([0xff, 0x0f]));
    expect(display.context.fillRect).to.have.property("callCount", 12);
    expect(flipped).to.not.be.true;

    //First row of sprite data should consist of 8 white pixels
    for (let x = 7; x >= 0; x--) {
      expect(display.context.getImageData(x, 0, 1, 1).data[0]).to.equal(255);
    }
    //Second row of sprite data should consist of 4 black pixels and 4 white pixels
    for (let x = 7; x >= 0; x--) {
      const color = x >= 4 ? 255 : 0;
      expect(display.context.getImageData(x, 1, 1, 1).data[0]).to.equal(color);
    }

    //Draw a two pixel on top of previous sprite data, pixels should be flipped
    flipped = display.drawSprite(0, 0, new Uint8Array([0x80, 0x01]));
    //First pixel on first row and last pixel on second row should be flipped
    expect(display.context.getImageData(0, 0, 1, 1).data[0]).to.equal(0);
    expect(display.context.getImageData(7, 1, 1, 1).data[0]).to.equal(0);
    expect(flipped).to.be.true;
  });
});
