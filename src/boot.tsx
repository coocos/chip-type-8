import * as React from "react";
import * as ReactDOM from "react-dom";

import VM from "./vm";
import Display from "./display";
import * as ui from "./ui";

import App from "./components/app";

let vm: VM;
const ACTIVE_ROM = "INVADERS";

/** Kickstarts the interpreter after a ROM has been selected */
function boot(canvas: HTMLCanvasElement) {
  const display = new Display(canvas);
  vm = new VM(display);
  loadRom(ACTIVE_ROM);
  render();
}

/** Loads a ROM to the VM */
function loadRom(rom: string) {
  vm.reset();
  ui.loadRomRef(rom).then((rom: Uint8Array) => {
    console.log(rom);
    vm.load(rom);
    requestAnimationFrame(runVm);
  });
}

function runVm() {
  vm.tick();
  requestAnimationFrame(runVm);
}

function render() {
  ReactDOM.render(
    <App setCanvas={boot} />,
    document.getElementById("container")
  );
}

render();
