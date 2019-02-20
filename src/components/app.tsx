import Preact, { h } from "preact";

import Keypad from "./keypad";
import Screen from "./screen";

//ts-loader does not like CSS imports
const styles = require("./common.css");

interface Props {
  setCanvas(canvas: HTMLCanvasElement): void;
}

const App: Preact.FunctionalComponent<Props> = (props: Props) => {
  return (
    <div className={styles.container}>
      <Screen setCanvas={props.setCanvas} />
      <Keypad />
    </div>
  );
};

export default App;
