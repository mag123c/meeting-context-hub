import { render } from "ink";
import { App } from "./App.js";

export interface TUIConfig {
  version: string;
  packageName: string;
}

export function startTUI(config: TUIConfig) {
  render(<App version={config.version} packageName={config.packageName} />);
}
