import { describe, it, expect } from "vitest";
import {
  componentNs,
  copperNs,
  fiberNs,
  formatLatency,
  totalNs,
} from "./latency";

describe("latency", () => {
  it("fiber adds ~5 µs per km", () => {
    const ns = fiberNs(1000);
    expect(ns).toBeGreaterThan(4_900);
    expect(ns).toBeLessThan(5_100);
  });

  it("copper is slightly slower than fiber over the same distance", () => {
    expect(copperNs(1000)).toBeGreaterThan(fiberNs(1000));
  });

  it("totalNs sums components", () => {
    const ns = totalNs([
      { kind: "fiber", meters: 100 },
      { kind: "switch", ns: 350, mode: "cut-through" },
      { kind: "nic", ns: 800 },
    ]);
    expect(ns).toBeGreaterThan(0);
    expect(ns).toBe(componentNs({ kind: "fiber", meters: 100 }) + 350 + 800);
  });

  it("formats nanoseconds, microseconds, milliseconds", () => {
    expect(formatLatency(500)).toBe("500 ns");
    expect(formatLatency(1500)).toBe("1.50 µs");
    expect(formatLatency(2_500_000)).toBe("2.50 ms");
  });
});
