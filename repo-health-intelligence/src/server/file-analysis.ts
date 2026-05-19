import fs from "fs/promises";
import path from "path";

const EXT_LANG: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".java": "Java",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
  ".swift": "Swift",
  ".kt": "Kotlin",
};

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "vendor", "__pycache__", ".venv"]);

export function detectLanguage(filePath: string): string {
  return EXT_LANG[path.extname(filePath).toLowerCase()] ?? "unknown";
}

export function estimateComplexity(content: string): number {
  const lines = content.split("\n").length;
  const functions = (content.match(/\bfunction\b|\bdef\b|\bfn\b|=>/g) ?? []).length;
  const branches = (content.match(/\bif\b|\bfor\b|\bwhile\b|\bswitch\b/g) ?? []).length;
  return clampMetric(lines * 0.15 + functions * 2 + branches * 1.5);
}

export function estimateMaintainability(complexity: number, loc: number): number {
  return clampMetric(100 - complexity * 0.55 - Math.max(0, loc - 200) * 0.05);
}

export function estimateTestCoverage(filePath: string, loc: number): number {
  const lowered = filePath.toLowerCase();
  if (lowered.includes("test") || lowered.includes("spec") || lowered.includes("__tests__")) {
    return 95;
  }
  if (loc < 80) return 45;
  if (loc < 250) return 30;
  return 15;
}

function clampMetric(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function extractImports(content: string, filePath: string): string[] {
  const imports: string[] = [];
  const ext = path.extname(filePath);
  const patterns =
    ext === ".py"
      ? [/^\s*(?:from|import)\s+([a-zA-Z0-9_.]+)/gm]
      : [/import\s+[^'"]*['"]([^'"]+)['"]/g, /from\s+['"]([^'"]+)['"]/g, /require\(['"]([^'"]+)['"]\)/g];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) imports.push(match[1]);
    }
  }
  return imports;
}

export async function walkSourceFiles(repoRoot: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(repoRoot, full).replace(/\\/g, "/");
        if (Object.keys(EXT_LANG).some((ext) => rel.endsWith(ext))) {
          files.push(rel);
        }
      }
    }
  }

  await walk(repoRoot);
  return files;
}

export function resolveImportToFile(importPath: string, sourceFile: string, allFiles: Set<string>): string | null {
  if (importPath.startsWith(".")) {
    const base = path.posix.dirname(sourceFile);
    const candidate = path.posix.normalize(path.posix.join(base, importPath));
    for (const ext of ["", ".ts", ".tsx", ".js", ".jsx", ".py"]) {
      const withExt = candidate + ext;
      if (allFiles.has(withExt)) return withExt;
      if (allFiles.has(`${candidate}/index${ext}`)) return `${candidate}/index${ext}`;
    }
  }
  return null;
}
