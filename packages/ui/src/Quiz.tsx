"use client";

import { useMemo, useState } from "react";
import { markProgress } from "./markProgress";

export type QuizQuestion = {
  prompt: string;
  multi?: boolean;
  options: { id: string; label: string; correct?: boolean; explanation?: string }[];
};

export type QuizProps = {
  lessonId: string;
  questions: QuizQuestion[];
};

export function Quiz({ lessonId, questions }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, Set<string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function toggle(qi: number, optId: string, multi: boolean) {
    setAnswers((prev) => {
      const cur = new Set(prev[qi] ?? []);
      if (multi) {
        if (cur.has(optId)) cur.delete(optId);
        else cur.add(optId);
      } else {
        cur.clear();
        cur.add(optId);
      }
      return { ...prev, [qi]: cur };
    });
  }

  const score = useMemo(() => {
    if (!submitted) return 0;
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const correctIds = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
      const chosen = answers[i] ?? new Set<string>();
      const allMatch =
        chosen.size === correctIds.size &&
        [...chosen].every((c) => correctIds.has(c));
      if (allMatch) correct += 1;
    }
    return correct / questions.length;
  }, [submitted, answers, questions]);

  async function submit() {
    setSubmitted(true);
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      const correctIds = new Set(q.options.filter((o) => o.correct).map((o) => o.id));
      const chosen = answers[i] ?? new Set<string>();
      const allMatch =
        chosen.size === correctIds.size &&
        [...chosen].every((c) => correctIds.has(c));
      if (allMatch) correct += 1;
    }
    const s = correct / questions.length;
    await markProgress({
      lessonId,
      status: s === 1 ? "passed" : "failed",
      score: s,
    });
  }

  return (
    <div className="my-6 rounded-lg border border-[#1f2933] bg-[#11161d] p-5">
      <div className="mb-4 font-mono text-xs uppercase text-[#a8a59b]">Quiz</div>
      {questions.map((q, qi) => {
        const chosen = answers[qi] ?? new Set<string>();
        return (
          <div key={qi} className="mb-5">
            <p className="mb-2 font-medium text-white">{qi + 1}. {q.prompt}</p>
            <div className="space-y-1">
              {q.options.map((o) => {
                const isChosen = chosen.has(o.id);
                const showCorrect = submitted && o.correct;
                const showWrong = submitted && isChosen && !o.correct;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-2 rounded border px-3 py-2 text-sm ${
                      showCorrect
                        ? "border-terminal-green bg-terminal-green/10"
                        : showWrong
                          ? "border-terminal-red bg-terminal-red/10"
                          : isChosen
                            ? "border-terminal-blue bg-terminal-blue/10"
                            : "border-[#1f2933] hover:border-[#3a4452]"
                    }`}
                  >
                    <input
                      type={q.multi ? "checkbox" : "radio"}
                      name={`q-${qi}`}
                      checked={isChosen}
                      onChange={() => toggle(qi, o.id, !!q.multi)}
                      className="mt-1"
                    />
                    <span>
                      <span>{o.label}</span>
                      {submitted && o.explanation && (
                        <span className="mt-1 block text-xs text-[#a8a59b]">
                          {o.explanation}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <button
          onClick={submit}
          className="rounded bg-terminal-green px-3 py-1 font-mono text-sm font-semibold text-[#0a0e14]"
        >
          Submit
        </button>
        {submitted && (
          <span
            className={`font-mono text-sm ${
              score === 1 ? "text-terminal-green" : "text-terminal-amber"
            }`}
          >
            {Math.round(score * 100)}% · {score === 1 ? "passed" : "try again"}
          </span>
        )}
      </div>
    </div>
  );
}
