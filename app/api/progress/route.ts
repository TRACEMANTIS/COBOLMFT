import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const Body = z.object({
  lessonId: z.string().min(3),
  status: z.enum(["passed", "failed", "in_progress"]),
  score: z.number().min(0).max(1).optional(),
  submission: z
    .object({
      source: z.string().max(64_000),
      stdout: z.string().max(64_000).optional(),
      stderr: z.string().max(64_000).optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await auth();
  const userId = session?.user && (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ attempts: [] });
  const attempts = await prisma.lessonAttempt.findMany({ where: { userId } });
  return NextResponse.json({ attempts });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user && (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { lessonId, status, score, submission } = parsed.data;

  await prisma.lessonAttempt.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, status, score: score ?? null },
    update: { status, score: score ?? null, lastAttemptAt: new Date() },
  });
  if (submission) {
    await prisma.submission.create({
      data: {
        userId,
        lessonId,
        source: submission.source,
        stdout: submission.stdout ?? null,
        stderr: submission.stderr ?? null,
        passed: status === "passed",
      },
    });
  }
  return NextResponse.json({ ok: true });
}
