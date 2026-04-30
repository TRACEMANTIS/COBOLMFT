"use client";

import { useMemo, useState } from "react";
import { parseJCL, stepNames } from "./jcl";
import { markProgress } from "./markProgress";

export type JCLLabProps = {
  lessonId: string;
  starter: string;
  expectedSteps: string[];
};

export function JCLLab({ lessonId, starter, expectedSteps }: JCLLabProps) {
  const [source, setSource] = useState(starter);
  const parsed = useMemo(() => parseJCL(source), [source]);
  const namesMatch = useMemo(() => {
    const got = stepNames(parsed);
    if (got.length !== expectedSteps.length) return false;
    return got.every((n, i) => n.toUpperCase() === (expectedSteps[i] ?? "").toUpperCase());
  }, [parsed, expectedSteps]);

  const [submitted, setSubmitted] = useState(false);

  async function check() {
    setSubmitted(true);
    await markProgress({
      lessonId,
      status: namesMatch && parsed.errors.length === 0 ? "passed" : "failed",
      score: namesMatch && parsed.errors.length === 0 ? 1 : 0,
    });
  }

  return (
    <div className="my-6 rounded-lg border border-[#1f2933] bg-[#0d1117]">
      <div className="border-b border-[#1f2933] px-4 py-2 font-mono text-xs uppercase text-[#a8a59b]">
        JCL LAB · expected steps: {expectedSteps.join(" → ")}
      </div>
      <textarea
        className="block w-full resize-y bg-[#0d1117] p-4 font-mono text-sm text-[#d6d3cb] outline-none"
        rows={Math.max(10, source.split("\n").length + 1)}
        spellCheck={false}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      />
      <div className="grid grid-cols-1 gap-4 border-t border-[#1f2933] p-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
            Parsed
          </h4>
          <div className="rounded border border-[#1f2933] bg-[#11161d] p-3 text-sm">
            <p className="mb-1">
              JOB: <span className="font-mono text-terminal-blue">{parsed.jobName ?? "—"}</span>
            </p>
            <ol className="ml-5 list-decimal text-[#d6d3cb]">
              {parsed.steps.map((s) => (
                <li key={s.name} className="mb-1 font-mono">
                  <span className="text-terminal-green">{s.name}</span>
                  {s.pgm && <> · PGM=<span className="text-terminal-amber">{s.pgm}</span></>}
                  {s.proc && <> · PROC=<span className="text-terminal-amber">{s.proc}</span></>}
                  {s.dds.length > 0 && (
                    <ul className="ml-4 list-disc text-xs text-[#a8a59b]">
                      {s.dds.map((d) => (
                        <li key={d.name}>
                          //{d.name} DD {d.spec}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
            {parsed.errors.length > 0 && (
              <ul className="mt-2 text-xs text-terminal-red">
                {parsed.errors.map((e, i) => (
                  <li key={i}>· {e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
            Spool (simulated)
          </h4>
          <pre className="rounded border border-[#1f2933] bg-[#0a0e14] p-3 font-mono text-xs text-[#a8a59b]">
            {parsed.steps.length === 0
              ? "// no executable steps"
              : parsed.steps
                  .map(
                    (s) =>
                      `[JES2] ${s.name} ${s.pgm ?? s.proc ?? "?"} — RC=0000`,
                  )
                  .join("\n")}
          </pre>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#1f2933] px-4 py-2">
        <button
          onClick={check}
          className="rounded bg-terminal-green px-3 py-1 font-mono text-sm font-semibold text-[#0a0e14]"
        >
          Check
        </button>
        {submitted && (
          <span
            className={`font-mono text-xs ${
              namesMatch && parsed.errors.length === 0
                ? "text-terminal-green"
                : "text-terminal-red"
            }`}
          >
            {namesMatch && parsed.errors.length === 0
              ? "✓ steps match"
              : "✗ steps do not match"}
          </span>
        )}
      </div>
    </div>
  );
}
