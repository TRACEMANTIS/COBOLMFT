import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getLesson, neighbors } from "@/app/lib/content";
import { lessonId } from "@cobol-mf/lesson-schema";
import {
  Callout,
  CodeLab,
  Diagram,
  JCLLab,
  LatencyBudget,
  Quiz,
  SwitchSim,
} from "@cobol-mf/ui";

export const dynamic = "force-dynamic";

const components = {
  Callout,
  CodeLab,
  Diagram,
  JCLLab,
  LatencyBudget,
  Quiz,
  SwitchSim,
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ pillar: string; module: string; lesson: string }>;
}) {
  const { pillar, module, lesson } = await params;
  const l = getLesson(pillar, module, lesson);
  if (!l) notFound();

  const id = lessonId(l);
  const { prev, next } = neighbors(l);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href={`/learn/${l.pillar}`}
        className="text-xs text-[#a8a59b] hover:text-terminal-blue"
      >
        ← {l.pillar}
      </Link>
      <article className="prose-cobol mt-3">
        <p className="font-mono text-xs uppercase text-[#a8a59b]">
          {l.pillar} · {l.module} · {l.estimatedMinutes}m
        </p>
        <h1>{l.title}</h1>
        <p className="text-[#a8a59b]">{l.summary}</p>
        {l.objectives.length > 0 && (
          <Callout kind="info" title="Objectives">
            <ul className="ml-5 list-disc">
              {l.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </Callout>
        )}
        <MDXRemote
          source={l.body}
          components={components}
          options={{
            scope: { lessonId: id },
          }}
        />
      </article>
      <nav className="mt-10 flex items-center justify-between border-t border-[#1f2933] pt-4 text-sm">
        {prev ? (
          <Link className="text-[#a8a59b] hover:text-terminal-blue" href={prev.href}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="text-[#a8a59b] hover:text-terminal-blue" href={next.href}>
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
