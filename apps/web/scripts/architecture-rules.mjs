import fs from "node:fs";
import path from "node:path";

import ts from "typescript";

const MODULE_ID_PATTERN = /^[a-z][a-z0-9_]*$/u;
const IGNORED_DIRECTORY_NAMES = new Set([".next", "__pycache__", "node_modules"]);
const GENERATED_FRAMEWORK_FILES = new Set(["next-env.d.ts"]);

export function loadModuleRegistry(registryPath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  } catch (error) {
    throw new Error(`cannot read valid JSON from ${registryPath}: ${error.message}`, {
      cause: error,
    });
  }

  if (
    parsed === null ||
    typeof parsed !== "object" ||
    Array.isArray(parsed) ||
    Object.keys(parsed).length !== 1 ||
    !Array.isArray(parsed.modules) ||
    parsed.modules.length === 0
  ) {
    throw new Error("registry must be an object containing only a non-empty 'modules' list");
  }
  if (parsed.modules.some((moduleId) => typeof moduleId !== "string")) {
    throw new Error("every registry module identifier must be a string");
  }
  if (parsed.modules.some((moduleId) => !MODULE_ID_PATTERN.test(moduleId))) {
    throw new Error("module identifiers must use lowercase snake_case");
  }
  if (new Set(parsed.modules).size !== parsed.modules.length) {
    throw new Error("registry module identifiers must be unique");
  }

  return new Set(parsed.modules);
}

function isWithin(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function moduleIdForFile(filePath, modulesRoot) {
  if (!isWithin(filePath, modulesRoot)) {
    return null;
  }
  const relativeParts = path.relative(modulesRoot, filePath).split(path.sep);
  return relativeParts.length > 1 ? relativeParts[0] : null;
}

function publicSurfaceForFile(filePath, modulesRoot) {
  if (!isWithin(filePath, modulesRoot)) {
    return false;
  }
  const relativeParts = path.relative(modulesRoot, filePath).split(path.sep);
  return relativeParts.length === 2 && relativeParts[1] === "public.ts";
}

function isIgnoredDirectoryName(name) {
  return IGNORED_DIRECTORY_NAMES.has(name);
}

function isRepositoryOwnedSourceFile(filePath, webRoot) {
  if (!isWithin(filePath, webRoot)) {
    return false;
  }
  const relativeParts = path.relative(webRoot, filePath).split(path.sep);
  if (relativeParts.length === 1 && GENERATED_FRAMEWORK_FILES.has(relativeParts[0])) {
    return false;
  }
  return !relativeParts.some(isIgnoredDirectoryName);
}

function loadTypeScriptConfig(tsconfigPath, webRoot) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    webRoot,
    undefined,
    tsconfigPath,
  );
  if (parsed.errors.length > 0) {
    throw new Error(
      parsed.errors
        .map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n"))
        .join("\n"),
    );
  }
  return parsed;
}

function moduleReferences(sourceFile) {
  const references = [];
  sourceFile.forEachChild((node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      references.push(node.moduleSpecifier);
    }
  });
  return references;
}

export function checkFrontendArchitecture({
  webRoot,
  registryPath,
  tsconfigPath = path.join(webRoot, "tsconfig.json"),
}) {
  const absoluteWebRoot = path.resolve(webRoot);
  const modulesRoot = path.join(absoluteWebRoot, "src", "modules");
  const canonicalModules = loadModuleRegistry(registryPath);
  const typeScriptConfig = loadTypeScriptConfig(tsconfigPath, absoluteWebRoot);
  const compilerOptions = typeScriptConfig.options;
  const violations = [];

  if (!fs.statSync(path.join(absoluteWebRoot, "src"), { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error("configured frontend src root does not exist or is not a directory");
  }

  if (fs.existsSync(modulesRoot)) {
    for (const entry of fs.readdirSync(modulesRoot, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        !isIgnoredDirectoryName(entry.name) &&
        !canonicalModules.has(entry.name)
      ) {
        violations.push({
          source: path.join(modulesRoot, entry.name),
          line: 1,
          subject: entry.name,
          reason: "domain-module directory is not in the canonical module registry",
        });
      }
    }
  }

  const sourceFiles = typeScriptConfig.fileNames
    .map((fileName) => path.resolve(fileName))
    .filter((fileName) => isRepositoryOwnedSourceFile(fileName, absoluteWebRoot))
    .sort();

  for (const sourcePath of sourceFiles) {
    const scriptKind = sourcePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(
      sourcePath,
      fs.readFileSync(sourcePath, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );
    const owner = moduleIdForFile(sourcePath, modulesRoot);

    for (const reference of moduleReferences(sourceFile)) {
      const specifier = reference.text;
      const resolution = ts.resolveModuleName(
        specifier,
        sourcePath,
        compilerOptions,
        ts.sys,
      ).resolvedModule;
      if (!resolution) {
        continue;
      }

      const targetPath = path.resolve(resolution.resolvedFileName);
      const targetModule = moduleIdForFile(targetPath, modulesRoot);
      if (targetModule === null) {
        continue;
      }
      const position = sourceFile.getLineAndCharacterOfPosition(reference.getStart());
      if (!canonicalModules.has(targetModule)) {
        violations.push({
          source: sourcePath,
          line: position.line + 1,
          subject: specifier,
          reason: `imports noncanonical module '${targetModule}' not in the canonical module registry`,
        });
        continue;
      }
      if (owner === targetModule) {
        continue;
      }
      if (publicSurfaceForFile(targetPath, modulesRoot)) {
        continue;
      }

      violations.push({
        source: sourcePath,
        line: position.line + 1,
        subject: specifier,
        reason: `imports module '${targetModule}' outside its public.ts surface`,
      });
    }
  }

  return violations;
}
