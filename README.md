# chip-type-8

[!ScreenShot](docs/screenshot.png)

chip-type-8 is a [CHIP-8](https://en.wikipedia.org/wiki/CHIP-8) interpreter / emulator built with TypeScript and [Preact](https://github.com/developit/preact)  🎮

## Features

The original 35 instructions for CHIP-8 are all supported and the interpreter can be used to to run games like Pong, Space Invaders and more. Additionally a few Super Chip-48 / HP48 specific instructions are implemented which are used to save register contents to flags and load the flags to registers. These instructions are supported so that the interpreter passes the `SCTEST` test ROM which can be used to partially verify that a CHIP-8 interpreter is correctly implemented.

No sound effects are supported, although the sound timer itself is implemented.

## Building

The active ROM can be set at build time via an enviroment variable:

```bash
export ACTIVE_ROM='"INVADERS"'
```

To build the application via `webpack`:

```bash
npm install
npm run build
```

## Tests

Run `npm run test` to execute tests for:

* all 35 instructions
* sanity checks for basic virtual machine operations
* sprite drawing

## But why?

Hundreds, if not thousands of CHIP-8 interpreters exist so what makes this one so special? Nothing really as there are way better CHIP-8 interpreters out there. I just wanted to try out TypeScript as well as create a super simple interpreter / emulator.

## License

MIT
