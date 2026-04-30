import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { prisma } from "@/app/lib/db";
import { canManageUser, requireRole } from "@/app/lib/auth";
import type { Role, UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function inviteUser(formData: FormData) {
  "use server";
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const role = String(formData.get("role") ?? "MEMBER") as Role;
  if (!email) return;
  if (!canManageUser(actor.role, role)) return;

  const org = await prisma.org.findFirstOrThrow();
  const token = randomBytes(24).toString("hex");
  await prisma.invite.create({
    data: {
      orgId: org.id,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  revalidatePath("/admin/users");
}

async function changeRole(formData: FormData) {
  "use server";
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const userId = String(formData.get("userId"));
  const newRole = String(formData.get("role")) as Role;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (!canManageUser(actor.role, target.role)) return;
  if (!canManageUser(actor.role, newRole)) return;
  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/admin/users");
}

async function setStatus(formData: FormData) {
  "use server";
  const actor = await requireRole(["OWNER", "ADMIN"]);
  const userId = String(formData.get("userId"));
  const status = String(formData.get("status")) as UserStatus;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return;
  if (!canManageUser(actor.role, target.role)) return;
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
}

export default async function UsersAdmin() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { memberships: { include: { team: true } } },
  });
  const invites = await prisma.invite.findMany({
    where: { acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Users</h1>

      <section className="mb-8 rounded-lg border border-[#1f2933] bg-[#11161d] p-4">
        <h2 className="mb-3 font-mono text-xs uppercase text-[#a8a59b]">
          Invite a user
        </h2>
        <form action={inviteUser} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="email@example.com"
            className="flex-1 rounded border border-[#1f2933] bg-[#0a0e14] px-3 py-2 outline-none focus:border-terminal-blue"
          />
          <select
            name="role"
            defaultValue="MEMBER"
            className="rounded border border-[#1f2933] bg-[#0a0e14] px-3 py-2"
          >
            <option value="MEMBER">MEMBER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            type="submit"
            className="rounded bg-terminal-green px-4 py-2 font-mono text-sm font-semibold text-[#0a0e14]"
          >
            Create invite
          </button>
        </form>
      </section>

      {invites.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
            Pending invites
          </h2>
          <ul className="divide-y divide-[#1f2933] rounded-lg border border-[#1f2933] bg-[#11161d]">
            {invites.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 font-mono text-xs"
              >
                <span>{i.email} · {i.role}</span>
                <code className="break-all text-terminal-blue">
                  /invite/{i.token}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-mono text-xs uppercase text-[#a8a59b]">
          All users
        </h2>
        <table className="w-full overflow-hidden rounded-lg border border-[#1f2933] bg-[#11161d] text-sm">
          <thead className="bg-[#0d1117] text-left text-xs uppercase text-[#a8a59b]">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Teams</th>
              <th className="px-3 py-2">Last active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2933]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2 font-mono">{u.email}</td>
                <td className="px-3 py-2">
                  <form action={changeRole} className="flex gap-1">
                    <input type="hidden" name="userId" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="rounded bg-[#0a0e14] px-2 py-1 text-xs"
                      disabled={u.role === "OWNER"}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                      {u.role === "OWNER" && <option value="OWNER">OWNER</option>}
                    </select>
                    <button
                      type="submit"
                      className="rounded border border-[#1f2933] px-2 py-1 text-xs hover:border-terminal-blue"
                      disabled={u.role === "OWNER"}
                    >
                      save
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">{u.status}</td>
                <td className="px-3 py-2 text-xs text-[#a8a59b]">
                  {u.memberships.map((m) => m.team.name).join(", ") || "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[#a8a59b]">
                  {u.lastActiveAt?.toISOString().slice(0, 10) ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {u.role !== "OWNER" && (
                    <form action={setStatus}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={u.status === "DISABLED" ? "ACTIVE" : "DISABLED"}
                      />
                      <button
                        type="submit"
                        className="rounded border border-[#1f2933] px-2 py-1 text-xs hover:border-terminal-red hover:text-terminal-red"
                      >
                        {u.status === "DISABLED" ? "enable" : "disable"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
