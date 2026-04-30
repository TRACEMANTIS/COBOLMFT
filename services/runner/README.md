# cobol-mf runner

Tiny HTTP service that compiles and runs a COBOL source string in an
isolated container, then returns stdout/stderr/exitCode.

## How it works

`POST /run { source, stdin? }` — writes the source to a temp dir,
shells out to:

```
docker run --rm --network=none --read-only --memory=256m --cpus=0.5 \
  --pids-limit=64 --tmpfs /work:rw,size=32m \
  -v $tmpdir:/in:ro cobol-mf/cobol-runtime:latest
```

The `cobol-mf/cobol-runtime` image is built from `Dockerfile.cobol` and
contains GnuCOBOL + libvbisam. The image's entrypoint compiles
`/in/prog.cob` then executes the binary.

## Building the runtime image

```
docker build -t cobol-mf/cobol-runtime:latest -f Dockerfile.cobol .
```

## Production caveats

- This service shells out to `docker run`. In docker-compose dev that
  works by mounting the host docker socket (set in the root
  compose file).
- For production hardening you want one of:
  - A sibling Docker host the runner can reach over TCP/TLS.
  - Firecracker microVMs (`firecracker-containerd`).
  - A managed sandbox like e2b.dev.
- We ship the dev pattern; the cloud deploy script also uses it
  because the EC2 host runs both the app and Docker.

## Configuration

| env                  | default                              |
| -------------------- | ------------------------------------ |
| `COBOL_IMAGE`        | `cobol-mf/cobol-runtime:latest`      |
| `PORT`               | `8080`                               |
| `RUNNER_TIMEOUT_MS`  | `10000`                              |
