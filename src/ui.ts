/**
 * Initializes ROM file input and returns the loaded ROM
 * @returns {Promise<Uint16Array>}
 */
export async function loadRom(): Promise<Uint16Array> {
  const romInput = <HTMLInputElement>document.querySelector("#rom-selection");

  //Returns a promise which is resolved when a ROM has been successfully
  //selected and loaded. If ROM loading fails, the promise is rejected.
  return new Promise<Uint16Array>((resolve, reject) => {
    if (romInput !== null) {
      romInput.addEventListener("change", (e: Event) => {
        const rom = romInput.files && romInput.files.item(0);
        if (rom) {
          const reader = new FileReader();

          //TS typings are not aware of Event.target.result so type it explicitly
          reader.onload = (e: Event & { target: { result: string } }) => {
            const bytes = new Uint16Array((<any>e.target).result);
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
