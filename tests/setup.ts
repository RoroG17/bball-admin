import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sans globals Vitest, RTL ne démonte pas les rendus tout seul.
afterEach(() => {
  cleanup();
});
