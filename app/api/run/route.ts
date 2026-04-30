import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/lib/auth";

const RunBody = z.object({
  source: z.string().max(64_000),
  stdin: z.string().max(16_000).optional(),
});

const RUNNER_URL = process.env.RUNNER_URL;

const buckets = new Map<string, { count: number; resetAt: number }>();
const RATE = { window: 60_000, max: 10 };

function rateLimit(key: string): boolean {
  const now = Date.now();
  const cur = buckets.get(key);
  if (!cur || cur.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE.window });
    return true;
  }
  if (cur.count >= RATE.max) return false;
  cur.count += 1;
  return true;
}

export async function POST(req: Request) {
  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? "anon";
  if (!rateLimit(userId)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = RunBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  if (!RUNNER_URL) {
    return NextResponse.json(
      {
        stdout: "",
        stderr:
          "Server runner is not configured (RUNNER_URL unset). Set it to the cobol-mf runner service URL.",
        exitCode: -1,
        durationMs: 0,
      },
      { status: 200 },
    );
  }
  try {
    const upstream = await fetch(`${RUNNER_URL}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        stdout: "",
        stderr: `runner unreachable: ${(err as Error).message}`,
        exitCode: -1,
        durationMs: 0,
      },
      { status: 502 },
    );
  }
}
