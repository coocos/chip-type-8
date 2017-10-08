import "mocha";
import { expect } from "chai";
import * as sinon from "sinon";

import { stubKeys } from "./stubs";
import Input from "../src/input";

describe("Input", () => {
  it("should toggle key on and off", () => {
    //Stub required DOM event handlers for key handling
    (<any>global).document = stubKeys();
    //Nothing should be pressed at start
    const input = new Input();
    expect(input.isPressed("a")).to.be.false;
    //Trigger keyboard events and check that the input state was stored
    document.dispatchEvent(<KeyboardEvent>{ type: "keydown", key: "a" });
    expect(input.isPressed("a")).to.be.true;
    document.dispatchEvent(<KeyboardEvent>{ type: "keyup", key: "a" });
    expect(input.isPressed("a")).to.be.false;
  });
});
