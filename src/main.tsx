import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App.tsx";
import "./index.css";

// Guard against third-party browser extensions (Google Translate, Grammarly,
// LanguageTool, etc.) that mutate the DOM out from under React. When React
// later tries to unmount a node that the extension already removed/replaced,
// it throws `NotFoundError: Failed to execute 'removeChild' on 'Node'` and
// blanks the screen. Silently ignoring that specific error keeps the app
// usable; React reconciles on the next render.
if (typeof Node !== "undefined") {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Suppressed removeChild on detached node (likely a browser extension).");
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Suppressed insertBefore with detached reference (likely a browser extension).");
      }
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } as typeof Node.prototype.insertBefore;
}

// Detect the specific DOM-mutation conflict that browser extensions
// (Google Translate, Grammarly, LanguageTool, etc.) cause and recover
// by silently remounting the React tree instead of showing a blank page.
const isExtensionDomError = (err: unknown): boolean => {
  const msg =
    err instanceof Error
      ? `${err.name}: ${err.message}`
      : typeof err === "string"
        ? err
        : "";
  return (
    msg.includes("removeChild") ||
    msg.includes("insertBefore") ||
    msg.includes("The node to be removed") ||
    msg.includes("The node before which the new node is to be inserted")
  );
};

class ExtensionSafeBoundary extends Component<{ children: ReactNode }, { key: number }> {
  state = { key: 0 };

  static getDerivedStateFromError() {
    return null;
  }

  componentDidCatch(error: unknown) {
    if (isExtensionDomError(error)) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("Recovered from extension-induced React DOM error by remounting.");
      }
      // Force a fresh mount so React's fiber tree matches the live DOM again.
      this.setState((s) => ({ key: s.key + 1 }));
      return;
    }
    // Re-throw non-extension errors so real bugs aren't hidden.
    throw error;
  }

  render() {
    return <div key={this.state.key}>{this.props.children}</div>;
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (isExtensionDomError(e.error ?? e.message)) {
      e.preventDefault();
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (isExtensionDomError(e.reason)) {
      e.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ExtensionSafeBoundary>
    <App />
  </ExtensionSafeBoundary>,
);
