import "mocha";
import { expect } from "chai";
import * as sinon from "sinon";

import { stubCanvas } from "./stubs";

import Display from "../src/display";

describe("Display", () => {
  it("should clear screen", () => {
    stubCanvas();
    const display = new Display("display");
    sinon.spy(display.context, "clearRect");
    display.clear();
    //Check that the canvas element was cleared
    expect(display.context.clearRect).to.have.property("calledOnce", true);
  });
});
