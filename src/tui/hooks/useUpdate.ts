/**
 * useUpdate Hook
 * Checks for updates and provides functionality to update the package
 */

import { useState, useEffect, useCallback } from "react";
import { spawn } from "child_process";
import updateNotifier from "update-notifier";

export type UpdateState = "idle" | "updating" | "success" | "error";

export interface UseUpdateResult {
  version: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  isChecking: boolean;
  showPrompt: boolean;
  promptUpdate: () => void;
  confirmUpdate: () => void;
  cancelUpdate: () => void;
  closeResult: () => void;
  updateState: UpdateState;
  updateError: string | null;
}

interface UseUpdateOptions {
  packageName: string;
  version: string;
}

export function useUpdate({ packageName, version }: UseUpdateOptions): UseUpdateResult {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Check for updates on mount
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const notifier = updateNotifier({
          pkg: { name: packageName, version },
          updateCheckInterval: 0, // Always check
        });

        // Fetch info asynchronously
        const info = await notifier.fetchInfo();
        if (info && info.latest && info.latest !== version) {
          setLatestVersion(info.latest);
        }
      } catch {
        // Silently fail on network errors
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, [packageName, version]);

  const updateAvailable = latestVersion !== null && latestVersion !== version;

  const promptUpdate = useCallback(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  const cancelUpdate = useCallback(() => {
    setShowPrompt(false);
    setUpdateState("idle");
    setUpdateError(null);
  }, []);

  const closeResult = useCallback(() => {
    setShowPrompt(false);
    setUpdateState("idle");
    setUpdateError(null);
  }, []);

  const confirmUpdate = useCallback(() => {
    setUpdateState("updating");
    setUpdateError(null);

    // Run npm update -g <package-name>
    const child = spawn("npm", ["update", "-g", packageName], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    let errorOutput = "";

    child.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        setUpdateState("success");
      } else {
        setUpdateState("error");
        setUpdateError(errorOutput.trim() || `Exit code: ${code}`);
      }
    });

    child.on("error", (err) => {
      setUpdateState("error");
      setUpdateError(err.message);
    });
  }, [packageName]);

  return {
    version,
    latestVersion,
    updateAvailable,
    isChecking,
    showPrompt,
    promptUpdate,
    confirmUpdate,
    cancelUpdate,
    closeResult,
    updateState,
    updateError,
  };
}
