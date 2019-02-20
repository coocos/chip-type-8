/**
 * Initializes ROM file input and returns the loaded ROM
 * @returns {Promise<Uint8Array>}
 */
export async function loadRom(): Promise<Uint8Array> {
  const romInput = document.querySelector("#rom-selection") as HTMLInputElement;

  //Returns a promise which is resolved when a ROM has been successfully
  //selected and loaded. If ROM loading fails, the promise is rejected.
  return new Promise<Uint8Array>((resolve, reject) => {
    if (romInput !== null) {
      romInput.addEventListener("change", () => {
        const rom = romInput.files && romInput.files.item(0);
        if (rom) {
          const reader = new FileReader();
          reader.onload = () => {
            const bytes = new Uint8Array(reader.result as ArrayBuffer);
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

export function loadRomRef(name: string): Promise<Uint8Array> {
  return fetch(name)
    .then(data => data.arrayBuffer())
    .then(romBuffer => new Uint8Array(romBuffer));
}
