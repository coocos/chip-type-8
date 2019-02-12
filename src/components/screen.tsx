import * as React from "react";

const styles = require("./screen.css");

interface ScreenProps {
  setCanvas(canvas: HTMLCanvasElement): void;
}

export default class Screen extends React.Component<ScreenProps, {}> {
  private canvas: HTMLCanvasElement | null;

  /** Sets the canvas dimensions and sends the canvas element to the VM */
  public componentDidMount() {
    if (this.canvas !== null) {
      //Set canvas dimensions to fill the DOM element
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;

      // FIXME: The height and width should be a multiple of the CHIP-8 resolution

      this.canvas.width = width;
      this.canvas.height = height;
      this.props.setCanvas(this.canvas);
    }
  }

  public render() {
    return (
      <canvas
        className={styles.screen}
        ref={canvas => (this.canvas = canvas)}
      />
    );
  }
}
