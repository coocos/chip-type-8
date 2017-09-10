import CPU from "./cpu";
import * as ui from "./ui";

/** Kickstarts the interpreter after a ROM has been selected */
async function boot() {
  const rom = await ui.loadRom();
  console.log("ROM loaded");
  console.log(rom);
  const cpu = new CPU();
  cpu.load(rom);
}

boot();
