import Link from "next/link";
import { notFound } from "next/navigation";
import { getPillarTree } from "@/app/lib/content";
import { getProgressMap } from "@/app/lib/progress";
import { ProgressMark } from "@cobol-mf/ui";
import { Pillar } from "@cobol-mf/lesson-schema";

export const dynamic = "force-dynamic";

export default async function PillarIndex({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar } = await params;
  const parsed = Pillar.safeParse(pillar);
  if (!parsed.success) notFound();
  const tree = getPillarTree().find((p) => p.pillar === parsed.data);
  if (!tree) notFound();
  const progress = await getProgressMap();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/learn" className="text-xs text-[#a8a59b] hover:text-terminal-blue">
        ← all pillars
      </Link>
      <h1 className="mb-6 mt-2 text-3xl font-bold text-white">{tree.title}</h1>
      {tree.modules.length === 0 && (
        <p className="text-[#a8a59b]">No lessons yet — content coming soon.</p>
      )}
      {tree.modules.map((m) => (
        <section key={m.module} className="mb-8">
          <h2 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
            module · {m.module}
          </h2>
          <ul className="divide-y divide-[#1f2933] rounded-lg border border-[#1f2933] bg-[#11161d]">
            {m.lessons.map((l) => {
              const p = progress.get(`${l.pillar}/${l.module}/${l.slug}`);
              return (
                <li key={l.slug}>
                  <Link
                    href={l.href}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[#172029]"
                  >
                    <span className="mt-1">
                      <ProgressMark status={p?.status ?? "not_started"} />
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium text-white">
                        {l.order}. {l.title}
                      </span>
                      <span className="block text-sm text-[#a8a59b]">
                        {l.summary}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-[#6c7079]">
                      {l.estimatedMinutes}m
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
