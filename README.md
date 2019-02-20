# chip-type-8

chip-type-8 is a [CHIP-8](https://en.wikipedia.org/wiki/CHIP-8) interpreter / emulator written in TypeScript 🎮

## Features

The original 35 instructions for CHIP-8 are all supported and the interpreter can be used to to run games like Pong, Space Invaders and more.

Additionally a few Super Chip-48 / HP48 specific CHIP-8 instructions are implemented which are used to save register contents to flags and load the flags to registers. These instructions are supported mainly so that the interpreter passes the `SCTEST` test ROM which can be used to partially verify that a CHIP-8 interpreter is correctly implemented.

## Missing features

No sound effects are supported.

## Tests

Run `npm run test` to execute the tests for:

* all 35 instructions
* sanity checks for basic virtual machine operations
* sprite drawing

## Why yet another CHIP-8 interpreter?

Hundreds, if not thousands of CHIP-8 interpreters exists so what makes this special? Well, nothing really - it's actually not that great compared to many other CHIP-8 interpreters. I made chip-type-8 because I was itching for a project which would allow me to do two things:

* try out TypeScript (in 2017)
* create a super simple emulator

## License

MIT
