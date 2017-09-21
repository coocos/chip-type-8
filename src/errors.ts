/** Error for instruction decoding related problems */
export class OpcodeError extends Error {
  /**
   * Constructs error with the error message
   * @param {string} message Error message
   */
  constructor(message: string) {
    super(message);
    //TypeScript 2.1 requires setting the prototype explicitly
    //when extending native builtins like Error
    Object.setPrototypeOf(this, OpcodeError.prototype);
  }
}

/** Error thrown when subroutine stack is popped but the stack is empty */
export class StackError extends Error {
  /**
   * Constructs error with the error message
   */
  constructor() {
    super("Popped empty subroutine stack");
    //TypeScript 2.1 requires setting the prototype explicitly
    //when extending native builtins like Error
    Object.setPrototypeOf(this, StackError.prototype);
  }
}
