// Pure latency budget math. Every value in nanoseconds.

export type LatencyComponent =
  | { kind: "fiber"; meters: number }
  | { kind: "copper"; meters: number }
  | { kind: "switch"; ns: number; mode?: "cut-through" | "store-and-forward" }
  | { kind: "nic"; ns: number }
  | { kind: "host"; ns: number }
  | { kind: "custom"; label: string; ns: number };

const C_VACUUM = 299_792_458; // m/s
const FIBER_VOP = 0.67; // velocity-of-propagation in single-mode fiber
const COPPER_VOP = 0.6;

export function fiberNs(meters: number): number {
  return (meters / (C_VACUUM * FIBER_VOP)) * 1e9;
}

export function copperNs(meters: number): number {
  return (meters / (C_VACUUM * COPPER_VOP)) * 1e9;
}

export function componentNs(c: LatencyComponent): number {
  switch (c.kind) {
    case "fiber":
      return fiberNs(c.meters);
    case "copper":
      return copperNs(c.meters);
    case "switch":
    case "nic":
    case "host":
    case "custom":
      return c.ns;
  }
}

export function totalNs(components: LatencyComponent[]): number {
  return components.reduce((acc, c) => acc + componentNs(c), 0);
}

export function formatLatency(ns: number): string {
  if (ns >= 1e6) return `${(ns / 1e6).toFixed(2)} ms`;
  if (ns >= 1e3) return `${(ns / 1e3).toFixed(2)} µs`;
  return `${ns.toFixed(0)} ns`;
}
