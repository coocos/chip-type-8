import * as React from "react";
import * as ReactDOM from "react-dom";

import VM from "./vm";
import Display from "./display";
import * as ui from "./ui";

import App from "./components/app";

let vm: VM;

interface romCache {
  [name: string]: Uint8Array;
}
const cache: romCache = {};

const state = {
  selectedRom: "INVADERS",
  roms: ["BLINKY", "INVADERS", "PONG"]
};

/** Kickstarts the interpreter after a ROM has been selected */
function boot(canvas: HTMLCanvasElement) {
  const display = new Display(canvas);
  vm = new VM(display);
  render(state);
}

/** Loads a ROM to the VM */
function loadRom(rom: string) {
  console.log(`VM should load "${rom}"`);
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

function render(state: any) {
  ReactDOM.render(
    <App setCanvas={boot} onLoadRom={loadRom} {...state} />,
    document.getElementById("container")
  );
}

render(state);
