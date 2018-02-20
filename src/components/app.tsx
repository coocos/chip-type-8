import * as React from "react";

import Screen from "./screen";
import Keypad from "./keypad";
import Roms from "./roms";

//ts-loader does not like CSS imports
const styles = require("./common.css");

interface Props {
  roms: string[];
  onLoadRom(rom: string): void;
  setCanvas(canvas: HTMLCanvasElement): void;
}

const App: React.StatelessComponent<Props> = props => {
  return (
    <div className={styles.darkBackground}>
      <Roms onLoadRom={props.onLoadRom} roms={props.roms} />
      <Screen setCanvas={props.setCanvas} />
      <Keypad />
    </div>
  );
};

export default App;
