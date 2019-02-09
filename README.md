# Chip-type-8

## What is this?

`Chip-type-8` is a [CHIP-8](https://en.wikipedia.org/wiki/CHIP-8) interpreter / emulator written in TypeScript.

## Why yet another interpreter?

I mostly built this because a) I was interested in trying out TypeScript and b) I was interested in creating a super simple emulator.

## Features

The original 35 instructions for CHIP-8 are all supported and the interpreter can be used to to run games like Pong, Space Invaders and more.

Additionally a few Super Chip-48 / HP48 specific CHIP-8 instructions are implemented which are used to save register contents to flags and load the flags to registers. These instructions are supported mainly so that the interpreter passes the `SCTEST` test ROM which can be used to partially verify that a CHIP-8 interpreter is correctly implemented.

## Missing features

No sound effects are supported.

## Tests

Run `yarn test` to execute the tests for:

* all 35 instructions
* sanity checks for basic virtual machine operations
* sprite drawing

## License

MIT
