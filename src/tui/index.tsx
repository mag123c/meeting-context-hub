import { render } from "ink";
import { App } from "./App.js";

export interface TUIConfig {
  version: string;
  packageName: string;
}

export function startTUI(config: TUIConfig) {
  // Clear terminal before starting TUI for clean UI
  console.clear();
  render(<App version={config.version} packageName={config.packageName} />);
}
