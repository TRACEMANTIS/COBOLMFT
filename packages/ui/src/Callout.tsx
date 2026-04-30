import type { ReactNode } from "react";

export type CalloutProps = {
  kind?: "info" | "warn" | "tip";
  title?: string;
  children: ReactNode;
};

const COLOURS: Record<NonNullable<CalloutProps["kind"]>, { border: string; text: string }> = {
  info: { border: "border-terminal-blue", text: "text-terminal-blue" },
  warn: { border: "border-terminal-red", text: "text-terminal-red" },
  tip: { border: "border-terminal-green", text: "text-terminal-green" },
};

export function Callout({ kind = "info", title, children }: CalloutProps) {
  const c = COLOURS[kind];
  return (
    <aside className={`my-4 rounded-r border-l-4 bg-[#11161d] p-4 ${c.border}`}>
      {title && (
        <p className={`mb-1 font-mono text-xs uppercase ${c.text}`}>{title}</p>
      )}
      <div className="text-sm">{children}</div>
    </aside>
  );
}
