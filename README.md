# COBOL-MF

An interactive learning platform for COBOL, mainframe management, and
low-latency network design.

## Vision

A single, hands-on platform that takes a learner from "I have never seen
a green screen" to "I can read, write, and reason about COBOL programs,
operate a mainframe environment, and design the kind of low-latency
infrastructure that sits in front of one." Reading is not enough -
every concept should have an exercise, a sandbox, or a measurable
outcome attached to it.

## Audience

- Developers from distributed/cloud backgrounds learning the mainframe.
- Operators and SREs who need to manage z/OS-style workloads.
- Network and hardware engineers entering low-latency / financial
  infrastructure work.
- Career switchers and students filling the well-known mainframe
  talent gap.

## Pillars

The platform is organized into three pillars. Each pillar is a track
of progressive modules, each module ends with a graded lab.

### 1. COBOL the language

- Program structure: divisions, sections, paragraphs.
- Data: PIC clauses, levels, REDEFINES, OCCURS, COMP / COMP-3 (packed
  decimal), USAGE, copybooks.
- Procedure division: PERFORM, control flow, file I/O, string handling,
  arithmetic semantics (decimal precision, ROUNDED, ON SIZE ERROR).
- File organizations: sequential, indexed (VSAM KSDS/ESDS/RRDS),
  relative.
- Subprograms, CALL, LINKAGE SECTION, static vs dynamic linkage.
- Embedded SQL (DB2) and embedded CICS (EXEC CICS).
- Error handling, ABENDs, condition handling.
- Reading legacy code: idioms, dead code, GOTO patterns, common
  anti-patterns and how to refactor them safely.
- (suggested) Modern COBOL: free-format source, OO COBOL, GnuCOBOL
  vs IBM Enterprise COBOL differences.
- (suggested) Companion languages: JCL, REXX, and a brief look at
  HLASM and PL/I so learners can navigate a real shop.

### 2. Mainframe concepts and management

- Hardware lineage: System/360 to IBM Z, why the architecture endures.
- z/OS architecture: address spaces, dispatcher, SRBs, storage keys,
  supervisor vs problem state.
- Virtualization: LPARs, PR/SM, z/VM, KVM on Z.
- The user environment: TSO, ISPF, SDSF, JCL job lifecycle, JES2/JES3
  spool.
- Subsystems: CICS (online transactions), IMS (hierarchical DB and
  TM), DB2 for z/OS, MQ.
- Storage: DASD, tape, HSM, storage hierarchy, dataset types and
  catalogs.
- Security: RACF (and ACF2 / Top Secret in passing), SAF, dataset
  and resource profiles.
- Availability: Parallel Sysplex, Coupling Facility, GDPS, disaster
  recovery patterns.
- Operations: IPL, system gen / HCD, SMF and RMF, capacity (MIPS,
  MSU, sub-capacity pricing), workload manager (WLM).
- (suggested) DevOps on the mainframe: source control (Endevor,
  ChangeMan, Git on z/OS via RTC / Zowe), CI/CD pipelines, automated
  testing of batch.
- (suggested) Modernization: zOS Connect, COBOL/Java interop,
  exposing CICS as REST, replatforming vs refactoring vs rewriting.
- (suggested) Hands-on environments: Hercules emulator, IBM Z Xplore,
  IBM Z Trial, Zowe CLI - so learners actually touch a system.

### 3. Low-latency networks and hardware

- The latency budget: where nanoseconds and microseconds come from
  and where they go.
- Physical layer: fiber vs copper vs DAC, cable length math, optical
  transceivers, layer-1 switches (Metamako-class, Arista 7130).
- Switching: cut-through vs store-and-forward, port-to-port latency,
  buffer behavior, multicast handling.
- NICs: kernel bypass stacks (Solarflare Onload, DPDK), RDMA / RoCE /
  InfiniBand, smartNICs and FPGA acceleration.
- Host tuning: NUMA, CPU pinning and isolation, huge pages, IRQ
  affinity, busy polling, cache locality, lock-free data structures.
- Time: PTP / IEEE 1588, GPS-disciplined clocks, timestamping in
  NICs and switches, why clock quality matters for measurement.
