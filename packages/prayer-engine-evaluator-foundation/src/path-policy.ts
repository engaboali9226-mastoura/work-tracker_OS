import { EvaluatorFoundationError } from "./errors.js";

function normalizeAbsolutePath(value: string): string {
  if (!value.startsWith("/")) {
    throw new EvaluatorFoundationError(
      "FILESYSTEM_ESCAPE_ATTEMPT",
      "Containment checks require absolute resolved paths.",
      { value },
    );
  }

  const segments: string[] = [];

  for (const segment of value.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (segments.length === 0) {
        throw new EvaluatorFoundationError(
          "FILESYSTEM_ESCAPE_ATTEMPT",
          "Resolved path escapes the filesystem root.",
          { value },
        );
      }

      segments.pop();
      continue;
    }

    segments.push(segment);
  }

  return `/${segments.join("/")}`;
}

export function assertContainedResolvedPath(
  rootResolvedPath: string,
  candidateResolvedPath: string,
): void {
  const normalizedRoot = normalizeAbsolutePath(rootResolvedPath);
  const root = normalizedRoot === "/" ? "/" : normalizedRoot.replace(/\/$/u, "");
  const candidate = normalizeAbsolutePath(candidateResolvedPath);
  const prefix = root === "/" ? "/" : `${root}/`;

  if (candidate !== root && !candidate.startsWith(prefix)) {
    throw new EvaluatorFoundationError(
      "FILESYSTEM_ESCAPE_ATTEMPT",
      "Resolved path is outside the allowed root.",
      { root, candidate },
    );
  }
}

export function assertNoProtectedPathExposure(
  candidateVisibleValues: readonly string[],
  protectedResolvedPaths: readonly string[],
): void {
  const protectedPaths = protectedResolvedPaths.map((path) => {
    const normalized = normalizeAbsolutePath(path);
    return normalized === "/" ? "/" : normalized.replace(/\/$/u, "");
  });

  for (const value of candidateVisibleValues) {
    for (const protectedPath of protectedPaths) {
      if (value.includes(protectedPath)) {
        throw new EvaluatorFoundationError(
          "SCOPE_VIOLATION",
          "A protected repository path would be exposed to candidate code.",
        );
      }
    }
  }
}
