import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";
import { mockDesktopViewport } from "@tests/viewport";

configure({ asyncUtilTimeout: 3_000 });

mockDesktopViewport();

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(Element.prototype, "scrollIntoView", {
  writable: true,
  value: () => {},
});

afterEach(() => {
  cleanup();
  mockDesktopViewport();
});