- Protocols in the wild: TCP tuning, UDP multicast, FIX, FAST, ITCH,
  OUCH, and the broader market-data / order-entry pattern.
- (suggested) Wide-area low latency: microwave links, shortwave,
  hollow-core fiber, route selection between major financial hubs.
- (suggested) Measurement and verification: hardware taps, packet
  capture at line rate, latency histograms (HdrHistogram-style),
  jitter and tail behavior - not just the median.
- (suggested) Colocation and cross-connects: how exchanges, banks,
  and carriers actually wire up in NY4, LD4, TY3, etc.

## Cross-cutting design choices

- (suggested) **Why these three together.** Mainframes still run the
  back office at most banks, insurers, airlines, and large government
  systems; low-latency networks sit at the front of the same
  industry. Teaching them as a single stack gives learners a coherent
  picture of how a real institution is wired, not three disjoint
  curricula.
- (suggested) **Project-based capstone per pillar.** For example:
  port a CSV-driven batch job to COBOL + JCL; configure a small
  multi-LPAR sysplex in an emulator; design and measure a
  sub-microsecond market-data fan-out. A capstone forces synthesis
  in a way modules alone do not.
- (suggested) **Assessment and progression.** Tracks, prerequisites,
  badges or certificates, and a clear "you are here" map so learners
  do not get lost in a sea of content.
- (suggested) **Sandbox-first pedagogy.** Every module ships with a
  reproducible environment (container, emulator config, or hosted
  lab) so learners never have to fight setup before learning.

## Open questions

- Delivery format: web app, desktop, IDE plugin, or something else?
- Hosted labs vs bring-your-own environment - hosted is friendlier
  but expensive at scale, especially for z/OS.
- Licensing: IBM Enterprise COBOL and z/OS are not free; GnuCOBOL
  and Hercules cover a lot but not everything. How do we handle
  the gap?
- Audience tilt: do we lean toward enterprise developers, students,
  or career-switchers? The right tilt changes pacing and depth.
- Business model, if any: free, freemium, institutional licensing.

## Status

This branch lands the v1 platform scaffold: a Next.js + TypeScript
monorepo, lesson schema + MDX content loader, sandboxed COBOL
execution (server runner; WASM behind a feature flag), tenancy with
admin UI, NextAuth credentials sign-in, and a one-shot AWS deploy
script.

## Running locally

Prereqs: Node 22, pnpm 9, Docker.

```bash
cp .env.example .env.local
docker compose up -d postgres
docker build -t cobol-mf/cobol-runtime:latest -f services/runner/Dockerfile.cobol services/runner
pnpm install
pnpm prisma migrate dev
BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
BOOTSTRAP_ADMIN_PASSWORD=changeme-please \
  pnpm prisma:seed
pnpm dev
```

Visit `http://localhost:3000`. Sign in with the admin credentials you
seeded.

## Deploying to AWS

```bash
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
  ./scripts/deploy.sh --region us-east-1 --git-repo https://github.com/you/cobol-mf.git
```

The script provisions an EC2 host, installs Docker + nginx, brings up
the app, and prints the public URL plus the OWNER credentials.

## Layout

| Path                              | What                                           |
| --------------------------------- | ---------------------------------------------- |
| `app/`                            | Next.js App Router pages + API routes          |
| `content/<pillar>/<lesson>/`      | MDX lessons with typed frontmatter             |
| `packages/lesson-schema/`         | Zod schemas, single source of truth            |
| `packages/sandbox-client/`        | Picks WASM or server, called from CodeLab      |
| `packages/sandbox-wasm/`          | GnuCOBOL → WASM stub (drop-in slot)            |
| `packages/ui/`                    | CodeLab, Quiz, JCLLab, LatencyBudget, SwitchSim |
| `services/runner/`                | Hono service that shells `docker run`          |
| `prisma/`                         | Schema + first-boot seed                       |
| `infra/terraform/`                | AWS deploy module                              |
| `scripts/deploy.sh`               | One-shot wrapper                               |

---

Items marked `(suggested)` were added during the initial draft and
have not yet been confirmed by the project owner. Strike or keep as
appropriate.
