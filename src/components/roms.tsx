import * as React from "react";

const styles = require("./roms.css");

interface RomsProps {
  onLoadRom(name: string): void;
  roms: string[];
}

interface RomProps {
  onLoadRom(name: string): void;
  rom: string;
}

interface RomsState {
  dropdownOpen: boolean;
}

const Rom: React.StatelessComponent<RomProps> = ({ onLoadRom, rom }) => {
  return (
    <li className={styles.item} onClick={() => onLoadRom(rom)}>
      {rom}
    </li>
  );
};

class Roms extends React.Component<RomsProps, RomsState> {
  constructor(props: RomsProps) {
    super(props);
    this.state = {
      dropdownOpen: false
    };
  }
  toggleDropdown() {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }
  render() {
    const _roms = this.props.roms.map(rom => (
      <Rom key={rom} rom={rom} onLoadRom={this.props.onLoadRom} />
    ));
    return (
      <div className={styles.dropdown} onClick={() => this.toggleDropdown()}>
        <div className={styles.selected}>
          <span>Selected ROM: {this.props.roms[0]}</span>
          <span>▼</span>
        </div>
        {this.state.dropdownOpen ? (
          <ul className={styles.items}>{_roms}</ul>
        ) : null}
      </div>
    );
  }
}

export default Roms;
