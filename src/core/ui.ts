/**
 * Initializes ROM file input and returns the loaded ROM
 * @returns {Promise<Uint8Array>}
 */
export async function loadRom(): Promise<Uint8Array> {
  const romInput = <HTMLInputElement>document.querySelector("#rom-selection");

  //Returns a promise which is resolved when a ROM has been successfully
  //selected and loaded. If ROM loading fails, the promise is rejected.
  return new Promise<Uint8Array>((resolve, reject) => {
    if (romInput !== null) {
      romInput.addEventListener("change", (e: Event) => {
        const rom = romInput.files && romInput.files.item(0);
        if (rom) {
          const reader = new FileReader();
          reader.onload = (e: Event) => {
            const bytes = new Uint8Array(<ArrayBuffer>reader.result);
            resolve(bytes);
          };
          reader.readAsArrayBuffer(rom);
        }
      });
    } else {
      reject(new Error("Failed to load ROM"));
    }
  });
}

export function loadRomRef(name: string): any {
  return fetch(name)
    .then(data => data.arrayBuffer())
    .then(romBuffer => new Uint8Array(romBuffer));
}
