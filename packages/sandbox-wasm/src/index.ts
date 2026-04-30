// GnuCOBOL → WebAssembly bundle.
//
// Per the platform plan, the emscripten build of GnuCOBOL is non-trivial
// and we ship the WASM path behind a feature flag. When a real
// `cobc.wasm` is dropped under `packages/sandbox-wasm/dist/`, set
// NEXT_PUBLIC_COBOL_WASM=1 (or load it dynamically here) and the
// CodeLab will route to it. Until then we report unavailable and the
// sandbox client falls through to the server runner.

export type WasmRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
};

export async function isWasmAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((globalThis as any).__COBOL_MF_WASM_READY__);
}

export async function compileAndRun(
  _source: string,
  _stdin?: string,
): Promise<WasmRunResult> {
  return {
    stdout: "",
    stderr:
      "GnuCOBOL WASM bundle not present. Drop a built cobc.wasm into packages/sandbox-wasm/dist and wire it up here, or use the server runner.",
    exitCode: -1,
    durationMs: 0,
  };
}
