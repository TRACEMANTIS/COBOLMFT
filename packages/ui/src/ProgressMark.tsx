export type ProgressMarkProps = {
  status?: "passed" | "failed" | "in_progress" | "not_started";
};

export function ProgressMark({ status = "not_started" }: ProgressMarkProps) {
  switch (status) {
    case "passed":
      return <span className="text-terminal-green" aria-label="passed">✓</span>;
    case "failed":
      return <span className="text-terminal-red" aria-label="failed">✗</span>;
    case "in_progress":
      return <span className="text-terminal-amber" aria-label="in progress">…</span>;
    default:
      return <span className="text-[#3a4452]" aria-label="not started">○</span>;
  }
}
