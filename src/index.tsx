import { h, render } from "preact";

import VM from "./core/vm";
import Display from "./core/display";
import * as ui from "./core/ui";

import App from "./components/app";

let vm: VM;
const ACTIVE_ROM = "INVADERS";

/** Kickstarts the interpreter after a ROM has been selected */
function startVm(canvas: HTMLCanvasElement) {
  const display = new Display(canvas);
  vm = new VM(display);
  loadRom(ACTIVE_ROM);
}

/** Loads a ROM to the VM */
function loadRom(rom: string) {
  vm.reset();
  ui.loadRomRef(rom).then((rom: Uint8Array) => {
    vm.load(rom);
    requestAnimationFrame(runVm);
  });
}

function runVm() {
  vm.tick();
  requestAnimationFrame(runVm);
}

function start() {
  const container = document.getElementById("container");
  if (container != null) {
    render(<App setCanvas={startVm} />, container);
  }
}

start();