import type { ReactNode } from "react";

export type DiagramProps = {
  title?: string;
  children: ReactNode;
};

export function Diagram({ title, children }: DiagramProps) {
  return (
    <figure className="my-6 rounded-lg border border-[#1f2933] bg-[#11161d] p-4">
      {title && (
        <figcaption className="mb-3 font-mono text-xs uppercase text-[#a8a59b]">
          {title}
        </figcaption>
      )}
      <div className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-[#d6d3cb]">
        {children}
      </div>
    </figure>
  );
}
