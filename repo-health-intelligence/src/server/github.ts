const GITHUB_URL_PATTERN =
  /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

export function parseAndValidateGithubUrl(url: string): { owner: string; repo: string } {
  const match = GITHUB_URL_PATTERN.exec(url.trim());
  if (!match?.[1] || !match[2]) {
    throw new Error("Only public GitHub repository URLs are supported (https://github.com/org/repo).");
  }
  return { owner: match[1], repo: match[2] };
}

export function normalizeGithubUrl(url: string): string {
  const { owner, repo } = parseAndValidateGithubUrl(url);
  return `https://github.com/${owner}/${repo}.git`;
}

export function extractOwnerRepo(url: string): { owner: string; repo: string } {
  return parseAndValidateGithubUrl(url.replace(/\.git$/, ""));
}
