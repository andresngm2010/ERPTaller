import { describe, expect, it } from "vitest";

import { runtimeMessage } from "./runtime-message";

describe("runtimeMessage", () => {
  it("reports that the application runtime is operational", () => {
    expect(runtimeMessage()).toBe("El entorno de la aplicación está operativo.");
  });
});
