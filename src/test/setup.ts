import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class ResizeObserverStub {
  observe(_target: Element) {
    // no-op
  }

  unobserve(_target: Element) {
    // no-op
  }

  disconnect() {
    // no-op
  }
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});
