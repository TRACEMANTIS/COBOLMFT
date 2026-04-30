import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  LessonFrontmatter,
  PILLAR_TITLES,
  Pillar,
  lessonId,
} from "@cobol-mf/lesson-schema";

export type Lesson = LessonFrontmatter & {
  body: string;
  href: string;
};

export type PillarTree = {
  pillar: Pillar;
  title: string;
  modules: { module: string; lessons: Lesson[] }[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

let cache: Lesson[] | null = null;

function loadAll(): Lesson[] {
  if (cache) return cache;
  if (!fs.existsSync(CONTENT_ROOT)) {
    cache = [];
    return cache;
  }

  const lessons: Lesson[] = [];
  for (const pillar of fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })) {
    if (!pillar.isDirectory()) continue;
    const pillarDir = path.join(CONTENT_ROOT, pillar.name);
    for (const lessonDir of fs.readdirSync(pillarDir, { withFileTypes: true })) {
      if (!lessonDir.isDirectory()) continue;
      const file = path.join(pillarDir, lessonDir.name, "index.mdx");
      if (!fs.existsSync(file)) continue;
      const raw = fs.readFileSync(file, "utf8");
      const { data, content } = matter(raw);
      const parsed = LessonFrontmatter.safeParse({
        ...data,
        pillar: pillar.name,
        slug: lessonDir.name,
      });
      if (!parsed.success) {
        throw new Error(
          `Invalid frontmatter in ${file}: ${parsed.error.message}`,
        );
      }
      lessons.push({
        ...parsed.data,
        body: content,
        href: `/learn/${parsed.data.pillar}/${parsed.data.module}/${parsed.data.slug}`,
      });
    }
  }
  lessons.sort((a, b) => {
    if (a.pillar !== b.pillar) return a.pillar.localeCompare(b.pillar);
    if (a.module !== b.module) return a.module.localeCompare(b.module);
    return a.order - b.order;
  });
  cache = lessons;
  return lessons;
}

export function getAllLessons(): Lesson[] {
  return loadAll();
}

export function getLesson(
  pillar: string,
  module: string,
  slug: string,
): Lesson | undefined {
  return loadAll().find(
    (l) => l.pillar === pillar && l.module === module && l.slug === slug,
  );
}

export function getPillarTree(): PillarTree[] {
  const all = loadAll();
  const byPillar = new Map<Pillar, Lesson[]>();
  for (const l of all) {
    const list = byPillar.get(l.pillar) ?? [];
    list.push(l);
    byPillar.set(l.pillar, list);
  }
  const order: Pillar[] = ["cobol", "mainframe", "networks"];
  return order.map((pillar) => {
    const lessons = byPillar.get(pillar) ?? [];
    const moduleMap = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const list = moduleMap.get(l.module) ?? [];
      list.push(l);
      moduleMap.set(l.module, list);
    }
    return {
      pillar,
      title: PILLAR_TITLES[pillar],
      modules: [...moduleMap.entries()].map(([module, lessons]) => ({
        module,
        lessons,
      })),
    };
  });
}

export function neighbors(lesson: Lesson) {
  const all = loadAll();
  const inPillar = all.filter((l) => l.pillar === lesson.pillar);
  const idx = inPillar.findIndex((l) => lessonId(l) === lessonId(lesson));
  return {
    prev: idx > 0 ? inPillar[idx - 1] : undefined,
    next: idx < inPillar.length - 1 ? inPillar[idx + 1] : undefined,
  };
}
