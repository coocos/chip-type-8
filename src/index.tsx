import Preact, { h } from "preact";

import VM from "./core/vm";
import Display from "./core/display";
import * as ui from "./core/ui";

import App from "./components/app";

let vm: VM;

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

  //Load used ROM based on query string
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("rom")) {
    loadRom(urlParams.get("rom") as string);
  } else {
    throw new Error("No ROM found in query string!");
  }
}

function start(): void {
  const container = document.getElementById("container");
  if (container != null) {
    Preact.render(<App setCanvas={startVm} />, container);
  }
}

start();
