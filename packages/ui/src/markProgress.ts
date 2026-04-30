"use client";

export type ProgressUpdate = {
  lessonId: string;
  status: "passed" | "failed" | "in_progress";
  score?: number;
  submission?: { source: string; stdout?: string; stderr?: string };
};

export async function markProgress(update: ProgressUpdate): Promise<void> {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(update),
    });
  } catch {
    // signed-out users land here; queue locally so the next sign-in
    // can replay.
    try {
      const KEY = "cobol-mf:pending-progress";
      const raw = window.localStorage.getItem(KEY);
      const arr: ProgressUpdate[] = raw ? JSON.parse(raw) : [];
      arr.push(update);
      window.localStorage.setItem(KEY, JSON.stringify(arr));
    } catch {
      /* noop */
    }
  }
}
