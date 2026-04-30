#!/bin/sh
set -e
cp /in/prog.cob /work/prog.cob
cd /work
cobc -x -free -o prog prog.cob 2>compile.err || {
  cat compile.err >&2
  exit 1
}
if [ -f /in/stdin ]; then
  exec ./prog < /in/stdin
fi
exec ./prog
