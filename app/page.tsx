import Link from "next/link";

const pillars = [
  {
    slug: "cobol",
    title: "COBOL the language",
    blurb:
      "Divisions, PIC clauses, PERFORM, file I/O, copybooks. Read legacy code, write new code, run it in a sandbox.",
  },
  {
    slug: "mainframe",
    title: "Mainframe concepts",
    blurb:
      "z/OS, LPARs, JCL, JES2 spool, CICS, DB2, RACF, sysplex. Touch the system instead of just reading about it.",
  },
  {
    slug: "networks",
    title: "Low-latency networks",
    blurb:
      "Latency budgets, cut-through switching, kernel bypass, PTP. Design and measure sub-microsecond paths.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-white">
          From green-screen to&nbsp;
          <span className="text-terminal-green">production</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#b3b1ad]">
          A single, hands-on platform that takes you from never having seen a
          green screen to reading, writing, and reasoning about COBOL programs,
          operating a mainframe environment, and designing the kind of
          low-latency infrastructure that sits in front of one.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/learn"
            className="rounded bg-terminal-green px-4 py-2 font-mono text-sm font-semibold text-[#0a0e14] hover:opacity-90"
          >
            Start learning →
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((p) => (
          <Link
            key={p.slug}
            href={`/learn/${p.slug}`}
            className="group rounded-lg border border-[#1f2933] bg-[#11161d] p-5 transition hover:border-terminal-blue"
          >
            <h2 className="mb-2 font-mono text-lg font-semibold text-white group-hover:text-terminal-blue">
              {p.title}
            </h2>
            <p className="text-sm text-[#a8a59b]">{p.blurb}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
