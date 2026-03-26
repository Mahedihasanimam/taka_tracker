// Basic WeakRef polyfill for runtimes that do not support it (e.g., older Hermes builds).
if (typeof globalThis.WeakRef === "undefined") {
  class WeakRefPolyfill {
    constructor(value) {
      this._value = value;
    }

    deref() {
      return this._value;
    }
  }

  // Attach to the global scope so libraries relying on WeakRef continue to work.
  globalThis.WeakRef = WeakRefPolyfill;
}
