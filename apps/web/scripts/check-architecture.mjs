import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkFrontendArchitecture } from "./architecture-rules.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(webRoot, "..", "..");
const registryPath = path.join(
  repositoryRoot,
  "docs",
  "architecture",
  "module-registry.json",
);

function displayPath(filePath) {
  const relative = path.relative(repositoryRoot, filePath);
  return relative.startsWith("..") ? filePath : relative.split(path.sep).join("/");
}

try {
  const violations = checkFrontendArchitecture({ webRoot, registryPath });
  if (violations.length > 0) {
    console.error(`Frontend architecture check failed (${violations.length} violation(s)):`);
    for (const violation of violations) {
      console.error(
        `- ${displayPath(violation.source)}:${violation.line}: ${violation.subject}: ${violation.reason}`,
      );
    }
    process.exitCode = 1;
  } else {
    console.log("Frontend architecture check passed.");
  }
} catch (error) {
  console.error(`Frontend architecture check failed: ${error.message}`);
  process.exitCode = 2;
}
