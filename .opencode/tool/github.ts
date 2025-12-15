/// <reference types="bun-types" />
/// <reference types="@opencode-ai/plugin" />

import { tool } from "@opencode-ai/plugin";

/**
 * Semver comparison: returns -1, 0, or 1
 * Handles: v1.2.3, 1.2.3, v1.2.3-beta.1, etc.
 */
function compareSemver(a: string, b: string): number {
  const normalize = (v: string) => v.replace(/^v/, "");
  const partsA = (normalize(a).split(/[-+]/)[0] ?? "").split(".").map(Number);
  const partsB = (normalize(b).split(/[-+]/)[0] ?? "").split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  // If numeric parts equal, check prerelease (alpha < beta < rc < release)
  const preA = normalize(a).split(/[-+]/)[1];
  const preB = normalize(b).split(/[-+]/)[1];
  if (preA && !preB) return -1; // 1.0.0-alpha < 1.0.0
  if (!preA && preB) return 1; // 1.0.0 > 1.0.0-alpha
  if (preA && preB) return preA.localeCompare(preB);

  return 0;
}

/**
 * Check if a tag looks like a semver version
 */
function isSemverTag(tag: string): boolean {
  // Match v1, v1.2, v1.2.3, 1.2.3, v1.2.3-beta, etc.
  return /^v?\d+(\.\d+)*(-[\w.]+)?(\+[\w.]+)?$/.test(tag);
}

/**
 * Normalize repo input: handles full URLs, owner/repo, or just repo name
 */
function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const cleaned = input.trim();

  // Handle full GitHub URLs
  const urlMatch = cleaned.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/\s#?]+)/,
  );
  if (urlMatch?.[1] && urlMatch[2]) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].replace(/\.git$/, ""),
    };
  }

  // Handle git@ URLs
  const sshMatch = cleaned.match(/git@github\.com:([^/]+)\/([^/\s]+)/);
  if (sshMatch?.[1] && sshMatch[2]) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2].replace(/\.git$/, ""),
    };
  }

  // Handle owner/repo format
  if (cleaned.includes("/") && !cleaned.includes(" ")) {
    const parts = cleaned.split("/").filter(Boolean);
    const owner = parts[0];
    const repo = parts[1];
    if (parts.length === 2 && owner && repo) {
      return {
        owner,
        repo: repo.replace(/\.git$/, ""),
      };
    }
  }

  return null;
}

type GitHubTag = {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
};

type GitHubRelease = {
  tag_name: string;
  name: string;
  prerelease: boolean;
  draft: boolean;
  published_at: string;
  html_url: string;
  target_commitish: string;
};

// ---------- latestTag: get latest semver tag from GitHub ----------

