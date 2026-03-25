#!/bin/sh

set -eu

if command -v python >/dev/null 2>&1; then
  exec python "$@"
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$@"
fi

echo "python 또는 python3 명령을 찾을 수 없습니다." >&2
exit 1
