import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export type ProgressEntry = {
  status: "passed" | "failed" | "in_progress" | "not_started";
  score?: number;
};

export type ProgressMap = Map<string, ProgressEntry>;

export async function getProgressMap(): Promise<ProgressMap> {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id;
  const map: ProgressMap = new Map();
  if (!userId) return map;
  const attempts = await prisma.lessonAttempt.findMany({ where: { userId } });
  for (const a of attempts) {
    map.set(a.lessonId, {
      status: a.status as ProgressEntry["status"],
      score: a.score ?? undefined,
    });
  }
  return map;
}
