"use client";

import { useMemo, useState } from "react";

export type SwitchSimProps = {
  defaultFrameBytes?: number;
  defaultLinkGbps?: number;
  defaultStoreFwdNs?: number;
  defaultCutThroughNs?: number;
};

function serializationNs(frameBytes: number, linkGbps: number): number {
  // bits / bps × 1e9 ns
  return (frameBytes * 8) / (linkGbps * 1e9) * 1e9;
}

export function SwitchSim({
  defaultFrameBytes = 1500,
  defaultLinkGbps = 10,
  defaultStoreFwdNs = 1500,
  defaultCutThroughNs = 350,
}: SwitchSimProps) {
  const [frameBytes, setFrameBytes] = useState(defaultFrameBytes);
  const [linkGbps, setLinkGbps] = useState(defaultLinkGbps);
  const [storeNs, setStoreNs] = useState(defaultStoreFwdNs);
  const [cutNs, setCutNs] = useState(defaultCutThroughNs);

  const ser = useMemo(
    () => serializationNs(frameBytes, linkGbps),
    [frameBytes, linkGbps],
  );
  const storeTotal = ser + storeNs;
  const cutTotal = cutNs;

  return (
    <div className="my-6 rounded-lg border border-[#1f2933] bg-[#0d1117] p-4">
      <h4 className="mb-3 font-mono text-xs uppercase text-[#a8a59b]">
        Switch latency: cut-through vs store-and-forward
      </h4>
      <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-sm md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-[#a8a59b]">Frame size (bytes)</span>
          <input
            type="number"
            value={frameBytes}
            min={64}
            max={9216}
            onChange={(e) => setFrameBytes(Number(e.target.value))}
            className="rounded bg-[#11161d] px-2 py-1 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[#a8a59b]">Link (Gbps)</span>
          <input
            type="number"
            value={linkGbps}
            min={0.1}
            step={0.1}
            onChange={(e) => setLinkGbps(Number(e.target.value))}
            className="rounded bg-[#11161d] px-2 py-1 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[#a8a59b]">Store-fwd switch (ns)</span>
          <input
            type="number"
            value={storeNs}
            onChange={(e) => setStoreNs(Number(e.target.value))}
            className="rounded bg-[#11161d] px-2 py-1 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[#a8a59b]">Cut-through switch (ns)</span>
          <input
            type="number"
            value={cutNs}
            onChange={(e) => setCutNs(Number(e.target.value))}
            className="rounded bg-[#11161d] px-2 py-1 outline-none"
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-[#1f2933] bg-[#11161d] p-3">
          <h5 className="mb-1 font-mono text-sm text-terminal-amber">
            Store-and-forward
          </h5>
          <p className="text-xs text-[#a8a59b]">
            Switch waits for the full frame before forwarding.
          </p>
          <p className="mt-2 font-mono text-sm">
            serialization {ser.toFixed(0)} ns + switch {storeNs} ns&nbsp;
            =&nbsp;
            <span className="text-terminal-amber">
              {storeTotal.toFixed(0)} ns
            </span>
          </p>
          <Bar ns={storeTotal} max={Math.max(storeTotal, cutTotal) * 1.1} colour="#ffb454" />
        </div>
        <div className="rounded border border-[#1f2933] bg-[#11161d] p-3">
          <h5 className="mb-1 font-mono text-sm text-terminal-green">
            Cut-through
          </h5>
          <p className="text-xs text-[#a8a59b]">
            Switch starts forwarding once the destination MAC is read.
          </p>
          <p className="mt-2 font-mono text-sm">
            switch only ={" "}
            <span className="text-terminal-green">{cutTotal.toFixed(0)} ns</span>
          </p>
          <Bar ns={cutTotal} max={Math.max(storeTotal, cutTotal) * 1.1} colour="#7fd962" />
        </div>
      </div>
    </div>
  );
}

function Bar({ ns, max, colour }: { ns: number; max: number; colour: string }) {
  const w = Math.min(100, (ns / max) * 100);
  return (
    <div className="mt-2 h-3 w-full overflow-hidden rounded bg-[#0a0e14]">
      <div style={{ width: `${w}%`, background: colour }} className="h-full" />
    </div>
  );
}
