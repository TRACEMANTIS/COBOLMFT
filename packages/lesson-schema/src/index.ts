import { z } from "zod";

export const Pillar = z.enum(["cobol", "mainframe", "networks"]);
export type Pillar = z.infer<typeof Pillar>;

export const PILLAR_TITLES: Record<Pillar, string> = {
  cobol: "COBOL the language",
  mainframe: "Mainframe concepts",
  networks: "Low-latency networks",
};

const SandboxRuntime = z.enum(["wasm", "server", "auto"]);

const CodeAssessment = z.object({
  kind: z.literal("code"),
  runtime: SandboxRuntime.default("auto"),
  starter: z.string().default(""),
  expectedOutput: z.string().optional(),
  expectedOutputRegex: z.string().optional(),
  hints: z.array(z.string()).default([]),
});

const QuizQuestion = z.object({
  prompt: z.string(),
  multi: z.boolean().default(false),
  options: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        correct: z.boolean().default(false),
        explanation: z.string().optional(),
      }),
    )
    .min(2),
});

const QuizAssessment = z.object({
  kind: z.literal("quiz"),
  questions: z.array(QuizQuestion).min(1),
});

const LabAssessment = z.object({
  kind: z.literal("lab"),
  lab: z.enum(["jcl", "latency", "switchsim"]),
  config: z.record(z.unknown()).default({}),
});

export const Assessment = z.discriminatedUnion("kind", [
  CodeAssessment,
  QuizAssessment,
  LabAssessment,
]);
export type Assessment = z.infer<typeof Assessment>;

export const LessonFrontmatter = z.object({
  pillar: Pillar,
  module: z.string(),
  slug: z.string(),
  order: z.number().int().nonnegative(),
  title: z.string(),
  summary: z.string(),
  estimatedMinutes: z.number().int().positive().default(15),
  prerequisites: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  assessment: Assessment.optional(),
});
export type LessonFrontmatter = z.infer<typeof LessonFrontmatter>;

export function lessonId(fm: Pick<LessonFrontmatter, "pillar" | "module" | "slug">): string {
  return `${fm.pillar}/${fm.module}/${fm.slug}`;
}
