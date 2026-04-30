import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.org.findFirst();
  if (existing) {
    console.log(`[seed] org already exists: ${existing.name} (${existing.id})`);
    return;
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set on first run.",
    );
  }

  console.log(`[seed] creating org + OWNER ${email}`);
  const org = await prisma.org.create({
    data: { name: "COBOL-MF" },
  });
  const team = await prisma.team.create({
    data: { orgId: org.id, name: "All" },
  });
  const owner = await prisma.user.create({
    data: {
      orgId: org.id,
      email,
      name: "Admin",
      passwordHash: hashSync(password, 10),
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.membership.create({
    data: { userId: owner.id, teamId: team.id },
  });
  console.log(`[seed] done: org=${org.id} owner=${owner.id} team=${team.id}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
