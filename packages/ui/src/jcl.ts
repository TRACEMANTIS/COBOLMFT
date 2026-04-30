// Minimal educational JCL parser. Recognises JOB, EXEC, and DD cards
// and returns a step graph. Not a complete JCL grammar — purely a
// teaching aid.

export type JCLStep = {
  name: string;
  pgm?: string;
  proc?: string;
  dds: { name: string; spec: string }[];
};

export type ParsedJCL = {
  jobName?: string;
  steps: JCLStep[];
  errors: string[];
};

const JOB_RE = /^\/\/(\S+)\s+JOB\b/;
const EXEC_RE = /^\/\/(\S+)\s+EXEC\s+(.*)$/;
const DD_RE = /^\/\/(\S+)\s+DD\s+(.*)$/;
const CONT_RE = /^\/\/\s+(.*)$/;

function parseExecArgs(args: string): { pgm?: string; proc?: string } {
  const out: { pgm?: string; proc?: string } = {};
  for (const part of args.split(",")) {
    const [k, v] = part.split("=").map((s) => s.trim());
    if (!k || !v) {
      // bare PROC name
      if (k && !v) out.proc = k;
      continue;
    }
    if (k.toUpperCase() === "PGM") out.pgm = v;
    else if (k.toUpperCase() === "PROC") out.proc = v;
  }
  return out;
}

export function parseJCL(input: string): ParsedJCL {
  const lines = input.split(/\r?\n/);
  const result: ParsedJCL = { steps: [], errors: [] };
  let currentStep: JCLStep | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!line.startsWith("//")) continue;
    if (line.startsWith("//*")) continue;
    if (line === "//") continue;

    const job = line.match(JOB_RE);
    if (job) {
      result.jobName = job[1];
      continue;
    }

    const exec = line.match(EXEC_RE);
    if (exec) {
      if (currentStep) result.steps.push(currentStep);
      const args = parseExecArgs(exec[2] ?? "");
      currentStep = {
        name: exec[1] ?? `STEP${result.steps.length + 1}`,
        pgm: args.pgm,
        proc: args.proc,
        dds: [],
      };
      continue;
    }

    const dd = line.match(DD_RE);
    if (dd) {
      if (!currentStep) {
        result.errors.push(`DD card '${dd[1]}' before any EXEC step`);
        continue;
      }
      currentStep.dds.push({ name: dd[1] ?? "?", spec: (dd[2] ?? "").trim() });
      continue;
    }

    const cont = line.match(CONT_RE);
    if (cont && currentStep && currentStep.dds.length > 0) {
      const last = currentStep.dds[currentStep.dds.length - 1]!;
      last.spec = `${last.spec} ${cont[1]?.trim() ?? ""}`.trim();
      continue;
    }
  }
  if (currentStep) result.steps.push(currentStep);

  if (result.steps.length === 0 && !result.errors.length) {
    result.errors.push("No EXEC steps found.");
  }
  return result;
}

export function stepNames(p: ParsedJCL): string[] {
  return p.steps.map((s) => s.name);
}