export const latestTag = tool({
  description:
    "Get the latest semver tag from a GitHub repository. Accepts full URLs, owner/repo, or just owner/repo format. Returns tag name, commit SHA, and comparison info.",
  args: {
    repo: tool.schema
      .string()
      .describe(
        "GitHub repo: URL (https://github.com/owner/repo), SSH (git@github.com:owner/repo), or owner/repo format",
      ),
    includePrerelease: tool.schema
      .boolean()
      .default(false)
      .describe("Include prerelease versions (-alpha, -beta, -rc) in results"),
    showAll: tool.schema
      .boolean()
      .default(false)
      .describe("Show all semver tags sorted by version (max 20)"),
  },
  async execute(args) {
    const parsed = parseRepoInput(args.repo);
    if (!parsed) {
      throw new Error(
        `Invalid repo format: "${args.repo}". Expected: owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo`,
      );
    }

    const { owner, repo } = parsed;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "opencode-github-tool",
    };

    // Use GITHUB_TOKEN if available for higher rate limits
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      if (response.status === 403) {
        const remaining = response.headers.get("X-RateLimit-Remaining");
        if (remaining === "0") {
          throw new Error(
            "GitHub API rate limit exceeded. Set GITHUB_TOKEN env var for higher limits.",
          );
        }
      }
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    const tags = (await response.json()) as GitHubTag[];

    // Filter to semver tags only
    let semverTags = tags.filter((t) => isSemverTag(t.name));

    // Optionally filter out prereleases
    if (!args.includePrerelease) {
      semverTags = semverTags.filter((t) => !/-/.test(t.name));
    }

    if (semverTags.length === 0) {
      return JSON.stringify({
        tool: "github_latest_tag",
        repo: `${owner}/${repo}`,
        found: false,
        message: "No semver tags found in repository",
        totalTags: tags.length,
        nonSemverTags: tags.slice(0, 5).map((t) => t.name),
      });
    }

    // Sort by semver descending
    semverTags.sort((a, b) => compareSemver(b.name, a.name));

    const latest = semverTags[0];
    if (!latest) {
      throw new Error("Unexpected: no tags after length check");
    }
    const result: Record<string, unknown> = {
      tool: "github_latest_tag",
      repo: `${owner}/${repo}`,
      found: true,
      latest: {
        tag: latest.name,
        commit: latest.commit.sha.substring(0, 7),
        commitFull: latest.commit.sha,
        url: `https://github.com/${owner}/${repo}/releases/tag/${latest.name}`,
      },
      totalSemverTags: semverTags.length,
    };

    if (args.showAll) {
      result.allTags = semverTags.slice(0, 20).map((t) => ({
        tag: t.name,
        commit: t.commit.sha.substring(0, 7),
      }));
    }

    return JSON.stringify(result);
  },
});

// ---------- latestRelease: get latest GitHub release ----------

