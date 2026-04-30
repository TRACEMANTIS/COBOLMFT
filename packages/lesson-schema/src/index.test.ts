import { describe, it, expect } from "vitest";
import { LessonFrontmatter, lessonId } from "./index";

describe("LessonFrontmatter", () => {
  it("accepts a code lesson", () => {
    const r = LessonFrontmatter.parse({
      pillar: "cobol",
      module: "fundamentals",
      slug: "01-hello-world",
      order: 1,
      title: "Hello",
      summary: "first program",
      objectives: ["display"],
      assessment: {
        kind: "code",
        runtime: "server",
        starter: "DISPLAY HELLO.",
        expectedOutput: "HELLO",
      },
    });
    expect(r.assessment?.kind).toBe("code");
    expect(lessonId(r)).toBe("cobol/fundamentals/01-hello-world");
  });

  it("rejects an unknown pillar", () => {
    const r = LessonFrontmatter.safeParse({
      pillar: "rust",
      module: "x",
      slug: "y",
      order: 1,
      title: "t",
      summary: "s",
    });
    expect(r.success).toBe(false);
  });

  it("accepts a quiz with two options minimum", () => {
    const r = LessonFrontmatter.parse({
      pillar: "mainframe",
      module: "fundamentals",
      slug: "z",
      order: 2,
      title: "t",
      summary: "s",
      assessment: {
        kind: "quiz",
        questions: [
          {
            prompt: "?",
            options: [
              { id: "a", label: "yes", correct: true },
              { id: "b", label: "no" },
            ],
          },
        ],
      },
    });
    expect(r.assessment?.kind).toBe("quiz");
  });
});
