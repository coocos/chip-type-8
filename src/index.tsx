import Preact, { h } from "preact";

import VM from "./core/vm";
import Display from "./core/display";
import * as ui from "./core/ui";

import App from "./components/app";

let vm: VM;

//Set by webpack to environment variable ACTIVE_ROM
declare var ACTIVE_ROM: string;

function runVm(): void {
  vm.tick();
  requestAnimationFrame(runVm);
}

/** Loads a ROM to the VM */
function loadRom(rom: string): void {
  vm.reset();
  ui.loadRomRef(rom).then((rom: Uint8Array) => {
    vm.load(rom);
    requestAnimationFrame(runVm);
  });
}

/** Kickstarts the interpreter after a ROM has been selected */
function startVm(canvas: HTMLCanvasElement): void {
  const display = new Display(canvas);
  vm = new VM(display);
  loadRom(ACTIVE_ROM);
}

function start(): void {
  const container = document.getElementById("container");
  if (container != null) {
    Preact.render(<App setCanvas={startVm} />, container);
  }
}

start();
