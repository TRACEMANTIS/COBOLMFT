import { notFound, redirect } from "next/navigation";
import { hashSync } from "bcryptjs";
import { prisma } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function accept(token: string, formData: FormData) {
  "use server";
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return;

  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || invite.email.split("@")[0]!;
  if (password.length < 8) return;

  const user = await prisma.user.upsert({
    where: { email: invite.email },
    create: {
      orgId: invite.orgId,
      email: invite.email,
      name,
      passwordHash: hashSync(password, 10),
      role: invite.role,
      status: "ACTIVE",
    },
    update: {
      passwordHash: hashSync(password, 10),
      status: "ACTIVE",
      role: invite.role,
    },
  });
  if (invite.teamId) {
    await prisma.membership.upsert({
      where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
      create: { userId: user.id, teamId: invite.teamId },
      update: {},
    });
  }
  await prisma.invite.update({
    where: { token },
    data: { acceptedAt: new Date() },
  });
  redirect("/login");
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) notFound();
  const expired = invite.acceptedAt !== null || invite.expiresAt < new Date();

  return (
    <div className="mx-auto mt-16 max-w-sm px-6">
      <h1 className="mb-2 text-2xl font-bold text-white">Accept invite</h1>
      <p className="mb-6 text-sm text-[#a8a59b]">
        {invite.email} · role {invite.role}
      </p>
      {expired ? (
        <p className="text-terminal-red">
          This invite has expired or already been used.
        </p>
      ) : (
        <form action={accept.bind(null, token)} className="space-y-3">
          <input
            name="name"
            placeholder="display name (optional)"
            className="w-full rounded border border-[#1f2933] bg-[#11161d] px-3 py-2 outline-none focus:border-terminal-blue"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="password (min 8 chars)"
            className="w-full rounded border border-[#1f2933] bg-[#11161d] px-3 py-2 outline-none focus:border-terminal-blue"
          />
          <button
            type="submit"
            className="w-full rounded bg-terminal-green py-2 font-mono text-sm font-semibold text-[#0a0e14]"
          >
            Accept and sign in
          </button>
        </form>
      )}
    </div>
  );
}
