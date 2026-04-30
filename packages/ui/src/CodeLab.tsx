"use client";

import { useState } from "react";
import { runCobol, type RunResult } from "@cobol-mf/sandbox-client";
import { markProgress } from "./markProgress";

export type CodeLabProps = {
  lessonId: string;
  starter: string;
  expectedOutput?: string;
  expectedOutputRegex?: string;
  runtime?: "wasm" | "server" | "auto";
  hints?: string[];
};

function checkPass(out: string, expected?: string, regex?: string): boolean {
  const trimmed = out.trim();
  if (regex) {
    try {
      return new RegExp(regex).test(trimmed);
    } catch {
      return false;
    }
  }
  if (expected) return trimmed === expected.trim();
  return false;
}

export function CodeLab(props: CodeLabProps) {
  const [source, setSource] = useState(props.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const passed =
    result !== null &&
    result.exitCode === 0 &&
    checkPass(
      result.stdout,
      props.expectedOutput,
      props.expectedOutputRegex,
    );

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const r = await runCobol({
        source,
        preferred: props.runtime ?? "auto",
      });
      setResult(r);
      if (r.exitCode === 0 && checkPass(r.stdout, props.expectedOutput, props.expectedOutputRegex)) {
        await markProgress({
          lessonId: props.lessonId,
          status: "passed",
          score: 1,
          submission: { source, stdout: r.stdout, stderr: r.stderr },
        });
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="my-6 rounded-lg border border-[#1f2933] bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-[#1f2933] px-4 py-2 text-xs text-[#a8a59b]">
        <span className="font-mono">CODE LAB · {props.runtime ?? "auto"}</span>
        {props.expectedOutput && (
          <span>
            expected stdout:&nbsp;
            <code className="text-terminal-amber">{props.expectedOutput}</code>
          </span>
        )}
      </div>
      <textarea
        className="block w-full resize-y bg-[#0d1117] p-4 font-mono text-sm text-[#d6d3cb] outline-none"
        rows={Math.max(10, source.split("\n").length + 1)}
        spellCheck={false}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <div className="flex items-center justify-between border-t border-[#1f2933] px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={run}
            disabled={running}
            className="rounded bg-terminal-green px-3 py-1 font-mono text-sm font-semibold text-[#0a0e14] disabled:opacity-50"
          >
            {running ? "Running…" : "Run"}
          </button>
          {props.hints && props.hints.length > 0 && (
            <button
              onClick={() => setShowHints((v) => !v)}
              className="rounded border border-[#1f2933] px-3 py-1 font-mono text-xs text-[#a8a59b] hover:border-terminal-amber"
            >
              {showHints ? "Hide hints" : `Hints (${props.hints.length})`}
            </button>
          )}
        </div>
        {result && (
          <span
            className={`font-mono text-xs ${
              passed ? "text-terminal-green" : "text-terminal-red"
            }`}
          >
            exit {result.exitCode} · {result.durationMs}ms · {result.runtime}
          </span>
        )}
      </div>
      {showHints && props.hints && (
        <ul className="border-t border-[#1f2933] bg-[#11161d] px-6 py-3 text-sm text-terminal-amber">
          {props.hints.map((h, i) => (
            <li key={i} className="list-disc">
              {h}
            </li>
          ))}
        </ul>
      )}
      {result && (
        <div className="border-t border-[#1f2933]">
          {result.stdout && (
            <pre className="m-0 whitespace-pre-wrap break-words bg-[#0a0e14] p-4 font-mono text-sm text-[#d6d3cb]">
              {result.stdout}
            </pre>
          )}
          {result.stderr && (
            <pre className="m-0 whitespace-pre-wrap break-words bg-[#11070a] p-4 font-mono text-sm text-terminal-red">
              {result.stderr}
            </pre>
          )}
        </div>
      )}
      {passed && (
        <div className="border-t border-terminal-green/40 bg-terminal-green/10 px-4 py-2 font-mono text-sm text-terminal-green">
          ✓ Passed — lesson marked complete.
        </div>
      )}
    </div>
  );
}
