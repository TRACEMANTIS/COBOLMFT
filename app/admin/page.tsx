import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [userCount, teamCount, attemptCount, recent] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.lessonAttempt.count({ where: { status: "passed" } }),
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Admin</h1>
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Stat label="Users" value={userCount} />
        <Stat label="Teams" value={teamCount} />
        <Stat label="Lessons passed" value={attemptCount} />
      </div>
      <h2 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
        Recent submissions
      </h2>
      <ul className="rounded-lg border border-[#1f2933] bg-[#11161d] divide-y divide-[#1f2933]">
        {recent.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="font-mono text-[#a8a59b]">
              {s.user.email} · {s.lessonId}
            </span>
            <span className={s.passed ? "text-terminal-green" : "text-terminal-red"}>
              {s.passed ? "✓" : "✗"} {s.createdAt.toISOString().slice(0, 19)}
            </span>
          </li>
        ))}
        {recent.length === 0 && (
          <li className="px-4 py-3 text-sm text-[#a8a59b]">No submissions yet.</li>
        )}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#1f2933] bg-[#11161d] p-4">
      <p className="text-xs uppercase text-[#a8a59b]">{label}</p>
      <p className="mt-1 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}
