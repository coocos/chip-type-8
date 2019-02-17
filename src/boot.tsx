import * as Preact from "preact";
const h = Preact.h;

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
  const container = document.getElementById("container");
  if (container != null) {
    Preact.render(<App setCanvas={boot} />, container);
  }
}

render();