export const latestRelease = tool({
  description:
    "Get the latest GitHub release (not just tag). Includes release notes URL, publication date, and whether it's a prerelease. Uses GitHub Releases API.",
  args: {
    repo: tool.schema
      .string()
      .describe(
        "GitHub repo: URL (https://github.com/owner/repo), SSH (git@github.com:owner/repo), or owner/repo format",
      ),
    includePrerelease: tool.schema
      .boolean()
      .default(false)
      .describe("Include prerelease versions in results"),
    showAll: tool.schema
      .boolean()
      .default(false)
      .describe("Show recent releases (max 10)"),
  },
  async execute(args) {
    const parsed = parseRepoInput(args.repo);
    if (!parsed) {
      throw new Error(
        `Invalid repo format: "${args.repo}". Expected: owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo`,
      );
    }

    const { owner, repo } = parsed;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "opencode-github-tool",
    };

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Try to get latest release first (excludes prereleases by default)
    if (!args.includePrerelease && !args.showAll) {
      const latestUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      const latestResponse = await fetch(latestUrl, { headers });

      if (latestResponse.ok) {
        const release = (await latestResponse.json()) as GitHubRelease;
        return JSON.stringify({
          tool: "github_latest_release",
          repo: `${owner}/${repo}`,
          found: true,
          release: {
            tag: release.tag_name,
            name: release.name || release.tag_name,
            prerelease: release.prerelease,
            publishedAt: release.published_at,
            url: release.html_url,
          },
        });
      }
    }

    // Fall back to listing releases
    const listUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`;
    const listResponse = await fetch(listUrl, { headers });

    if (!listResponse.ok) {
      if (listResponse.status === 404) {
        throw new Error(`Repository not found: ${owner}/${repo}`);
      }
      throw new Error(
        `GitHub API error: ${listResponse.status} ${listResponse.statusText}`,
      );
    }

    let releases = (await listResponse.json()) as GitHubRelease[];

    // Filter out drafts
    releases = releases.filter((r) => !r.draft);

    // Optionally filter out prereleases
    if (!args.includePrerelease) {
      releases = releases.filter((r) => !r.prerelease);
    }

    if (releases.length === 0) {
      return JSON.stringify({
        tool: "github_latest_release",
        repo: `${owner}/${repo}`,
        found: false,
        message: args.includePrerelease
          ? "No releases found in repository"
          : "No stable releases found. Try includePrerelease: true",
      });
    }

    const latest = releases[0];
    if (!latest) {
      throw new Error("Unexpected: no releases after length check");
    }
    const result: Record<string, unknown> = {
      tool: "github_latest_release",
      repo: `${owner}/${repo}`,
      found: true,
      release: {
        tag: latest.tag_name,
        name: latest.name || latest.tag_name,
        prerelease: latest.prerelease,
        publishedAt: latest.published_at,
        url: latest.html_url,
      },
    };

    if (args.showAll) {
      result.recentReleases = releases.slice(0, 10).map((r) => ({
        tag: r.tag_name,
        name: r.name || r.tag_name,
        prerelease: r.prerelease,
        publishedAt: r.published_at,
      }));
    }

    return JSON.stringify(result);
  },
});

// ---------- compareVersions: compare two versions ----------

export const compareVersions = tool({
  description:
    "Compare two semver versions or check if a repo has updates. Can compare two version strings or check current vs latest.",
  args: {
    repo: tool.schema
      .string()
      .optional()
      .describe("GitHub repo to check for latest version (optional)"),
    current: tool.schema
      .string()
      .describe("Current version to compare (e.g., v1.2.3 or 1.2.3)"),
    target: tool.schema
      .string()
      .optional()
      .describe(
        "Target version to compare against. If omitted and repo provided, compares against latest",
      ),
  },
  async execute(args) {
    let targetVersion = args.target;

    // If no target but repo provided, fetch latest
    if (!targetVersion && args.repo) {
      const parsed = parseRepoInput(args.repo);
      if (!parsed) {
        throw new Error(`Invalid repo format: "${args.repo}"`);
      }

      const { owner, repo } = parsed;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/tags?per_page=100`;

      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "opencode-github-tool",
      };

      const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`,
        );
      }

      const tags = (await response.json()) as GitHubTag[];
      const semverTags = tags
        .filter((t) => isSemverTag(t.name) && !/-/.test(t.name))
        .sort((a, b) => compareSemver(b.name, a.name));

      const latestTag = semverTags[0];
      if (!latestTag) {
        throw new Error("No semver tags found in repository");
      }

      targetVersion = latestTag.name;
    }

    if (!targetVersion) {
      throw new Error(
        "Either target version or repo must be provided to compare against",
      );
    }

    const comparison = compareSemver(args.current, targetVersion);

    let status: "current" | "behind" | "ahead";
    let message: string;

    if (comparison === 0) {
      status = "current";
      message = `${args.current} is the same as ${targetVersion}`;
    } else if (comparison < 0) {
      status = "behind";
      message = `${args.current} is behind ${targetVersion}`;
    } else {
      status = "ahead";
      message = `${args.current} is ahead of ${targetVersion}`;
    }

    return JSON.stringify({
      tool: "github_compare_versions",
      current: args.current,
      target: targetVersion,
      repo: args.repo || null,
      status,
      message,
      updateAvailable: status === "behind",
    });
  },
});

// ---------- actionMeta: fetch and parse GitHub Action metadata ----------

type ActionInput = {
  description?: string;
  required?: boolean;
  default?: string;
  deprecationMessage?: string;
};

type ActionOutput = {
  description?: string;
  value?: string;
};

type ActionYaml = {
  name?: string;
  description?: string;
  author?: string;
  inputs?: Record<string, ActionInput>;
  outputs?: Record<string, ActionOutput>;
  runs?: {
    using?: string;
    main?: string;
    pre?: string;
    post?: string;
    steps?: unknown[];
    image?: string;
  };
  branding?: {
    icon?: string;
    color?: string;
  };
};

/**
 * Parse action reference: owner/repo, owner/repo@ref, owner/repo/path, owner/repo/path@ref
 */
function parseActionRef(input: string): {
  owner: string;
  repo: string;
  path: string;
  ref: string;
} | null {
  let cleaned = input.trim();

  // Strip GitHub URL prefix if present
  cleaned = cleaned.replace(/^https?:\/\/github\.com\//, "");
  cleaned = cleaned.replace(/^git@github\.com:/, "");
  cleaned = cleaned.replace(/\.git$/, "");

  // Split off @ref if present
  let ref = "HEAD";
  const atIndex = cleaned.indexOf("@");
  if (atIndex !== -1) {
    ref = cleaned.slice(atIndex + 1);
    cleaned = cleaned.slice(0, atIndex);
  }

  const parts = cleaned.split("/").filter(Boolean);
  const owner = parts[0];
  const repo = parts[1];
  if (parts.length < 2 || !owner || !repo) return null;

  return {
    owner,
    repo,
    path: parts.slice(2).join("/"),
    ref,
  };
}

export const actionMeta = tool({
  description:
    "Fetch and parse a GitHub Action's action.yml/action.yaml. Returns structured metadata including inputs, outputs, name, description, and run configuration.",
  args: {
    action: tool.schema
      .string()
      .describe(
        "Action reference: owner/repo, owner/repo@v1, owner/repo/path, or owner/repo/path@v1 (e.g., actions/checkout@v4, actions/cache/restore@v4)",
      ),
    showRaw: tool.schema
      .boolean()
      .default(false)
      .describe("Include raw YAML content in response"),
  },
  async execute(args) {
    const parsed = parseActionRef(args.action);
    if (!parsed) {
      throw new Error(
        `Invalid action format: "${args.action}". Expected: owner/repo, owner/repo@ref, or owner/repo/path@ref`,
      );
    }

    const { owner, repo, path, ref } = parsed;
    const basePath = path ? `${path}/` : "";

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "opencode-github-tool",
    };

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Try action.yml first, then action.yaml
    let yamlContent: string | null = null;
    let filename: string | null = null;

    for (const fname of ["action.yml", "action.yaml"]) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${basePath}${fname}?ref=${ref}`;
      const response = await fetch(url, { headers });

      if (response.ok) {
        yamlContent = await response.text();
        filename = fname;
        break;
      }
    }

    if (!yamlContent || !filename) {
      throw new Error(
        `No action.yml or action.yaml found in ${owner}/${repo}${path ? `/${path}` : ""} at ref ${ref}`,
      );
    }

    // Parse YAML using Bun's native parser
    const action = Bun.YAML.parse(yamlContent) as ActionYaml;

    // Structure the inputs
    const inputs: Record<
      string,
      { description: string; required: boolean; default: string | null }
    > = {};
    if (action.inputs) {
      for (const [name, input] of Object.entries(action.inputs)) {
        inputs[name] = {
          description: input.description ?? "",
          required: input.required ?? false,
          default: input.default ?? null,
        };
      }
    }

    // Structure the outputs
    const outputs: Record<string, { description: string }> = {};
    if (action.outputs) {
      for (const [name, output] of Object.entries(action.outputs)) {
        outputs[name] = {
          description: output.description ?? "",
        };
      }
    }

    // Determine action type
    let actionType: "javascript" | "composite" | "docker" | "unknown" = "unknown";
    if (action.runs?.using?.startsWith("node")) {
      actionType = "javascript";
    } else if (action.runs?.using === "composite") {
      actionType = "composite";
    } else if (action.runs?.using === "docker") {
      actionType = "docker";
    }

    const result: Record<string, unknown> = {
      tool: "github_action_meta",
      action: `${owner}/${repo}${path ? `/${path}` : ""}`,
      ref,
      file: filename,
      name: action.name ?? null,
      description: action.description ?? null,
      author: action.author ?? null,
      type: actionType,
      inputs,
      outputs,
      inputCount: Object.keys(inputs).length,
      outputCount: Object.keys(outputs).length,
    };

    if (actionType === "composite" && action.runs?.steps) {
      result.stepCount = action.runs.steps.length;
    }

    if (action.branding) {
      result.branding = action.branding;
    }

    if (args.showRaw) {
      result.raw = yamlContent;
    }

    return JSON.stringify(result);
  },
});
