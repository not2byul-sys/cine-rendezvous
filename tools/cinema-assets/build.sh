#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${BLENDER_BIN:-}" ]]; then
  if [[ -x /Applications/Blender.app/Contents/MacOS/Blender ]]; then
    BLENDER_BIN=/Applications/Blender.app/Contents/MacOS/Blender
  else
    BLENDER_BIN=$(command -v blender) || {
      echo 'Set BLENDER_BIN to the Blender executable.' >&2
      exit 1
    }
  fi
fi
exec "$BLENDER_BIN" --background --factory-startup --python-exit-code 1 \
  --python "$here/build.py" -- --output "$here/../../assets/cinema" "$@"
