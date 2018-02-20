import * as React from "react";

interface HeaderProps {
  roms: string[];
}

const Dropdown: React.StatelessComponent<HeaderProps> = props => {
  const roms = props.roms.map(rom => <li>{rom}</li>);
  return <ul>{roms}</ul>;
};
