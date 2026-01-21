import { useMemo } from "react";
import { createServices, type AppServices } from "../../core/factories.js";

export function useServices(): AppServices {
  return useMemo(() => createServices(), []);
}
