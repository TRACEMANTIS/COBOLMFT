"use client";

import { useEffect, useMemo, useState } from "react";
import {
  componentNs,
  formatLatency,
  totalNs,
  type LatencyComponent,
} from "./latency";
import { markProgress } from "./markProgress";

export type LatencyBudgetProps = {
  lessonId: string;
  budgetNs: number;
  starter?: LatencyComponent[];
  goalDescription?: string;
};

const BLANK: LatencyComponent[] = [
  { kind: "fiber", meters: 1000 },
  { kind: "switch", ns: 350, mode: "cut-through" },
  { kind: "nic", ns: 800 },
];

export function LatencyBudget({
  lessonId,
  budgetNs,
  starter,
  goalDescription,
}: LatencyBudgetProps) {
  const [items, setItems] = useState<LatencyComponent[]>(starter ?? BLANK);
  const total = useMemo(() => totalNs(items), [items]);
  const ok = total <= budgetNs;

  useEffect(() => {
    if (ok) {
      void markProgress({
        lessonId,
        status: "passed",
        score: 1,
      });
    }
  }, [ok, lessonId]);

  function update(i: number, patch: Partial<LatencyComponent>) {
    setItems((prev) => {
      const next = prev.slice();
      next[i] = { ...next[i]!, ...patch } as LatencyComponent;
      return next;
    });
  }

  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function add(kind: LatencyComponent["kind"]) {
    const c: LatencyComponent =
      kind === "fiber"
        ? { kind: "fiber", meters: 100 }
        : kind === "copper"
          ? { kind: "copper", meters: 1 }
          : kind === "switch"
            ? { kind: "switch", ns: 350, mode: "cut-through" }
            : kind === "nic"
              ? { kind: "nic", ns: 800 }
              : kind === "host"
                ? { kind: "host", ns: 2_000 }
                : { kind: "custom", label: "Other", ns: 100 };
    setItems((prev) => [...prev, c]);
  }

  return (
    <div className="my-6 rounded-lg border border-[#1f2933] bg-[#0d1117] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-xs uppercase text-[#a8a59b]">
          Latency budget · target {formatLatency(budgetNs)}
        </h4>
        <span
          className={`font-mono text-sm ${
            ok ? "text-terminal-green" : "text-terminal-red"
          }`}
        >
          total: {formatLatency(total)} {ok ? "✓ within" : "✗ over"}
        </span>
      </div>
      {goalDescription && (
        <p className="mb-3 text-sm text-[#a8a59b]">{goalDescription}</p>
      )}
      <div className="space-y-2">
        {items.map((c, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded border border-[#1f2933] bg-[#11161d] p-2 font-mono text-sm"
          >
            <span className="w-20 text-terminal-blue">{c.kind}</span>
            {(c.kind === "fiber" || c.kind === "copper") && (
              <label className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={c.meters}
                  onChange={(e) =>
                    update(i, { meters: Number(e.target.value) } as Partial<LatencyComponent>)
                  }
                  className="w-24 rounded bg-[#0a0e14] px-2 py-1 text-right outline-none"
                />
                <span className="text-[#a8a59b]">m</span>
              </label>
            )}
            {(c.kind === "switch" || c.kind === "nic" || c.kind === "host" || c.kind === "custom") && (
              <label className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={c.ns}
                  onChange={(e) =>
                    update(i, { ns: Number(e.target.value) } as Partial<LatencyComponent>)
                  }
                  className="w-24 rounded bg-[#0a0e14] px-2 py-1 text-right outline-none"
                />
                <span className="text-[#a8a59b]">ns</span>
              </label>
            )}
            {c.kind === "switch" && (
              <select
                value={c.mode ?? "cut-through"}
                onChange={(e) =>
                  update(i, { mode: e.target.value as "cut-through" | "store-and-forward" })
                }
                className="rounded bg-[#0a0e14] px-2 py-1 outline-none"
              >
                <option value="cut-through">cut-through</option>
                <option value="store-and-forward">store-and-fwd</option>
              </select>
            )}
            <span className="ml-auto text-[#a8a59b]">
              = {formatLatency(componentNs(c))}
            </span>
            <button
              onClick={() => remove(i)}
              className="text-terminal-red hover:text-red-400"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["fiber", "copper", "switch", "nic", "host", "custom"] as const).map((k) => (
          <button
            key={k}
            onClick={() => add(k)}
            className="rounded border border-[#1f2933] px-2 py-1 font-mono text-xs hover:border-terminal-blue"
          >
            + {k}
          </button>
        ))}
      </div>
    </div>
  );
}
