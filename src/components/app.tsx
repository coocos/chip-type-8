import * as React from "react";

import Screen from "./screen";
import Keypad from "./keypad";

//ts-loader does not like CSS imports
const styles = require("./common.css");

interface Props {
  setCanvas(canvas: HTMLCanvasElement): void;
}

const App: React.StatelessComponent<Props> = props => {
  return (
    <div className={styles.container}>
      <Screen setCanvas={props.setCanvas} />
      <Keypad />
    </div>
  );
};

export default App;
