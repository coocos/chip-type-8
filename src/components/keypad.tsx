import { h, FunctionalComponent, Component } from "preact";
import { keyMap } from "../core/input";

//ts-loader does not like CSS imports
const styles = require("./keypad.css");

interface KeypadState {
  pressed: Set<number>;
}

interface KeyProps {
  pressKey(key: string, pressed: boolean): void;
  pressed: Set<number>;
  name: string;
}

const Key: FunctionalComponent<KeyProps> = props => {
  const className = props.pressed.has(keyMap[props.name])
    ? styles.pressedKey
    : styles.key;
  return (
    <button
      className={className}
      onTouchStart={() => props.pressKey(props.name, true)}
      onTouchEnd={() => props.pressKey(props.name, false)}
    >
      {props.name}
    </button>
  );
};

class Keypad extends Component<{}, KeypadState> {
  constructor() {
    super();
    this.state = {
      pressed: new Set<number>()
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", ({ key }) => {
      if (key in keyMap) {
        this.setState({
          pressed: new Set(this.state.pressed).add(keyMap[key])
        });
      }
    });
    document.addEventListener("keyup", ({ key }) => {
      if (key in keyMap) {
        this.setState({
          pressed: new Set(
            [...this.state.pressed].filter(
              pressedKey => pressedKey !== keyMap[key]
            )
          )
        });
      }
    });
  }

  private pressKey(key: string, pressed: boolean = true) {
    const eventType = pressed ? "keydown" : "keyup";
    const event = new KeyboardEvent(eventType, { key });
    document.dispatchEvent(event);
  }

  render() {
    const keys = Object.keys(keyMap).map(key => (
      <Key
        key={key}
        name={key}
        pressKey={this.pressKey}
        pressed={this.state.pressed}
      />
    ));
    return <div className={styles.keys}>{keys}</div>;
  }
}

export default Keypad;
