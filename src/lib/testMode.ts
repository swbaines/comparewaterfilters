const KEY = "cwf_test_mode";

export function isTestMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setTestMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("cwf-test-mode-changed", { detail: enabled }));
  } catch {
    /* ignore */
  }
}