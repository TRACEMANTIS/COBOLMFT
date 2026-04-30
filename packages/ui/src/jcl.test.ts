import { describe, it, expect } from "vitest";
import { parseJCL, stepNames } from "./jcl";

describe("parseJCL", () => {
  it("parses JOB + multiple EXEC steps + DD cards", () => {
    const src = `//PAY      JOB  (ACCT),'NIGHTLY',CLASS=A
//STEP1    EXEC PGM=SORTIN
//SYSIN    DD   *
//STEP2    EXEC PGM=COMPUTE
//INFILE   DD   DSN=PAY.SORTED,DISP=SHR
//OUTFILE  DD   DSN=PAY.RESULT,DISP=(NEW,CATLG)
//STEP3    EXEC PGM=PRINT
//SYSPRINT DD   SYSOUT=*`;
    const p = parseJCL(src);
    expect(p.errors).toEqual([]);
    expect(p.jobName).toBe("PAY");
    expect(stepNames(p)).toEqual(["STEP1", "STEP2", "STEP3"]);
    expect(p.steps[1]?.dds.map((d) => d.name)).toEqual(["INFILE", "OUTFILE"]);
  });

  it("flags DD before any EXEC", () => {
    const src = `//FOO      JOB
//ROGUE    DD   DSN=NOWHERE`;
    const p = parseJCL(src);
    expect(p.errors[0]).toMatch(/before any EXEC/);
  });

  it("returns no-EXEC error on JOB-only", () => {
    const p = parseJCL("//ONLY     JOB");
    expect(p.errors[0]).toMatch(/No EXEC/);
  });
});
