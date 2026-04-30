import Link from "next/link";
import { getPillarTree } from "@/app/lib/content";
import { ProgressMark } from "@cobol-mf/ui";
import { getProgressMap } from "@/app/lib/progress";

export const dynamic = "force-dynamic";

export default async function LearnIndex() {
  const tree = getPillarTree();
  const progress = await getProgressMap();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-bold text-white">Learn</h1>
      <p className="mb-8 text-[#a8a59b]">
        Three pillars, modules of progressive lessons, each ending with a
        graded exercise.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {tree.map((p) => {
          const total = p.modules.flatMap((m) => m.lessons).length;
          const done = p.modules
            .flatMap((m) => m.lessons)
            .filter((l) => progress.get(`${l.pillar}/${l.module}/${l.slug}`)?.status === "passed")
            .length;
          return (
            <Link
              key={p.pillar}
              href={`/learn/${p.pillar}`}
              className="rounded-lg border border-[#1f2933] bg-[#11161d] p-5 hover:border-terminal-blue"
            >
              <h2 className="mb-1 font-mono text-lg text-white">{p.title}</h2>
              <p className="text-xs text-[#a8a59b]">
                {done} / {total} lessons complete
              </p>
              <ul className="mt-4 space-y-1 text-sm">
                {p.modules
                  .flatMap((m) => m.lessons)
                  .slice(0, 5)
                  .map((l) => (
                    <li key={l.slug} className="flex items-center gap-2">
                      <ProgressMark
                        status={
                          progress.get(`${l.pillar}/${l.module}/${l.slug}`)?.status ??
                          "not_started"
                        }
                      />
                      <span className="truncate">{l.title}</span>
                    </li>
                  ))}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
