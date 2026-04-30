import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RunRequest = z.object({
  source: z.string().max(64_000),
  stdin: z.string().max(16_000).optional(),
});

const COBOL_IMAGE = process.env.COBOL_IMAGE ?? "cobol-mf/cobol-runtime:latest";
const PORT = Number(process.env.PORT ?? 8080);
const TIMEOUT_MS = Number(process.env.RUNNER_TIMEOUT_MS ?? 10_000);

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

app.post("/run", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = RunRequest.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const work = await mkdtemp(join(tmpdir(), "cobol-mf-"));
  await writeFile(join(work, "prog.cob"), parsed.data.source);
  if (parsed.data.stdin !== undefined) {
    await writeFile(join(work, "stdin"), parsed.data.stdin);
  }

  const args = [
    "run",
    "--rm",
    "--network=none",
    "--read-only",
    "--memory=256m",
    "--cpus=0.5",
    "--pids-limit=64",
    "--tmpfs", "/work:rw,size=32m",
    "-v", `${work}:/in:ro`,
    COBOL_IMAGE,
  ];

  const start = Date.now();
  const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
    (resolve) => {
      const proc = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (b) => { stdout += b.toString("utf8"); });
      proc.stderr.on("data", (b) => { stderr += b.toString("utf8"); });
      const timer = setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch { /* noop */ }
        stderr += `\n[runner] killed after ${TIMEOUT_MS}ms`;
      }, TIMEOUT_MS);
      proc.on("close", (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code ?? -1 });
      });
      if (parsed.data.stdin !== undefined) {
        proc.stdin.write(parsed.data.stdin);
      }
      proc.stdin.end();
    },
  );
  const durationMs = Date.now() - start;

  await rm(work, { recursive: true, force: true }).catch(() => {});

  return c.json({ ...result, durationMs });
});

console.log(`[runner] listening on :${PORT}, image=${COBOL_IMAGE}`);
serve({ fetch: app.fetch, port: PORT });
