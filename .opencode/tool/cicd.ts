/// <reference types="bun-types" />
/// <reference types="@opencode-ai/plugin" />

import { tool } from "@opencode-ai/plugin";

const REPOSITORY = "kjanat/zig-wasm";

// ---------- types ----------

type WorkflowRun = {
  databaseId: number;
  conclusion: string | null;
  status: string;
  workflowName: string;
  headBranch: string;
  event: string;
  createdAt: string;
  url?: string;
};

type JobStep = {
  name: string;
  conclusion: string;
  status: string;
  number: number;
};

type Job = {
  name: string;
  conclusion: string;
  status: string;
  databaseId: number;
  url: string;
  steps: JobStep[];
};

type RunDetails = {
  conclusion: string | null;
  status: string;
  workflowName: string;
  headBranch: string;
  event: string;
  createdAt: string;
  url: string;
  jobs: Job[];
};

// ---------- helpers ----------

async function runGh(args: string[]): Promise<string> {
  const proc = Bun.spawn(["gh", ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`gh ${args.join(" ")} failed: ${stderr}`);
  }
  return stdout;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusIcon(conclusion: string | null, status: string): string {
  if (status === "in_progress" || status === "queued") return "[RUNNING]";
  switch (conclusion) {
    case "success":
      return "[OK]";
    case "failure":
      return "[FAIL]";
    case "cancelled":
      return "[CANCELLED]";
    case "skipped":
      return "[SKIP]";
    default:
      return `[${conclusion ?? status}]`;
  }
}

// ---------- status: get CI/CD status ----------

export const status = tool({
  description:
    "Get CI/CD pipeline status for last push. Returns workflow runs, job status, and failed step details in AI-friendly format.",
  args: {
    limit: tool.schema
      .number()
      .optional()
      .default(5)
      .describe("Number of recent runs to show per workflow (default: 5)"),
    workflow: tool.schema
      .string()
      .optional()
      .describe("Filter to specific workflow name (CI, CD, etc)"),
    branch: tool.schema
      .string()
      .optional()
      .describe("Filter to specific branch (default: all branches)"),
    verbose: tool.schema
      .boolean()
      .optional()
      .default(false)
      .describe("Include step-level details for all jobs, not just failed ones"),
  },
  async execute(args) {
    const limit = args.limit ?? 5;
    const repo = REPOSITORY;

    // Build list command
    // dprint-ignore
    const listArgs = [
      "run", "list",
      "--repo", repo,
      "--limit", String(limit * 3), // Get more to filter
      "--json", "databaseId,conclusion,status,workflowName,headBranch,event,createdAt",
    ];

    if (args.workflow) {
      listArgs.push("--workflow", args.workflow);
    }

    const runsJson = await runGh(listArgs);
    let runs: WorkflowRun[] = JSON.parse(runsJson);

    // Filter by branch if specified
    if (args.branch) {
      runs = runs.filter((r) => r.headBranch === args.branch);
    }

    // Group by workflow
    const byWorkflow = new Map<string, WorkflowRun[]>();
    for (const run of runs) {
      const existing = byWorkflow.get(run.workflowName) ?? [];
      if (existing.length < limit) {
        existing.push(run);
        byWorkflow.set(run.workflowName, existing);
      }
    }

    // Build output
    const sections: string[] = [];
    sections.push("# CI/CD Status Report\n");

    // Summary
    const latestByWorkflow = new Map<string, WorkflowRun>();
    for (const [name, wfRuns] of byWorkflow) {
      if (wfRuns[0]) latestByWorkflow.set(name, wfRuns[0]);
    }

    sections.push("## Summary\n");
    for (const [name, run] of latestByWorkflow) {
      const icon = statusIcon(run.conclusion, run.status);
      sections.push(`- **${name}**: ${icon} (${run.headBranch}, ${formatTime(run.createdAt)})`);
    }
    sections.push("");

    // Detailed runs
    for (const [workflowName, wfRuns] of byWorkflow) {
      sections.push(`## ${workflowName}\n`);

      for (const run of wfRuns) {
        const icon = statusIcon(run.conclusion, run.status);
        const header = `### ${icon} ${run.headBranch} - ${run.event} (${formatTime(run.createdAt)})`;
        sections.push(header);
        sections.push(`Run ID: ${run.databaseId}\n`);

        // Get job details for failed or in-progress runs (or all if verbose)
        const needsDetails = args.verbose
          || run.conclusion === "failure"
          || run.status === "in_progress"
          || run.status === "queued";

        if (needsDetails) {
          try {
            // dprint-ignore
            const detailsJson = await runGh([
              "run", "view", String(run.databaseId),
              "--repo", repo,
              "--json", "jobs,url",
            ]);
            const details: Pick<RunDetails, "jobs" | "url"> = JSON.parse(detailsJson);

            sections.push(`URL: ${details.url}\n`);
            sections.push("**Jobs:**\n");

            for (const job of details.jobs) {
              const jobIcon = statusIcon(job.conclusion, job.status);
              sections.push(`- ${jobIcon} **${job.name}**`);

              // Show failed steps or all steps if verbose
              const failedSteps = job.steps.filter(
                (s) => s.conclusion === "failure" || s.conclusion === "cancelled",
              );
              const stepsToShow = args.verbose ? job.steps : failedSteps;

              if (stepsToShow.length > 0) {
                for (const step of stepsToShow) {
                  const stepIcon = statusIcon(step.conclusion, step.status);
                  sections.push(`  - ${stepIcon} Step ${step.number}: ${step.name}`);
                }
              }
            }
            sections.push("");
          } catch {
            sections.push("(Could not fetch job details)\n");
          }
        }
      }
    }

    // Action items
    const failures = runs.filter((r) => r.conclusion === "failure");
    const inProgress = runs.filter((r) => r.status === "in_progress" || r.status === "queued");

    if (failures.length > 0 || inProgress.length > 0) {
      sections.push("## Action Items\n");

      if (failures.length > 0) {
        sections.push("**Failures requiring attention:**");
        for (const f of failures.slice(0, 3)) {
          sections.push(`- ${f.workflowName} on ${f.headBranch} (run ${f.databaseId})`);
        }
        sections.push("");
      }

      if (inProgress.length > 0) {
        sections.push("**Currently running:**");
        for (const r of inProgress) {
          sections.push(`- ${r.workflowName} on ${r.headBranch}`);
        }
        sections.push("");
      }
    }

    return sections.join("\n");
  },
});

// ---------- logs: get logs for a specific job ----------

export const logs = tool({
  description: "Get logs for a specific workflow run or job. Use after `status` to investigate failures.",
  args: {
    runId: tool.schema.number().describe("Workflow run ID (from status output)"),
    job: tool.schema
      .string()
      .optional()
      .describe("Job name to get logs for (optional, gets all if not specified)"),
    failed: tool.schema
      .boolean()
      .optional()
      .default(true)
      .describe("Only show failed job logs (default: true)"),
    tail: tool.schema
      .number()
      .optional()
      .default(100)
      .describe("Number of log lines to show (default: 100)"),
  },
  async execute(args) {
    const repo = REPOSITORY;
    const tail = args.tail ?? 100;

    // Get run details first
    // dprint-ignore
    const detailsJson = await runGh([
      "run", "view", String(args.runId),
      "--repo", repo,
      "--json", "jobs,workflowName,conclusion,headBranch,url",
    ]);
    const details: RunDetails = JSON.parse(detailsJson);

    const sections: string[] = [];
    sections.push(`# Logs for ${details.workflowName} (Run ${args.runId})\n`);
    sections.push(`Branch: ${details.headBranch}`);
    sections.push(`Conclusion: ${details.conclusion}`);
    sections.push(`URL: ${details.url}\n`);

    // Filter jobs
    let jobs = details.jobs;
    if (args.job) {
      const jobFilter = args.job; // Type is narrowed to string
      jobs = jobs.filter((j) => j.name.toLowerCase().includes(jobFilter.toLowerCase()));
    }
    if (args.failed) {
      jobs = jobs.filter((j) => j.conclusion === "failure");
    }

    if (jobs.length === 0) {
      sections.push("No matching jobs found.");
      if (args.failed) {
        sections.push("(Try with `failed: false` to see all jobs)");
      }
      return sections.join("\n");
    }

    for (const job of jobs) {
      sections.push(`## Job: ${job.name}\n`);
      sections.push(`Conclusion: ${job.conclusion}`);
      sections.push(`URL: ${job.url}\n`);

      // Get job logs
      try {
        const logProc = Bun.spawn(
          ["gh", "run", "view", String(args.runId), "--repo", repo, "--log", "--job", String(job.databaseId)],
          {
            stdout: "pipe",
            stderr: "pipe",
          },
        );
        const [stdout] = await Promise.all([
          new Response(logProc.stdout).text(),
          new Response(logProc.stderr).text(),
        ]);
        await logProc.exited;

        // Trim to tail lines
        const lines = stdout.trim().split("\n");
        const trimmed = lines.slice(-tail);

        sections.push("```");
        sections.push(trimmed.join("\n"));
        sections.push("```\n");
      } catch (e) {
        sections.push(`(Could not fetch logs: ${e})\n`);
      }
    }

    return sections.join("\n");
  },
});

// ---------- rerun: trigger a workflow rerun ----------

export const rerun = tool({
  description: "Rerun a failed workflow run. Use after investigating with `status` and `logs`.",
  args: {
    runId: tool.schema.number().describe("Workflow run ID to rerun"),
    failed: tool.schema
      .boolean()
      .optional()
      .default(true)
      .describe("Only rerun failed jobs (default: true)"),
  },
  async execute(args) {
    const repo = REPOSITORY;
    const rerunArgs = ["run", "rerun", String(args.runId), "--repo", repo];

    if (args.failed) {
      rerunArgs.push("--failed");
    }

    try {
      await runGh(rerunArgs);
      return `Triggered rerun for run ${args.runId}${
        args.failed ? " (failed jobs only)" : " (all jobs)"
      }.\nUse \`status\` to monitor progress.`;
    } catch (e) {
      return `Failed to trigger rerun: ${e}`;
    }
  },
});

// ---------- cancel: cancel a running workflow ----------

export const cancel = tool({
  description: "Cancel a running workflow. Use when a run is stuck or no longer needed.",
  args: {
    runId: tool.schema.number().describe("Workflow run ID to cancel"),
  },
  async execute(args) {
    const repo = REPOSITORY;

    try {
      await runGh(["run", "cancel", String(args.runId), "--repo", repo]);
      return `Cancelled run ${args.runId}.\nUse \`status\` to verify.`;
    } catch (e) {
      return `Failed to cancel run: ${e}`;
    }
  },
});
