import { z } from "zod";
import { compileAndRun as wasmRun, isWasmAvailable } from "@cobol-mf/sandbox-wasm";

export const RunResult = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  durationMs: z.number(),
  runtime: z.enum(["wasm", "server", "unavailable"]),
});
export type RunResult = z.infer<typeof RunResult>;

export type RunOptions = {
  source: string;
  stdin?: string;
  preferred?: "wasm" | "server" | "auto";
};

async function serverRun(opts: RunOptions): Promise<RunResult> {
  const res = await fetch("/api/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: opts.source, stdin: opts.stdin ?? "" }),
  });
  if (!res.ok) {
    const text = await res.text();
    return {
      stdout: "",
      stderr: `runner error: ${res.status} ${text}`,
      exitCode: -1,
      durationMs: 0,
      runtime: "unavailable",
    };
  }
  const json = await res.json();
  return RunResult.parse({ ...json, runtime: "server" });
}

export async function runCobol(opts: RunOptions): Promise<RunResult> {
  const preferred = opts.preferred ?? "auto";
  if (preferred === "wasm" || preferred === "auto") {
    if (await isWasmAvailable()) {
      const r = await wasmRun(opts.source, opts.stdin);
      return { ...r, runtime: "wasm" };
    }
    if (preferred === "wasm") {
      return {
        stdout: "",
        stderr:
          "WASM runtime not bundled in this build. Switch the lesson to runtime=\"server\" or enable the WASM bundle.",
        exitCode: -1,
        durationMs: 0,
        runtime: "unavailable",
      };
    }
  }
  return serverRun(opts);
}
