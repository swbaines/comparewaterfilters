import { createRoot } from "react-dom/client";
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

createRoot(document.getElementById("root")!).render(<App />);
