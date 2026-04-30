import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

async function createTeam(formData: FormData) {
  "use server";
  await requireRole(["OWNER", "ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const org = await prisma.org.findFirstOrThrow();
  await prisma.team.create({ data: { orgId: org.id, name } });
  revalidatePath("/admin/teams");
}

async function deleteTeam(formData: FormData) {
  "use server";
  await requireRole(["OWNER", "ADMIN"]);
  const teamId = String(formData.get("teamId"));
  await prisma.team.delete({ where: { id: teamId } });
  revalidatePath("/admin/teams");
}

async function addMember(formData: FormData) {
  "use server";
  await requireRole(["OWNER", "ADMIN"]);
  const teamId = String(formData.get("teamId"));
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;
  await prisma.membership.upsert({
    where: { userId_teamId: { userId: user.id, teamId } },
    create: { userId: user.id, teamId },
    update: {},
  });
  revalidatePath("/admin/teams");
}

async function removeMember(formData: FormData) {
  "use server";
  await requireRole(["OWNER", "ADMIN"]);
  const teamId = String(formData.get("teamId"));
  const userId = String(formData.get("userId"));
  await prisma.membership.deleteMany({ where: { teamId, userId } });
  revalidatePath("/admin/teams");
}

export default async function TeamsAdmin() {
  const teams = await prisma.team.findMany({
    include: { memberships: { include: { user: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Teams</h1>

      <section className="mb-8 rounded-lg border border-[#1f2933] bg-[#11161d] p-4">
        <h2 className="mb-3 font-mono text-xs uppercase text-[#a8a59b]">
          New team
        </h2>
        <form action={createTeam} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="team name"
            className="flex-1 rounded border border-[#1f2933] bg-[#0a0e14] px-3 py-2 outline-none focus:border-terminal-blue"
          />
          <button
            type="submit"
            className="rounded bg-terminal-green px-4 py-2 font-mono text-sm font-semibold text-[#0a0e14]"
          >
            Create
          </button>
        </form>
      </section>

      <section className="space-y-6">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border border-[#1f2933] bg-[#11161d] p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-lg text-white">{t.name}</h3>
              {t.name !== "All" && (
                <form action={deleteTeam}>
                  <input type="hidden" name="teamId" value={t.id} />
                  <button
                    type="submit"
                    className="text-xs text-terminal-red hover:underline"
                  >
                    delete
                  </button>
                </form>
              )}
            </div>
            <ul className="mb-3 space-y-1 text-sm">
              {t.memberships.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span className="font-mono">{m.user.email}</span>
                  <form action={removeMember}>
                    <input type="hidden" name="teamId" value={t.id} />
                    <input type="hidden" name="userId" value={m.user.id} />
                    <button className="text-xs text-[#a8a59b] hover:text-terminal-red">
                      remove
                    </button>
                  </form>
                </li>
              ))}
              {t.memberships.length === 0 && (
                <li className="text-xs text-[#a8a59b]">no members</li>
              )}
            </ul>
            <form action={addMember} className="flex gap-2">
              <input type="hidden" name="teamId" value={t.id} />
              <input
                name="email"
                type="email"
                placeholder="user@example.com"
                className="flex-1 rounded border border-[#1f2933] bg-[#0a0e14] px-3 py-1 text-sm outline-none focus:border-terminal-blue"
              />
              <button className="rounded border border-[#1f2933] px-3 py-1 text-sm hover:border-terminal-blue">
                + add
              </button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}
