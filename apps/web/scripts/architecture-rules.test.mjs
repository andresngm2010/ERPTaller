import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkFrontendArchitecture } from "./architecture-rules.mjs";

const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function runChecker(files, tsconfig = {
  compilerOptions: {
    module: "esnext",
    moduleResolution: "bundler",
    paths: { "@/*": ["./*"] },
  },
}) {
  const webRoot = fs.mkdtempSync(path.join(os.tmpdir(), "erp-taller-architecture-"));
  temporaryRoots.push(webRoot);
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(webRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }

  const registryPath = path.join(webRoot, "module-registry.json");
  fs.writeFileSync(
    registryPath,
    JSON.stringify({ modules: ["customers", "inventory"] }),
    "utf8",
  );
  fs.writeFileSync(
    path.join(webRoot, "tsconfig.json"),
    JSON.stringify(tsconfig),
    "utf8",
  );

  return checkFrontendArchitecture({ webRoot, registryPath });
}

describe("frontend architecture checker", () => {
  it("allows same-module internal imports", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts": 'import { helper } from "./internal";\n',
      "src/modules/customers/internal.ts": "export const helper = {};\n",
    });

    expect(violations).toEqual([]);
  });

  it("allows cross-module public imports through the configured alias", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        'import { capability } from "@/src/modules/inventory/public";\n',
      "src/modules/inventory/public.ts": "export const capability = {};\n",
    });

    expect(violations).toEqual([]);
  });

  it("rejects cross-module relative imports of internals", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        'import { secret } from "../inventory/internal";\n',
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain("outside its public.ts surface");
    expect(violations[0].subject).toBe("../inventory/internal");
  });

  it("rejects cross-module internal imports through the configured alias", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        'import { secret } from "@/src/modules/inventory/internal";\n',
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain("outside its public.ts surface");
  });

  it("allows bootstrap code to import a public module surface", () => {
    const violations = runChecker({
      "app/page.tsx": 'import { register } from "@/src/modules/customers/public";\n',
      "src/modules/customers/public.ts": "export const register = {};\n",
    });

    expect(violations).toEqual([]);
  });

  it("rejects bootstrap code importing module internals", () => {
    const violations = runChecker({
      "app/page.tsx": 'import { secret } from "@/src/modules/customers/internal";\n',
      "src/modules/customers/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].source).toMatch(/app[/\\]page\.tsx$/u);
    expect(violations[0].reason).toContain("outside its public.ts surface");
  });

  it.each([
    'export { secret } from "../inventory/internal";\n',
    'export * from "../inventory/internal";\n',
  ])("rejects cross-module re-exports of internals", (statement) => {
    const violations = runChecker({
      "src/modules/customers/service.ts": statement,
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain("outside its public.ts surface");
  });

  it("rejects type-only cross-module imports of internals", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        'import type { Secret } from "../inventory/internal";\n',
      "src/modules/inventory/internal.ts": "export type Secret = {};\n",
    });

    expect(violations).toHaveLength(1);
  });

  it("rejects a non-public module barrel", () => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        'import { secret } from "../inventory";\n',
      "src/modules/inventory/index.ts": 'export { secret } from "./internal";\n',
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].subject).toBe("../inventory");
  });

  it.each([
    ["../inventory/public-helper", "src/modules/inventory/public-helper.ts"],
    ["../inventory/public", "src/modules/inventory/public/index.ts"],
    ["../inventory/something/public", "src/modules/inventory/something/public.ts"],
  ])("rejects public-name confusion for %s", (specifier, target) => {
    const violations = runChecker({
      "src/modules/customers/service.ts":
        `import { secret } from "${specifier}";\n`,
      [target]: "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].subject).toBe(specifier);
  });

  it("rejects a root-level tsconfig source importing module internals", () => {
    const violations = runChecker({
      "bridge.ts":
        'import { secret } from "./src/modules/inventory/internal";\n',
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].source).toMatch(/bridge\.ts$/u);
    expect(violations[0].reason).toContain("outside its public.ts surface");
  });

  it("ignores the generated root next-env declaration", () => {
    const violations = runChecker({
      "next-env.d.ts":
        'import "./src/modules/inventory/internal";\n',
      "src/modules/inventory/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toEqual([]);
  });

  it("rejects noncanonical module directories", () => {
    const violations = runChecker({
      "src/modules/not_registered/internal.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].subject).toBe("not_registered");
    expect(violations[0].reason).toContain("not in the canonical module registry");
  });

  it("rejects a hidden noncanonical module imported through public.ts", () => {
    const violations = runChecker({
      "bridge.ts":
        'import { secret } from "./src/modules/.rogue/public";\n',
      "src/modules/.rogue/public.ts": "export const secret = {};\n",
    });

    expect(violations).toHaveLength(2);
    expect(violations.some((violation) => violation.subject === ".rogue")).toBe(true);
    expect(violations.some((violation) =>
      violation.reason.includes("imports noncanonical module '.rogue'"),
    )).toBe(true);
  });

  it("rejects a hidden tsconfig source importing module internals", () => {
    const violations = runChecker(
      {
        ".hidden/bridge.ts":
          'import { secret } from "../src/modules/inventory/internal";\n',
        "src/modules/inventory/internal.ts": "export const secret = {};\n",
      },
      {
        compilerOptions: {
          module: "esnext",
          moduleResolution: "bundler",
        },
        files: [".hidden/bridge.ts", "src/modules/inventory/internal.ts"],
      },
    );

    expect(violations).toHaveLength(1);
    expect(violations[0].source).toMatch(/\.hidden[/\\]bridge\.ts$/u);
    expect(violations[0].reason).toContain("outside its public.ts surface");
  });

  it("ignores explicitly included generated and dependency cache sources", () => {
    const violations = runChecker(
      {
        ".next/generated.ts":
          'import { secret } from "../src/modules/inventory/internal";\n',
        "node_modules/generated.ts":
          'import { secret } from "../src/modules/inventory/internal";\n',
        "src/modules/inventory/internal.ts": "export const secret = {};\n",
      },
      {
        compilerOptions: {
          module: "esnext",
          moduleResolution: "bundler",
        },
        files: [
          ".next/generated.ts",
          "node_modules/generated.ts",
          "src/modules/inventory/internal.ts",
        ],
      },
    );

    expect(violations).toEqual([]);
  });

  it.each([".next", "__pycache__", "node_modules"])(
    "ignores the %s cache directory as a module candidate",
    (directory) => {
      const violations = runChecker({
        "src/config.ts": "export const value = {};\n",
        [`src/modules/${directory}/generated.ts`]: "export const generated = {};\n",
      });

      expect(violations).toEqual([]);
    },
  );
});
